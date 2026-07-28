import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  { label: "ClientHello", detail: "Gateway proposes TLS 1.3 + cipher suites" },
  { label: "ServerHello + cert", detail: "Gateway presents dev cert (infra/certs/dev/gateway.crt)" },
  { label: "Client verifies chain", detail: "Trust local CA or skip verify in dev (-k)" },
  { label: "Client cert (mTLS)", detail: "Optional: gateway requires client.pem for backend hop" },
  { label: "Finished", detail: "Encrypted tunnel — JWT + HTTP inside TLS to :8443" },
  { label: "mTLS to backend", detail: "Gateway opens rustls client to ingestion/analyzer :8083/:8084" },
] as const;

export function MtlsHandshake() {
  const [index, setIndex] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const play = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setIndex(0);
    timer = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= STEPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return i;
        }
        return i + 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    setRunning(false);
  };

  onCleanup(stop);

  return (
    <WidgetShell
      title="TLS + mTLS handshake"
      instructorNotes="Stage 2: mint JWT, curl -sk https://localhost:8443 with Bearer header. Read cert with openssl x509 -in gateway.crt -text -noout."
    >
      {(mode) => (
        <div class="mw-timeline">
          <div class="mw-toolbar">
            <button type="button" onClick={play} disabled={running()}>
              Walk handshake
            </button>
            <button type="button" onClick={stop} disabled={!running()}>
              Pause
            </button>
            <Show when={mode() === "step"}>
              <button type="button" onClick={() => setIndex((i) => Math.min(i + 1, STEPS.length - 1))}>
                Next
              </button>
            </Show>
          </div>
          <For each={STEPS}>
            {(step, i) => (
              <div class="mw-timeline-step" data-active={index() === i()} data-done={index() > i()}>
                <div class="mw-timeline-marker">{i() + 1}</div>
                <div class="mw-timeline-body">
                  <span class="mw-timeline-label">{step.label}</span>
                  <code class="mw-timeline-detail">{step.detail}</code>
                </div>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: generate dev certs, start gateway mode, and explain where JWT vs mTLS apply.
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
