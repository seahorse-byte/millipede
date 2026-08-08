import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

function redact(input: string): string {
  return input
    .split(/\s+/)
    .map((word) => {
      if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(word)) {
        let h = 0;
        for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) >>> 0;
        return `[EMAIL:${(h & 0xffffff).toString(16).padStart(6, "0")}]`;
      }
      if (/\d{3}/.test(word) && word.replace(/\D/g, "").length >= 10) {
        let h = 0;
        for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) >>> 0;
        return `[PHONE:${(h & 0xffffff).toString(16).padStart(6, "0")}]`;
      }
      return word;
    })
    .join(" ");
}

export function WasmRedaction() {
  const [notes, setNotes] = createSignal(
    "Burnout signal: alice@example.com called twice. Phone 555-010-9988.",
  );
  const [submitted, setSubmitted] = createSignal("");

  const submit = () => setSubmitted(redact(notes()));

  return (
    <WidgetShell
      title="WASM sanitize on submit"
      instructorNotes="Radar /1on1 calls redact_pii_deterministic before any POST — matches packages/redact-wasm."
    >
      {(mode) => (
        <div class="mw-wasm">
          <label class="mw-hint">Manager notes (plaintext never leaves browser raw)</label>
          <textarea rows={3} value={notes()} onInput={(e) => { setSubmitted(""); setNotes(e.currentTarget.value); }} />
          <div class="mw-toolbar">
            <button type="button" onClick={submit}>Submit via WASM redaction</button>
          </div>
          <p class="mw-hint"><strong>Safe payload:</strong></p>
          <pre class="mw-el-code">{submitted() || "— click Submit —"}</pre>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: run the same input twice — tokens must match (deterministic).</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
