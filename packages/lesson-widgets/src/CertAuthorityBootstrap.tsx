import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const SERVICES = ["gateway", "ingestion", "analyzer"] as const;

export function CertAuthorityBootstrap() {
  const [signed, setSigned] = createSignal<string[]>([]);

  const signAll = () => setSigned([...SERVICES]);
  const reset = () => setSigned([]);

  return (
    <WidgetShell
      title="Dev CA bootstrap"
      instructorNotes="Run infra/certs/generate-dev-certs.sh — local only. Production uses real PKI / cert-manager."
    >
      {(mode) => (
        <div class="mw-ca">
          <div class="mw-own-box">
            <strong>Millipede Dev CA</strong>
            <code>ca.pem · ca-key.pem (keep private)</code>
          </div>
          <For each={SERVICES}>
            {(name) => (
              <div class="mw-own-line" data-kind={signed().includes(name) ? "ok" : "pending"}>
                <span>{signed().includes(name) ? "signed" : "pending"}</span>
                <code>
                  {name}.pem + {name}-key.pem · SAN localhost
                </code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={signAll}>Run generate-dev-certs.sh</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: openssl verify -CAfile ca.pem gateway.pem</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
