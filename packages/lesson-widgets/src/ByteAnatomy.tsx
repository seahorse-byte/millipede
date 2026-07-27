import { createMemo, createSignal } from "solid-js";
import { WidgetShell } from "./WidgetShell";
import {
  asciiForByte,
  clampByte,
  decimalToHex,
  formattedBinary,
  hexToDecimal,
} from "./binary-utils";

const LAYERS = [
  { key: "physical", label: "Physical / memory", detail: "One byte in contiguous RAM (e.g. Buffer slot)" },
  { key: "binary", label: "Binary (truth)", detail: "What the hardware actually stores — switches ON/OFF" },
  { key: "hex", label: "Hex (shorthand)", detail: "Programmer notation — two nibbles, two hex digits" },
  { key: "decimal", label: "Decimal (math value)", detail: "The number you'd use in arithmetic" },
  { key: "ascii", label: "ASCII (meaning)", detail: "Human agreement: this number draws a character" },
] as const;

export function ByteAnatomy() {
  const [hexInput, setHexInput] = createSignal("23");

  const decimal = createMemo(() => hexToDecimal(hexInput()) ?? 0);
  const byte = createMemo(() => clampByte(decimal()));

  const layerValues = createMemo(() => ({
    physical: `Buffer.from([0x${decimalToHex(byte())}]) — neighbors in memory`,
    binary: formattedBinary(byte()),
    hex: `0x${decimalToHex(byte())}`,
    decimal: String(byte()),
    ascii: `'${asciiForByte(byte())}' (code point ${byte()})`,
  }));

  return (
    <WidgetShell
      title="Byte Anatomy"
      instructorNotes="Same stack as git packfile bytes: electricity first, meaning last."
    >
      {() => (
        <div class="mw-anatomy">
          <label>
            Pick a hex byte: 0x
            <input
              maxlength={2}
              value={hexInput()}
              onInput={(e) => setHexInput(e.currentTarget.value.toUpperCase())}
            />
          </label>

          <div class="mw-layer-stack">
            {LAYERS.map((layer) => (
              <div class="mw-layer">
                <div class="mw-layer-head">
                  <strong>{layer.label}</strong>
                  <span>{layer.detail}</span>
                </div>
                <code>{layerValues()[layer.key]}</code>
              </div>
            ))}
          </div>

          <p class="mw-hint">
            The computer only knows binary. Hex, decimal, and ASCII are different pairs of glasses.
          </p>
        </div>
      )}
    </WidgetShell>
  );
}
