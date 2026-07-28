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
      setRedacted(await redactInWorker(notes()));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="page-stack portal-stack">
      <div class="alert alert--info">
        Notes are sanitized in-browser via WASM before any upstream write. Raw text never leaves
        this session.
      </div>

      <div class="portal-grid">
        <section class="panel panel--accent">
          <div class="panel-head">
            <div>
              <h3>Raw input</h3>
              <p class="panel-sub">Manager 1:1 capture buffer</p>
            </div>
            <span class="badge badge--medium">Local only</span>
          </div>
          <form class="portal-form" onSubmit={handleSubmit}>
            <textarea
              rows={14}
              spellcheck={false}
              placeholder="Team member reported burnout. Contact alice@example.com after standup."
              value={notes()}
              onInput={(event) => setNotes(event.currentTarget.value)}
            />
            <button type="submit" class="btn btn--primary" disabled={busy() || !notes().trim()}>
              {busy() ? "Redacting…" : "Run WASM redaction"}
            </button>
          </form>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Sanitized output</h3>
              <p class="panel-sub">redact_pii_deterministic</p>
            </div>
            <span class="badge badge--easy">Safe</span>
          </div>
          <pre class="output-block">{redacted() || "Output will appear here after redaction."}</pre>
        </section>
      </div>
    </div>
  );
}
