import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

type Zone = "stack" | "micro" | "macro" | "output";

interface Step {
  label: string;
  detail: string;
  stack: string[];
  micro: string[];
  macro: string[];
  output: string[];
}

const DEMO_STEPS: Step[] = [
  {
    label: "Run synchronous code",
    detail: "console.log('A') executes immediately on the call stack.",
    stack: ["log('A')"],
    micro: [],
    macro: [],
    output: ["A"],
  },
  {
    label: "Schedule macrotask",
    detail: "setTimeout(..., 0) registers a callback in the task (macrotask) queue.",
    stack: ["setTimeout(fn)"],
    micro: [],
    macro: ["timeout → log('B')"],
    output: ["A"],
  },
  {
    label: "Schedule microtask",
    detail: "Promise.then registers a microtask — runs before the next macrotask.",
    stack: ["Promise.then"],
    micro: ["then → log('C')"],
    macro: ["timeout → log('B')"],
    output: ["A"],
  },
  {
    label: "More sync code",
    detail: "console.log('D') runs before any queued async work.",
    stack: ["log('D')"],
    micro: ["then → log('C')"],
    macro: ["timeout → log('B')"],
    output: ["A", "D"],
  },
  {
    label: "Stack empty → microtasks",
    detail: "Event loop drains the microtask queue completely.",
    stack: [],
    micro: [],
    macro: ["timeout → log('B')"],
    output: ["A", "D", "C"],
  },
  {
    label: "Next macrotask",
    detail: "Only then does setTimeout fire — output order A, D, C, B.",
    stack: [],
    micro: [],
    macro: [],
    output: ["A", "D", "C", "B"],
  },
];

const SAMPLE_CODE = `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`;

function ZoneList(props: { title: string; items: string[]; tone?: Zone }) {
  return (
    <div class="mw-el-zone" data-tone={props.tone}>
      <h4>{props.title}</h4>
      <ul class="mw-el-list">
        <For each={props.items} fallback={<li class="mw-el-empty">empty</li>}>
          {(item) => <li>{item}</li>}
        </For>
      </ul>
    </div>
  );
}

export function EventLoopSimulator() {
  const [stepIndex, setStepIndex] = createSignal(0);
  const step = () => DEMO_STEPS[stepIndex()];

  return (
    <WidgetShell
      title="Event loop"
      instructorNotes="Classic interview question: A, D, C, B. Tie to TanStack Query refetch scheduling and SSE callbacks in radar."
    >
      {(mode) => (
        <div class="mw-event-loop">
          <pre class="mw-el-code">{SAMPLE_CODE}</pre>

          <div class="mw-toolbar">
            <button type="button" onClick={() => setStepIndex(0)}>
              Reset
            </button>
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(i + 1, DEMO_STEPS.length - 1))}
              disabled={stepIndex() >= DEMO_STEPS.length - 1}
            >
              Next phase
            </button>
          </div>

          <p class="mw-hint">
            <strong>{step().label}.</strong> {step().detail}
          </p>

          <div class="mw-el-grid">
            <ZoneList title="Call stack" items={step().stack} tone="stack" />
            <ZoneList title="Microtask queue" items={step().micro} tone="micro" />
            <ZoneList title="Macrotask queue" items={step().macro} tone="macro" />
            <ZoneList title="Console output" items={step().output} tone="output" />
          </div>

          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: predict output before stepping. Why does TanStack Query feel "async" but
              SolidJS updates still run on one thread?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
