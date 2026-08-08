import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

type Row = { id: string; source: string; sentiment: number; risk: string; time: string };

const SAMPLE: Row[] = [
  { id: "evt-a1", source: "github", sentiment: 0.72, risk: "Low", time: "14:02:11" },
  { id: "evt-b2", source: "jira", sentiment: 0.41, risk: "Medium", time: "14:02:09" },
];

export function RadarLiveFeed() {
  const [rows, setRows] = createSignal<Row[]>([]);
  const [status, setStatus] = createSignal<"connecting" | "live" | "offline">("connecting");

  const connect = () => {
    setStatus("live");
    setRows(SAMPLE);
  };

  const push = () => {
    setRows((r) => [
      {
        id: `evt-${Math.random().toString(36).slice(2, 6)}`,
        source: "github",
        sentiment: 0.55,
        risk: "Low",
        time: new Date().toISOString().slice(11, 19),
      },
      ...r,
    ].slice(0, 6));
  };

  return (
    <WidgetShell
      title="Live activity feed"
      instructorNotes="Mirrors Dashboard activity table — sentiment meter + risk badge from enriched events."
    >
      {(mode) => (
        <div class="mw-radar-feed">
          <div class="mw-toolbar">
            <button type="button" onClick={connect}>Connect SSE</button>
            <button type="button" onClick={push} disabled={status() !== "live"}>Push event</button>
            <span class="mw-hint">status: {status()}</span>
          </div>
          <Show when={rows().length > 0} fallback={
            <p class="mw-el-empty">Connect SSE — POST webhook while tab open</p>
          }>
            <ul class="mw-el-list">
              <For each={rows()}>{(r) => (
                <li>{r.time} · {r.source} · {r.id.slice(0, 8)}… · sentiment {r.sentiment.toFixed(2)} · {r.risk}</li>
              )}</For>
            </ul>
          </Show>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: trace team_radar:events from analyzer warm_redis to browser.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
