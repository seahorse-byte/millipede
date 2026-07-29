import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function RedisPubSubLive() {
  const [channel] = createSignal("team-radar:live");
  const [messages, setMessages] = createSignal<string[]>([]);
  const [subscribed, setSubscribed] = createSignal(false);

  const publish = () => {
    const msg = `event:${Date.now()} team-1 PR merged`;
    setMessages((m) => [...m.slice(-4), msg]);
  };

  const toggleSub = () => {
    setSubscribed((s) => !s);
    if (!subscribed()) setMessages([]);
  };

  return (
    <WidgetShell
      title="Redis Pub/Sub live feed"
      instructorNotes="Radar SSE reads Redis while page is open. Query poll is separate (lesson 1.14)."
    >
      {(mode) => (
        <div class="mw-redis">
          <p class="mw-hint">Channel: <code>{channel()}</code></p>
          <div class="mw-toolbar">
            <button type="button" onClick={toggleSub}>
              {subscribed() ? "Unsubscribe" : "SUBSCRIBE"}
            </button>
            <button type="button" onClick={publish} disabled={!subscribed()}>
              PUBLISH (analyzer)
            </button>
          </div>
          <Show when={!subscribed()} fallback={
            <ul class="mw-el-list">
              <For each={messages()}>{(m) => <li>{m}</li>}</For>
              <Show when={messages().length === 0}><li class="mw-el-empty">waiting for events…</li></Show>
            </ul>
          }>
            <p class="mw-el-empty">Subscribe to see live messages (simulated SSE)</p>
          </Show>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: run redis-cli SUBSCRIBE team-radar:live while demo runs.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
