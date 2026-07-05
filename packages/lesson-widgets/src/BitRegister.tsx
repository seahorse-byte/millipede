import { createMemo, createSignal, For } from "solid-js";
import { WidgetShell } from "./WidgetShell";

function charToBits(char: string): number[] {
  return char
    .charCodeAt(0)
    .toString(2)
    .padStart(8, "0")
    .split("")
    .map((b) => Number(b));
}

export function BitRegister() {
  const [text, setText] = createSignal("A");
  const bits = createMemo(() => charToBits(text().slice(0, 1) || "A"));

  return (
    <WidgetShell
      title="Bit Register"
      instructorNotes="Ask learners to encode their initials. Connect bits to ASCII table."
    >
      {(mode) => (
        <>
          <label>
            Character:{" "}
            <input
              maxlength={1}
              value={text()}
              onInput={(e) => setText(e.currentTarget.value.toUpperCase())}
            />
          </label>
          <p>
            ASCII {text().charCodeAt(0)} → binary
          </p>
          <div class="mw-bits">
            <For each={bits()}>
              {(bit) => (
                <div class="mw-bit" data-value={String(bit)}>
                  {bit}
                </div>
              )}
            </For>
          </div>
          {mode() === "challenge" && (
            <p class="mw-hint">Challenge: encode your name, one character at a time.</p>
          )}
        </>
      )}
    </WidgetShell>
  );
}
