import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const TOPICS = [
  { name: "raw-dev-events", partitions: 3, role: "Ingestion producer → LLM consumer" },
  { name: "enriched-dev-events", partitions: 3, role: "LLM producer → Analyzer consumer" },
] as const;

export function KafkaTopicExplorer() {
  const [topicIdx, setTopicIdx] = createSignal(0);
  const [partition, setPartition] = createSignal(0);
  const [offset, setOffset] = createSignal(0);

  const topic = () => TOPICS[topicIdx()];

  const produce = () => setOffset((o) => o + 1);
  const rewind = () => setOffset(0);

  return (
    <WidgetShell
      title="Kafka topics & offsets"
      instructorNotes="Partition key (e.g. team_id) keeps related events ordered. Offsets are per partition."
    >
      {(mode) => (
        <div class="mw-kafka-topic">
          <div class="mw-toolbar">
            <For each={TOPICS}>
              {(t, i) => (
                <button type="button" data-active={topicIdx() === i()} onClick={() => setTopicIdx(i())}>
                  {t.name}
                </button>
              )}
            </For>
          </div>
          <p class="mw-hint">{topic().role}</p>
          <div class="mw-toolbar">
            <For each={[0, 1, 2]}>
              {(p) => (
                <button type="button" data-active={partition() === p} onClick={() => setPartition(p)}>
                  P{p}
                </button>
              )}
            </For>
          </div>
          <div class="mw-kafka-offset">
            <code>
              {topic().name} · partition {partition()} · next offset {offset()}
            </code>
          </div>
          <div class="mw-toolbar">
            <button type="button" onClick={produce}>Produce message</button>
            <button type="button" onClick={rewind}>Rewind to 0</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: what breaks if two partitions get the same team’s events?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
