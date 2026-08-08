import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function SlackSignatureVerifier() {
  const [timestamp] = createSignal("1531420618");
  const [body] = createSignal('{"type":"event_callback","event":{"type":"message"}}');
  const [secret, setSecret] = createSignal("millipede-slack-signing-secret");
  const [sig, setSig] = createSignal("");
  const [verified, setVerified] = createSignal<boolean | null>(null);

  const compute = () => {
    const base = `v0:${timestamp()}:${body()}`;
    let h = 0;
    const input = secret() + base;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
    const mock = `v0=${(h >>> 0).toString(16)}`;
    setSig(mock);
    setVerified(true);
  };

  const tamper = () => {
    setSig("v0=deadbeef");
    setVerified(false);
  };

  return (
    <WidgetShell
      title="Slack signing secret"
      instructorNotes="Real Slack: HMAC-SHA256 of v0:timestamp:body with signing secret. Reject replays with stale timestamp."
    >
      {(mode) => (
        <div class="mw-slack-sig">
          <p class="mw-hint">Signing secret (env):</p>
          <input type="text" value={secret()} onInput={(e) => setSecret(e.currentTarget.value)} />
          <pre class="mw-el-code">{`X-Slack-Request-Timestamp: ${timestamp()}\nBody: ${body()}`}</pre>
          <div class="mw-toolbar">
            <button type="button" onClick={compute}>Compute X-Slack-Signature</button>
            <button type="button" onClick={tamper}>Tamper signature</button>
          </div>
          <Show when={sig()}>
            <p class="mw-hint">Signature: <code>{sig()}</code></p>
            <p class="mw-hint" data-ok={verified()}>{verified() ? "✓ Verified — process webhook" : "✗ Reject — 401"}</p>
          </Show>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why verify before parsing JSON into structs?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
