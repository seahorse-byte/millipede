import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  { label: "git push", detail: "main branch → GitHub/GitLab remote" },
  { label: "Cloudflare Pages", detail: "Webhook triggers build · pnpm build:academy" },
  { label: "Static assets", detail: "dist/ → edge CDN (millipede-academy.pages.dev)" },
  { label: "Live", detail: "Lesson MDX + widgets — no Kafka in Pages runtime" },
] as const;

export function PagesDeployFlow() {
  const [step, setStep] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setStep(0);
    timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STEPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 1000);
  };

  onCleanup(() => { if (timer) clearInterval(timer); });

  return (
    <WidgetShell
      title="Academy deploy (Pages)"
      instructorNotes="Academy is static. Team Radar demo runs locally via docker compose — different deploy surface."
    >
      {(mode) => (
        <div class="mw-pages">
          <For each={STEPS}>
            {(s, i) => (
              <div class="mw-tanstack-step" data-active={i() <= step()}>
                <span>{s.label}</span>
                <code>{s.detail}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>Animate deploy</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: what fails if lesson-widgets import breaks but MDX is fine?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
