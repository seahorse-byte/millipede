import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STACKS = [
  { context: "Teaching event-driven design", pick: "Millipede PDF stack", avoid: "Enterprise BFF rewrite" },
  { context: "Snyk entitlements + Cerberus", pick: "maverick-ui patterns", avoid: "Replacing Rust gateway" },
  { context: "AI agent eval CI", pick: "evals/ gate", avoid: "Blocking on LLM vendor lock-in" },
] as const;

export function StackDecisionRubric() {
  const [index, setIndex] = createSignal(0);
  const row = () => STACKS[index()];

  return (
    <WidgetShell
      title="Stack decision rubric (EM/Staff)"
      instructorNotes="Appendix 7.A4 — pattern judgment, not copy-paste."
    >
      {(mode) => (
        <div class="mw-stack-rubric">
          <p>
            <strong>Context:</strong> {row().context}
          </p>
          <p>
            <strong>Choose:</strong> {row().pick}
          </p>
          <p>
            <strong>Avoid here:</strong> {row().avoid}
          </p>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setIndex((i) => (i + 1) % STACKS.length)}>
              Next scenario
            </button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: defend SolidJS vs React for *this* classroom outcome.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
