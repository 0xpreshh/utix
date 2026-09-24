import type { EnvelopeSummary, XdrErrorCode, XdrInput } from "@/features/xdr-inspector/types";
import type { Result } from "@/core/result/result";
import { inspectEnvelope } from "@/features/xdr-inspector/lib/xdrInspector";

const WORKER_THRESHOLD_BYTES = 2048;
const WORKER_TIMEOUT_MS = 5000;

let decodingWorker: Worker | null = null;
let workerInitialized = false;

function getDecodingWorker(): Worker | null {
  if (!typeof window) return null;
  if (!workerInitialized) {
    workerInitialized = true;
    try {
      decodingWorker = new Worker(new URL("./xdrInspector.worker.ts", import.meta.url), {
        type: "module"
      });
    } catch {
      return null;
    }
  }
  return decodingWorker;
}

function estimateEnvelopeSize(envelope: string): number {
  return Buffer.byteLength(envelope, "base64");
}

export async function decodeEnvelopeOptimized(
  input: XdrInput
): Promise<Result<EnvelopeSummary, XdrErrorCode>> {
  const envelopeSize = estimateEnvelopeSize(input.envelope);

  if (envelopeSize < WORKER_THRESHOLD_BYTES) {
    return inspectEnvelope(input);
  }

  const worker = getDecodingWorker();
  if (!worker) {
    return inspectEnvelope(input);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(inspectEnvelope(input));
    }, WORKER_TIMEOUT_MS);

    const messageHandler = (event: MessageEvent) => {
      clearTimeout(timeout);
      worker.removeEventListener("message", messageHandler);
      worker.removeEventListener("error", errorHandler);
      resolve(event.data);
    };

    const errorHandler = () => {
      clearTimeout(timeout);
      worker.removeEventListener("message", messageHandler);
      worker.removeEventListener("error", errorHandler);
      resolve(inspectEnvelope(input));
    };

    worker.addEventListener("message", messageHandler, { once: true });
    worker.addEventListener("error", errorHandler, { once: true });

    worker.postMessage({ type: "decode", input });
  });
}
