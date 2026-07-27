/** Shared conversion helpers for binary / hex / decimal lessons. */

export const NIBBLE_PLACES = [8, 4, 2, 1] as const;
export const BYTE_PLACES = [128, 64, 32, 16, 8, 4, 2, 1] as const;

export const HEX_DIGITS = "0123456789ABCDEF";

export function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.floor(value)));
}

export function decimalToBits(value: number): number[] {
  return BYTE_PLACES.map((place) => (clampByte(value) & place ? 1 : 0));
}

export function bitsToDecimal(bits: number[]): number {
  return bits.reduce((sum, bit, index) => sum + bit * BYTE_PLACES[index], 0);
}

export function decimalToHex(value: number): string {
  return clampByte(value).toString(16).toUpperCase().padStart(2, "0");
}

export function decimalToBinaryString(value: number): string {
  return decimalToBits(value).join("");
}

export function formattedBinary(value: number): string {
  const bits = decimalToBinaryString(value);
  return `${bits.slice(0, 4)} ${bits.slice(4)}`;
}

export function nibbleToHexDigit(bits: number[]): string {
  const value = bits.reduce((sum, bit, index) => sum + bit * NIBBLE_PLACES[index], 0);
  return HEX_DIGITS[value] ?? "?";
}

export function nibbleDecimal(bits: number[]): number {
  return bits.reduce((sum, bit, index) => sum + bit * NIBBLE_PLACES[index], 0);
}

export function asciiForByte(value: number): string {
  const byte = clampByte(value);
  if (byte >= 32 && byte <= 126) {
    return String.fromCharCode(byte);
  }
  if (byte === 10) return "\\n";
  if (byte === 13) return "\\r";
  if (byte === 9) return "\\t";
  return "non-printable";
}

export function hexToDecimal(hex: string): number | null {
  const cleaned = hex.replace(/^0x/i, "").trim();
  if (!/^[0-9a-fA-F]{1,2}$/.test(cleaned)) return null;
  return parseInt(cleaned, 16);
}
