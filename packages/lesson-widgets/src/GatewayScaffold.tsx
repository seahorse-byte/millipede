import { For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const ROUTES = [
  { path: "/health", auth: "public", target: "gateway health JSON" },
  { path: "/api/metrics/*", auth: "JWT manager", target: "proxy → analyzer" },
  { path: "/api/webhooks/*", auth: "JWT manager", target: "proxy → ingestion" },
] as const;

export function GatewayScaffold() {
  return (
    <WidgetShell
      title="Gateway scaffold"
      instructorNotes="services/gateway — Axum Router, require_manager_jwt middleware, rustls when MILLIPEDE_MTLS=1."
    >
      {(mode) => (
        <div class="mw-gateway">
          <For each={ROUTES}>
            {(r) => (
              <div class="mw-own-line" data-kind={r.auth === "public" ? "ok" : "pending"}>
                <span>{r.path}</span>
                <code>{r.auth} → {r.target}</code>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: default gateway port when MILLIPEDE_MTLS=1?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
