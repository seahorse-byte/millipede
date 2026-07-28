import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

type Scenario = "same-origin" | "cross-origin";

export function TrustBoundaryDiagram() {
  const [scenario, setScenario] = createSignal<Scenario>("cross-origin");

  return (
    <WidgetShell
      title="Trust boundary"
      instructorNotes="Radar dev uses Vite proxy so browser sees same-origin /api — production would use gateway JWT instead."
    >
      {(mode) => (
        <div class="mw-trust">
          <div class="mw-toolbar">
            <button
              type="button"
              data-active={scenario() === "same-origin"}
              onClick={() => setScenario("same-origin")}
            >
              Same-origin (proxied)
            </button>
            <button
              type="button"
              data-active={scenario() === "cross-origin"}
              onClick={() => setScenario("cross-origin")}
            >
              Cross-origin (blocked)
            </button>
          </div>
          <div class="mw-trust-grid">
            <div class="mw-trust-box">
              <strong>Browser</strong>
              <code>{scenario() === "same-origin" ? "http://localhost:5174" : "http://localhost:5174"}</code>
            </div>
            <div class="mw-trust-arrow">
              {scenario() === "same-origin" ? "→ /api proxy →" : "→ fetch :8082 →"}
            </div>
            <div class="mw-trust-box">
              <strong>API</strong>
              <code>{scenario() === "same-origin" ? "analyzer via Vite proxy" : "http://localhost:8082"}</code>
            </div>
          </div>
          <Show when={scenario() === "same-origin"}>
            <p class="mw-hint mw-ok">
              Allowed: Vite forwards /api to :8082. Browser thinks origin is :5174.
            </p>
          </Show>
          <Show when={scenario() === "cross-origin"}>
            <p class="mw-hint mw-warn">
              Blocked without CORS: browser enforces same-origin policy. Analyzer adds Access-Control-Allow-Origin in dev.
            </p>
          </Show>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: why does `127.0.0.1:5174` fail while `localhost:5174` works? (Different origins.)
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
