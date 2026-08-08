import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  { label: "Request", detail: "GET /api/metrics/summary + Authorization: Bearer eyJ…" },
  { label: "Extract", detail: "Strip Bearer prefix · reject if missing → 401" },
  { label: "Decode", detail: "HS256 with JWT_SECRET · validate exp" },
  { label: "Authorize", detail: "claims.scope == team_radar:manager → else 403" },
  { label: "Proxy", detail: "Forward to analyzer over mTLS (no JWT to backend)" },
] as const;

export function JwtValidationFlow() {
  const [step, setStep] = createSignal(0);
  const [scope, setScope] = createSignal<"manager" | "guest">("manager");

  const advance = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const reset = () => setStep(0);

  const outcome = () => {
    if (step() < 3) return "—";
    return scope() === "manager" ? "200 OK → proxy" : "403 Forbidden";
  };

  return (
    <WidgetShell
      title="JWT validation at gateway"
      instructorNotes="Mint dev token: cargo run -p millipede-gateway --bin mint_dev_jwt"
    >
      {(mode) => (
        <div class="mw-jwt">
          <div class="mw-toolbar">
            <button type="button" data-active={scope() === "manager"} onClick={() => setScope("manager")}>
              scope: manager
            </button>
            <button type="button" data-active={scope() === "guest"} onClick={() => setScope("guest")}>
              scope: guest
            </button>
          </div>
          <For each={STEPS}>
            {(s, i) => (
              <div class="mw-tokio-step" data-active={i() <= step()} data-current={i() === step()}>
                <span>{s.label}</span>
                <code>{s.detail}</code>
              </div>
            )}
          </For>
          <p class="mw-hint">Outcome: <strong>{outcome()}</strong></p>
          <div class="mw-toolbar">
            <button type="button" onClick={advance} disabled={step() >= STEPS.length - 1}>Step</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why strip Authorization before proxying upstream?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
