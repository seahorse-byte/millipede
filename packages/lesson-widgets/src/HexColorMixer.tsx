import { createMemo, createSignal } from "solid-js";
import { WidgetShell } from "./WidgetShell";
import { clampByte, decimalToHex, formattedBinary } from "./binary-utils";

function ChannelSlider(props: {
  label: string;
  value: () => number;
  onInput: (value: number) => void;
}) {
  return (
    <label class="mw-color-channel">
      {props.label}: {props.value()} (0x{decimalToHex(props.value())}) ·{" "}
      {formattedBinary(props.value())}
      <input
        type="range"
        min={0}
        max={255}
        value={props.value()}
        onInput={(e) => props.onInput(clampByte(Number(e.currentTarget.value)))}
      />
    </label>
  );
}

export function HexColorMixer() {
  const [red, setRed] = createSignal(255);
  const [green, setGreen] = createSignal(0);
  const [blue, setBlue] = createSignal(0);

  const hexColor = createMemo(
    () => `#${decimalToHex(red())}${decimalToHex(green())}${decimalToHex(blue())}`,
  );

  return (
    <WidgetShell
      title="Hex Color Mixer"
      instructorNotes="RGB is three bytes. Each channel is 0x00–0xFF. Connect to CSS and design systems."
    >
      {(mode) => (
        <div class="mw-color">
          <div class="mw-color-swatch" style={{ background: hexColor() }} />
          <p class="mw-mono">
            <strong>{hexColor()}</strong>
          </p>
          <ChannelSlider label="Red" value={red} onInput={setRed} />
          <ChannelSlider label="Green" value={green} onInput={setGreen} />
          <ChannelSlider label="Blue" value={blue} onInput={setBlue} />
          {mode() === "challenge" && (
            <p class="mw-hint">
              Challenge: build #FFFF00 (yellow), #880000 (dark red), and compare #111111 vs #EEEEEE.
            </p>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
