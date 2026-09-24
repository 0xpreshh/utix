import { inspectEnvelope } from "@/features/xdr-inspector/lib/xdrInspector";
import type { XdrInput } from "@/features/xdr-inspector/types";

self.onmessage = (event: MessageEvent<{ type: string; input: XdrInput }>) => {
  if (event.data.type === "decode") {
    const result = inspectEnvelope(event.data.input);
    self.postMessage(result);
  }
};
