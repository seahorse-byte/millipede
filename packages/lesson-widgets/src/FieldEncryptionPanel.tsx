import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function FieldEncryptionPanel() {
  const [plaintext, setPlaintext] = createSignal("Alice seems overwhelmed — schedule 1:1.");
  const [encrypted, setEncrypted] = createSignal(false);

  const cipher = () =>
    encrypted()
      ? `enc:v1:${btoa(plaintext()).slice(0, 24)}… (field-level blob in Postgres)`
      : "— plaintext at rest (not shipped) —";

  return (
    <WidgetShell
      title="Field-level encryption (1:1 notes)"
      instructorNotes="Millipede ships WASM redaction client-side; server-side field encryption is a design option for stored notes."
    >
      {(mode) => (
        <div class="mw-field-enc">
          <textarea rows={3} value={plaintext()} onInput={(e) => { setEncrypted(false); setPlaintext(e.currentTarget.value); }} />
          <div class="mw-toolbar">
            <button type="button" onClick={() => setEncrypted(true)} disabled={encrypted()}>
              Encrypt before store
            </button>
          </div>
          <pre class="mw-el-code">{cipher()}</pre>
          <p class="mw-hint">Ship path: redact in browser → store pseudonymized text only.</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: who holds the decryption key — browser, gateway, or DB?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
