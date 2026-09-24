import { describe, it, expect } from "vitest";
import { inspectEnvelope } from "@/features/xdr-inspector/lib/xdrInspector";
import { parseXdrInput } from "@/features/xdr-inspector/schema";
import { largeEnvelopeXdr, paymentXdr } from "@/features/xdr-inspector/fixtures/xdrInspector.fixture";

const FRAME_BUDGET_MS = 16;

describe("XDR decoding performance", () => {
  it("decodes a standard 2-operation transaction in frame budget", () => {
    const parsed = parseXdrInput(paymentXdr);
    if (!parsed.ok) throw new Error("fixture failed to parse");

    const start = performance.now();
    const result = inspectEnvelope(parsed.value);
    const elapsed = performance.now() - start;

    expect(result.ok).toBe(true);
    expect(elapsed).toBeLessThan(FRAME_BUDGET_MS);
  });

  it("documents 100-operation transaction decoding time", () => {
    const parsed = parseXdrInput(largeEnvelopeXdr);
    if (!parsed.ok) throw new Error("fixture failed to parse");

    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = inspectEnvelope(parsed.value);
      const elapsed = performance.now() - start;

      expect(result.ok).toBe(true);
      times.push(elapsed);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);

    console.log(`
XDR Decoding Benchmark (100 operations):
  Average: ${avg.toFixed(2)}ms
  Max: ${max.toFixed(2)}ms
  Frame budget (16ms): ${max <= FRAME_BUDGET_MS ? "✓ PASS" : "✗ FAIL"}
    `);

    if (max > FRAME_BUDGET_MS) {
      console.warn(`⚠ 100-operation transaction decoding exceeded frame budget by ${(max - FRAME_BUDGET_MS).toFixed(2)}ms`);
    }
  });
});
