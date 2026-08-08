import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const ROLES = [
  { role: "manager", scope: "team_radar:manager", routes: ["/api/metrics/*", "/api/webhooks/*"], allowed: true },
  { role: "engineer", scope: "team_radar:read", routes: ["/api/metrics/summary"], allowed: false },
  { role: "anonymous", scope: "—", routes: ["/health"], allowed: false },
] as const;

export function AbacRoleMatrix() {
  const [path, setPath] = createSignal("/api/metrics/summary");

  const results = () =>
    ROLES.map((r) => ({
      ...r,
      pass: r.allowed && r.routes.some((p) => path().startsWith(p.replace("*", ""))),
    }));

  return (
    <WidgetShell
      title="ABAC role matrix"
      instructorNotes="Gateway require_manager_jwt checks scope claim — attribute-based, not just authenticated."
    >
      {(mode) => (
        <div class="mw-abac">
          <label class="mw-hint">Request path:</label>
          <input type="text" value={path()} onInput={(e) => setPath(e.currentTarget.value)} />
          <For each={results()}>
            {(r) => (
              <div class="mw-own-line" data-kind={r.pass ? "ok" : "error"}>
                <span>{r.role}</span>
                <code>{r.scope} → {r.pass ? "ALLOW" : "DENY"}</code>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: add a read-only scope that can GET metrics but not POST webhooks.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
