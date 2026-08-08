import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const ROUTES = [
  { method: "GET", path: "/health", handler: "health() → { status, service }" },
  { method: "POST", path: "/webhooks/hello", handler: "github_webhook() → validate JSON" },
  { method: "POST", path: "/webhooks/github", handler: "github_webhook() → same handler" },
] as const;

export function AxumHandlerExplorer() {
  const [active, setActive] = createSignal(1);
  const route = () => ROUTES[active()];

  return (
    <WidgetShell
      title="Axum ingestion routes"
      instructorNotes="services/ingestion/src/main.rs — Router::new().route(...).with_state(AppState)"
    >
      {(mode) => (
        <div class="mw-axum">
          <For each={ROUTES}>
            {(r, i) => (
              <button type="button" class="mw-compose-node" data-active={active() === i()} onClick={() => setActive(i())}>
                <strong>{r.method} {r.path}</strong>
                <span>{r.handler}</span>
              </button>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why return 200 before Kafka finishes downstream?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
