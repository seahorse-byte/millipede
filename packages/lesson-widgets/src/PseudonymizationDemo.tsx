import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const PEOPLE = [
  { name: "Alice Chen", role: "Senior engineer" },
  { name: "Bob Rivera", role: "Staff engineer" },
  { name: "Carol Okonkwo", role: "EM" },
] as const;

function pseudonym(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const labels = ["Alpha", "Bravo", "Charlie", "Delta"];
  return `Developer_${labels[h % labels.length]}`;
}

export function PseudonymizationDemo() {
  const [selected, setSelected] = createSignal(0);
  const person = () => PEOPLE[selected()];

  return (
    <WidgetShell
      title="Deterministic pseudonymization"
      instructorNotes="Same input → same token for analytics. Different from encryption — reversible only with mapping table."
    >
      {(mode) => (
        <div class="mw-pseudo">
          <div class="mw-toolbar">
            <For each={PEOPLE}>
              {(p, i) => (
                <button type="button" data-active={selected() === i()} onClick={() => setSelected(i())}>
                  {p.name}
                </button>
              )}
            </For>
          </div>
          <div class="mw-own-box">
            <strong>HR view:</strong> {person().name} · {person().role}
          </div>
          <div class="mw-own-box">
            <strong>Dashboard view:</strong> {pseudonym(person().name)} · {person().role}
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: where should the name→pseudonym map live?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
