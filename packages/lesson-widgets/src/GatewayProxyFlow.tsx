import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const HOPS = [
  { label: "Browser/curl", detail: "https://localhost:8443/api/metrics/summary + Bearer JWT" },
  { label: "Gateway", detail: "Validate JWT · strip Authorization · mTLS client to backend" },
  { label: "Analyzer", detail: "Plain or mTLS :8082/:8084 — SQL query → JSON" },
  { label: "Response", detail: "Gateway forwards status + body to client" },
] as const;

export function GatewayProxyFlow() {
  const [step, setStep] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setStep(0);
    timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= HOPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
  };

  onCleanup(() => { if (timer) clearInterval(timer); });

  return (
    <WidgetShell
      title="Gateway proxy path"
      instructorNotes="Stage 2 goal: browsers never call :8081/:8082 directly in hardened deploy."
    >
      {(mode) => (
        <div class="mw-gateway-proxy">
          <For each={HOPS}>
            {(h, i) => (
              <div class="mw-tanstack-step" data-active={i() <= step()}>
                <span>{h.label}</span>
                <code>{h.detail}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>Animate request</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: curl webhook through gateway with TOKEN — not :8081.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
