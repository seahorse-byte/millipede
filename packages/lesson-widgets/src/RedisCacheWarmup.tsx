import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const KEYS = [
  { key: "team_radar:latest_by_source", op: "HSET source → event_id" },
  { key: "team_radar:count:github", op: "INCR per source" },
  { key: "team_radar:events", op: "PUBLISH live JSON for SSE" },
] as const;

export function RedisCacheWarmup() {
  const [warmed, setWarmed] = createSignal<string[]>([]);

  const warm = (key: string) => setWarmed((w) => [...new Set([...w, key])]);

  return (
    <WidgetShell
      title="Redis cache warm-up"
      instructorNotes="warm_redis in analyzer after Postgres insert — powers SSE + latest_by_source in metrics API."
    >
      {(mode) => (
        <div class="mw-redis-warm">
          <For each={KEYS}>
            {(k) => (
              <div class="mw-own-line" data-kind={warmed().includes(k.key) ? "ok" : "pending"}>
                <span>{k.key}</span>
                <code>{k.op}</code>
                <button type="button" onClick={() => warm(k.key)} disabled={warmed().includes(k.key)}>
                  Warm
                </button>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: SUBSCRIBE team_radar:events while posting webhook.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
