import { createSignal, For, Show } from "solid-js";

export type WidgetMode = "play" | "step" | "challenge" | "instructor";

export interface WidgetShellProps {
  title: string;
  mode?: WidgetMode;
  children: (mode: () => WidgetMode) => unknown;
  instructorNotes?: string;
}

export function WidgetShell(props: WidgetShellProps) {
  const [mode, setMode] = createSignal<WidgetMode>(props.mode ?? "play");
  const modes: WidgetMode[] = ["play", "step", "challenge", "instructor"];

  return (
    <div class="mw-root">
      <div class="mw-toolbar">
        <For each={modes}>
          {(m) => (
            <button type="button" data-active={mode() === m} onClick={() => setMode(m)}>
              {m}
            </button>
          )}
        </For>
      </div>
      <div class="mw-panel">{props.children(mode) as never}</div>
      <Show when={mode() === "instructor" && props.instructorNotes}>
        <p class="mw-hint">{props.instructorNotes}</p>
      </Show>
    </div>
  );
}
