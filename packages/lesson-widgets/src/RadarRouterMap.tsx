import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const ROUTES = [
  { path: "/", label: "Dashboard", component: "Dashboard.tsx", data: "metrics + SSE" },
  { path: "/1on1", label: "1:1 Portal", component: "OneOnOnePortal.tsx", data: "WASM redaction" },
] as const;

export function RadarRouterMap() {
  const [active, setActive] = createSignal<(typeof ROUTES)[number]["path"]>("/");

  const route = () => ROUTES.find((r) => r.path === active())!;

  return (
    <WidgetShell
      title="TanStack Router map"
      instructorNotes="router.tsx — createRoute + RootLayout sidebar Links."
    >
      {(mode) => (
        <div class="mw-radar-router">
          <div class="mw-toolbar">
            <For each={ROUTES}>
              {(r) => (
                <button type="button" data-active={active() === r.path} onClick={() => setActive(r.path)}>
                  {r.path}
                </button>
              )}
            </For>
          </div>
          <div class="mw-own-box">
            <strong>{route().label}</strong>
            <code>{route().component}</code>
            <p class="mw-hint">{route().data}</p>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: where is active nav styling applied in RootLayout?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
