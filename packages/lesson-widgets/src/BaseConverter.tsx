import { createMemo, createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";
import {
  asciiForByte,
  clampByte,
  decimalToBits,
  decimalToHex,
  formattedBinary,
  hexToDecimal,
  nibbleDecimal,
  nibbleToHexDigit,
  NIBBLE_PLACES,
} from "./binary-utils";

export function BaseConverter() {
  const [decimal, setDecimal] = createSignal(35);
  const [hexInput, setHexInput] = createSignal("23");

  const bits = createMemo(() => decimalToBits(decimal()));
  const leftNibble = createMemo(() => bits().slice(0, 4));
  const rightNibble = createMemo(() => bits().slice(4));

  const syncFromDecimal = (value: number) => {
    const byte = clampByte(value);
    setDecimal(byte);
    setHexInput(decimalToHex(byte));
  };

  const syncFromHex = (raw: string) => {
    setHexInput(raw.toUpperCase());
    const parsed = hexToDecimal(raw);
    if (parsed !== null) setDecimal(parsed);
  };

  return (
    <WidgetShell
      title="Base Converter"
      instructorNotes="Walk the split trick: one byte = two nibbles = two hex digits. Tie to git packfile bytes later."
    >
      {(mode) => (
        <div class="mw-converter">
          <div class="mw-converter-controls">
            <label>
              Decimal (0–255):{" "}
              <input
                type="number"
                min={0}
                max={255}
                value={decimal()}
                onInput={(e) => syncFromDecimal(Number(e.currentTarget.value))}
              />
            </label>
            <label>
              Hex byte: 0x
              <input
                maxlength={2}
                value={hexInput()}
                onInput={(e) => syncFromHex(e.currentTarget.value)}
              />
            </label>
          </div>

          <p class="mw-mono">
            Binary: <strong>{formattedBinary(decimal())}</strong> · Hex:{" "}
            <strong>0x{decimalToHex(decimal())}</strong> · ASCII:{" "}
            <strong>'{asciiForByte(decimal())}'</strong>
          </p>

          <div class="mw-nibble-grid">
            <For each={[leftNibble(), rightNibble()]}>
              {(nibble, index) => (
                <div class="mw-nibble-card">
                  <h4>{index() === 0 ? "Left nibble" : "Right nibble"} → {nibbleToHexDigit(nibble)}</h4>
                  <div class="mw-place-row">
                    <For each={NIBBLE_PLACES}>
                      {(place, bitIndex) => (
                        <button
                          type="button"
                          class="mw-place-cell"
                          data-on={nibble[bitIndex()] === 1}
                          onClick={() => {
                            const next = [...bits()];
                            const globalIndex = index() * 4 + bitIndex();
                            next[globalIndex] = next[globalIndex] === 1 ? 0 : 1;
                            syncFromDecimal(bitsToDecimalLocal(next));
                          }}
                        >
                          <span class="mw-place-value">{place}</span>
                          <span class="mw-place-bit">{nibble[bitIndex()]}</span>
                        </button>
                      )}
                    </For>
                  </div>
                  <p class="mw-hint">
                    Sum: {nibbleDecimal(nibble)} → hex digit {nibbleToHexDigit(nibble)}
                  </p>
                </div>
              )}
            </For>
          </div>

          <Show when={mode() === "step"}>
            <ol class="mw-steps">
              <li>Split the byte into two groups of 4 bits (nibbles).</li>
              <li>Add place values 8 + 4 + 2 + 1 for each nibble.</li>
              <li>Map 10–15 to A–F and combine → two-digit hex.</li>
            </ol>
          </Show>

          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: without the widget, convert <code>1101 1010</code> to hex, then to decimal.
              (Answer: DA = 218)
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}

function bitsToDecimalLocal(bits: number[]): number {
  const places = [128, 64, 32, 16, 8, 4, 2, 1];
  return bits.reduce((sum, bit, index) => sum + bit * places[index], 0);
}
