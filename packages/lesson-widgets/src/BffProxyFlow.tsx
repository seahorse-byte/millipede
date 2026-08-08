import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const PATHS = {
  bff: [
    { step: "Browser", detail: "Cookie session · CSRF token · same-origin /api" },
    { step: "Express BFF", detail: "OAuth token vault · aggregate APIs · entitlements" },
    { step: "Upstream", detail: "Cerberus / hidden APIs / TM Engine (maverick-ui scale)" },
  ],
  gateway: [
    { step: "Browser", detail: "Bearer JWT in header · SolidJS fetch /api" },
    { step: "Rust gateway", detail: "Validate JWT · mTLS proxy · static assets optional" },
    { step: "Backends", detail: "ingestion · analyzer — no BFF layer" },
  ],
} as const;

export function BffProxyFlow() {
  const [mode, setModePath] = createSignal<"bff" | "gateway">("gateway");

  return (
    <WidgetShell
      title="BFF vs gateway (deep-dive)"
      instructorNotes="Team Radar ships gateway only. maverick-ui BFF is reference for Book 7 / enterprise OAuth."
    >
      {(m) => (
        <div class="mw-bff">
          <div class="mw-toolbar">
            <button type="button" data-active={mode() === "gateway"} onClick={() => setModePath("gateway")}>
              millipede gateway
            </button>
            <button type="button" data-active={mode() === "bff"} onClick={() => setModePath("bff")}>
              maverick-ui BFF
            </button>
          </div>
          <For each={PATHS[mode()]}>
            {(row, i) => (
              <div class="mw-tokio-step" data-active={true}>
                <span>{i() + 1}. {row.step}</span>
                <code>{row.detail}</code>
              </div>
            )}
          </For>
          <Show when={m() === "challenge"}>
            <p class="mw-hint">Challenge: list two reasons Snyk needs a BFF that Team Radar does not.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
