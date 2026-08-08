import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const TREE = [
  "apps/radar/index.html",
  "apps/radar/vite.config.ts  → proxy /api → :8082",
  "apps/radar/src/router.tsx  → TanStack Router",
  "apps/radar/src/pages/Dashboard.tsx",
  "apps/radar/src/pages/OneOnOnePortal.tsx",
  "apps/radar/src/api/client.ts",
] as const;

export function RadarAppShell() {
  const [expanded, setExpanded] = createSignal(true);

  return (
    <WidgetShell
      title="Radar app shell"
      instructorNotes="pnpm dev:radar → :5174. Vite + vite-plugin-solid — no React in ship path."
    >
      {(mode) => (
        <div class="mw-radar-shell">
          <p class="mw-hint"><strong>apps/radar/</strong> — Stage 4 manager dashboard</p>
          <Show when={expanded()}>
            <ul class="mw-el-list">
              <For each={TREE}>{(line) => <li><code>{line}</code></li>}</For>
            </ul>
          </Show>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setExpanded((e) => !e)}>{expanded() ? "Collapse" : "Expand"} tree</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why proxy /api instead of calling :8082 from the browser?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
