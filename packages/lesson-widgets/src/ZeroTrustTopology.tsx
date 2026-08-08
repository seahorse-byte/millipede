import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const LAYERS = [
  { id: "edge", label: "Edge (gateway)", checks: "JWT · TLS · rate limits" },
  { id: "mesh", label: "Service mesh (mTLS)", checks: "Client cert · CA trust · no plaintext hop" },
  { id: "data", label: "Data plane", checks: "Least privilege DB · encrypted fields" },
  { id: "client", label: "Browser (radar)", checks: "WASM redact before submit · no secrets in bundle" },
] as const;

export function ZeroTrustTopology() {
  const [active, setActive] = createSignal<(typeof LAYERS)[number]["id"]>("edge");

  return (
    <WidgetShell
      title="Zero-trust topology"
      instructorNotes="PDF4: no flat network. Every hop verifies identity — gateway JWT, then mTLS to backends."
    >
      {(mode) => (
        <div class="mw-zero-trust">
          <For each={LAYERS}>
            {(layer) => (
              <button
                type="button"
                class="mw-compose-node"
                data-active={active() === layer.id}
                onClick={() => setActive(layer.id)}
              >
                <strong>{layer.label}</strong>
                <span>{layer.checks}</span>
              </button>
            )}
          </For>
          <p class="mw-hint">Principle: <strong>never trust, always verify</strong> — even inside compose.</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which layer stops an unauthenticated browser from /api/metrics?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
