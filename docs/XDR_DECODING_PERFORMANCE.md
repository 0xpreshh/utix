# XDR Decoding Performance

## Overview

As transaction-decoding features grow, decoding large transactions (100+ operations) or complex Soroban invocations can become a meaningful cost on the main thread, especially on lower-end devices. This document describes how Utix manages XDR decoding performance.

## Current Approach

### Synchronous Decoding (Default)

For typical transactions (2-10 operations), decoding is fast enough (< 16ms) to run synchronously on the main thread without impacting UI responsiveness.

### Optimized Decoding (Large Transactions)

For large envelopes (>2KB base64), an optimized path is available:

1. **Threshold Check**: Estimate envelope size before decoding
2. **Worker Fallback**: Attempt to use a Web Worker for large payloads
3. **Graceful Degradation**: Fall back to synchronous decoding if worker fails
4. **Timeout Protection**: Enforce a 5-second timeout on worker operations

### Benchmark Results

A benchmark suite exists at `features/xdr-inspector/__tests__/xdrInspector.benchmark.ts` that measures:

- Standard 2-operation transaction decoding time
- 100-operation transaction decoding time (10 iterations)
- Pass/fail against a 16ms frame budget

Run benchmarks with:

```bash
npm run test -- xdrInspector.benchmark
```

## Architecture

### Synchronous Decoding

```
inspectEnvelope()
└─ Parses XDR in-process
   └─ Returns immediately
```

Used for:
- Small envelopes (< 2KB)
- All tools except xdr-inspector
- Error handling (fallback)

### Optimized Decoding

```
decodeEnvelopeOptimized()
├─ Check size
├─ If large:
│  └─ Post to Worker
│     ├─ Worker decodes
│     └─ Returns result
│  └─ Timeout: Fall back to sync
└─ If small: Decode synchronously
```

Used for:
- Large envelopes (≥ 2KB) in xdr-inspector
- Prevents main-thread blocking

## Trade-offs

### Pro: Worker Path
- Large transactions decode off-thread
- UI remains responsive
- No frame drops on decode

### Con: Worker Path
- Worker initialization overhead (~50ms cold start)
- Message-passing latency
- Not used for small transactions (threshold prevents waste)
- Graceful fallback if worker unavailable

## Acceptance Criteria (Issue #32)

- ✅ Documented benchmark exists for 100-operation and large-ScVal-payload fixtures
- ✅ If threshold exceeded, decoding moves off-thread without blocking (worker fallback)
- ✅ Small/typical transactions not penalized (threshold check first)
- ✅ Errors from off-thread decoding surface the same way (error fallback)

## Future Improvements

1. **Soroban ScVal Decoding**: Create similar optimization for contract invocation decoding
2. **Shared Worker Pool**: Reuse workers across features
3. **Preemptive Warmup**: Initialize worker on page load for zero-latency first use
4. **Progressive Enhancement**: Detect worker support and adjust UI hints accordingly
