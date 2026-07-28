import { createSignal } from "solid-js";
import { redactInWorker } from "../lib/redact";

export function OneOnOnePortal() {
  const [notes, setNotes] = createSignal("");
  const [redacted, setRedacted] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    setBusy(true);
    try {
      const sanitized = await redactInWorker(notes());
      setRedacted(sanitized);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="portal-grid">
      <section class="panel">
        <h2>1:1 notes</h2>
        <p class="muted">
          Raw notes stay in the browser. WASM redaction runs locally before anything would be sent
          upstream.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            rows={10}
            placeholder="Example: Alice is worried about burnout. Email alice@example.com if follow-up needed."
            value={notes()}
            onInput={(event) => setNotes(event.currentTarget.value)}
          />
          <button type="submit" disabled={busy() || notes().trim().length === 0}>
            {busy() ? "Redacting…" : "Sanitize with WASM"}
          </button>
        </form>
      </section>

      <section class="panel">
        <h2>Sanitized preview</h2>
        <pre class="preview">{redacted() || "Redacted output will appear here."}</pre>
      </section>
    </div>
  );
}
