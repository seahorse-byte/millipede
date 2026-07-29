import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

/** Simplified demo of JS ↔ WASM boundary (mirrors @millipede/redact-wasm). */
function demoRedact(input: string): string {
  return input.replace(
    /[\w.+-]+@[\w.-]+\.\w+/g,
    (email) => `[EMAIL:${(email.length * 7919).toString(16).slice(0, 6)}]`,
  );
}

export function WasmBoundary() {
  const [input, setInput] = createSignal(
    "Alice is burned out. Email alice@example.com for follow-up.",
  );
  const [crossed, setCrossed] = createSignal(false);
  const output = () => (crossed() ? demoRedact(input()) : "");

  return (
    <WidgetShell
      title="WASM boundary"
      instructorNotes="Real radar 1:1 portal calls redact_pii_deterministic in the browser — PII never hits your server."
    >
      {(mode) => (
        <div class="mw-wasm">
          <div class="mw-wasm-grid">
            <div class="mw-wasm-zone" data-side="js">
              <h4>JavaScript heap</h4>
              <textarea
                rows={3}
                value={input()}
                onInput={(e) => {
                  setCrossed(false);
                  setInput(e.currentTarget.value);
                }}
              />
              <span class="mw-wasm-note">Plaintext lives in the browser only.</span>
            </div>
            <div class="mw-wasm-bridge">
              <button type="button" onClick={() => setCrossed(true)}>
                Call WASM →
              </button>
              <span>copy bytes · run Rust · return string</span>
            </div>
            <div class="mw-wasm-zone" data-side="wasm">
              <h4>WASM linear memory</h4>
              <code class="mw-wasm-output">{crossed() ? output() : "— awaiting call —"}</code>
              <span class="mw-wasm-note">redact_pii_deterministic()</span>
            </div>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: why is WASM redaction stronger than sending raw text to a server API?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
