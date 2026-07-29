import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const SCENARIOS = [
  {
    id: "double-mut",
    broken: "let mut v = vec![1]; let r = &mut v; v.push(2);",
    fix: "let mut v = vec![1]; v.push(2); let r = &v;",
    explain: "Cannot mutably borrow and mutate `v` in the same scope.",
  },
  {
    id: "use-after-move",
    broken: 'let s = String::from("hi"); publish(s); log(s);',
    fix: 'let s = String::from("hi"); publish(s); // s moved — log clone or borrow before',
    explain: "After move to `publish`, `s` is invalid.",
  },
  {
    id: "dangling",
    broken: "let r = { let x = 5; &x };",
    fix: "let x = 5; let r = &x;",
    explain: "Reference cannot outlive the value it points to.",
  },
] as const;

export function BorrowCheckerPanel() {
  const [index, setIndex] = createSignal(0);
  const [fixed, setFixed] = createSignal(false);
  const scenario = () => SCENARIOS[index()];

  const next = () => {
    setFixed(false);
    setIndex((i) => (i + 1) % SCENARIOS.length);
  };

  return (
    <WidgetShell
      title="Borrow checker"
      instructorNotes="Compile errors are features — ingestion/analyzer fail fast in CI, not prod."
    >
      {(mode) => (
        <div class="mw-borrow">
          <p class="mw-hint">Scenario {index() + 1} of {SCENARIOS.length}</p>
          <pre class="mw-el-code">{fixed() ? scenario().fix : scenario().broken}</pre>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setFixed(true)} disabled={fixed()}>
              Apply fix
            </button>
            <button type="button" onClick={next}>
              Next scenario
            </button>
          </div>
          <Show when={fixed()}>
            <p class="mw-hint mw-ok">{scenario().explain}</p>
          </Show>
          <Show when={mode() === "challenge" && !fixed()}>
            <p class="mw-hint">Challenge: explain the error before clicking Apply fix.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
