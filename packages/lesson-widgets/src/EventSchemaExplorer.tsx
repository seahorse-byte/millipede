import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const SCHEMAS = [
  {
    id: "github",
    name: "GitHub PR",
    json: `{\n  "source": "github",\n  "action": "opened",\n  "title": "fix auth bug",\n  "repo": "team-radar"\n}`,
  },
  {
    id: "jira",
    name: "Jira ticket",
    json: `{\n  "source": "jira",\n  "issue_key": "RADAR-42",\n  "status": "In Progress"\n}`,
  },
  {
    id: "slack",
    name: "Slack pulse",
    json: `{\n  "source": "slack",\n  "channel": "#eng-health",\n  "text": "deploy blocked"\n}`,
  },
] as const;

export function EventSchemaExplorer() {
  const [idx, setIdx] = createSignal(0);
  const schema = () => SCHEMAS[idx()];

  return (
    <WidgetShell
      title="Event schemas"
      instructorNotes="Ingestion wraps any JSON in { id, source, payload } — source drives dashboard grouping."
    >
      {(mode) => (
        <div class="mw-schema">
          <div class="mw-toolbar">
            <For each={SCHEMAS}>
              {(s, i) => (
                <button type="button" data-active={idx() === i()} onClick={() => setIdx(i())}>
                  {s.name}
                </button>
              )}
            </For>
          </div>
          <pre class="mw-el-code">{schema().json}</pre>
          <p class="mw-hint">Kafka envelope adds <code>id</code> UUID at publish time.</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why keep vendor-specific fields inside payload?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
