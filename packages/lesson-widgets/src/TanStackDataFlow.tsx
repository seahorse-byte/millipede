import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  { id: "route", label: "TanStack Router", detail: "Route `/` mounts DashboardPage" },
  { id: "query", label: "useQuery", detail: "queryKey: ['metrics','summary'] · staleTime 0 · refetchInterval 5s" },
  { id: "fetch", label: "fetch", detail: "GET /api/metrics/summary → Vite proxy → gateway/analyzer" },
  { id: "cache", label: "Query cache", detail: "JSON stored — isFetching false, data updated" },
  { id: "ui", label: "SolidJS render", detail: "Signals read query.data — cards update without full reload" },
] as const;

export function TanStackDataFlow() {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setActiveIndex(0);
    timer = setInterval(() => {
      setActiveIndex((i) => {
        if (i + 1 >= STEPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return i;
        }
        return i + 1;
      });
    }, 1200);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    setRunning(false);
  };

  onCleanup(stop);

  return (
    <WidgetShell
      title="TanStack Query data flow"
      instructorNotes="Server state (Query) vs UI state (signals). Radar polls summary; SSE feed is separate — two channels of live data."
    >
      {(mode) => (
        <div class="mw-tanstack">
          <For each={STEPS}>
            {(step, i) => (
              <div class="mw-tanstack-step" data-active={i() <= activeIndex()}>
                <span>{step.label}</span>
                <code>{step.detail}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={running() ? stop : start}>
              {running() ? "Pause" : "Animate poll cycle"}
            </button>
            <button type="button" onClick={() => { stop(); setActiveIndex(0); }}>
              Reset
            </button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: what happens if the fetch fails but SSE still delivers events?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
