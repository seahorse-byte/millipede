import init, { redact_pii_deterministic } from "@millipede/redact-wasm";

let ready: Promise<void> | null = null;

export function ensureRedactorReady() {
  if (!ready) {
    ready = init().then(() => undefined);
  }
  return ready;
}

export async function redactInWorker(text: string): Promise<string> {
  await ensureRedactorReady();
  return redact_pii_deterministic(text);
}
