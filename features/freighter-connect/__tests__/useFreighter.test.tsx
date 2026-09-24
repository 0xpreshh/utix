import { afterEach, describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  DETECTION_RETRY_INTERVAL_MS,
  DETECTION_RETRY_WINDOW_MS,
  useFreighter
} from "@/features/freighter-connect/hooks/useFreighter";
import {
  connectedApi,
  lockedApi,
  walletPublicKey
} from "@/features/freighter-connect/fixtures/freighterConnect.fixture";
import type { FreighterApi } from "@/features/freighter-connect/types";

function install(api: FreighterApi | undefined) {
  if (api) {
    (window as unknown as { freighterApi?: FreighterApi }).freighterApi = api;
  } else {
    delete (window as unknown as { freighterApi?: FreighterApi }).freighterApi;
  }
}

afterEach(() => install(undefined));

describe("useFreighter", () => {
  it("reports a missing extension once the retry window is exhausted", async () => {
    install(undefined);
    const { result } = renderHook(() => useFreighter());

    await waitFor(
      () => expect(result.current.state).toEqual({ status: "error", code: "not_installed" }),
      { timeout: DETECTION_RETRY_WINDOW_MS + 1000 }
    );
  }, DETECTION_RETRY_WINDOW_MS + 2000);

  it("detects an extension that injects itself after mount, without a manual refresh", async () => {
    install(undefined);
    const { result } = renderHook(() => useFreighter());
    expect(result.current.state).toEqual({ status: "checking" });

    setTimeout(() => install(connectedApi), DETECTION_RETRY_INTERVAL_MS);

    await waitFor(() => expect(result.current.state.status).toBe("ready"), {
      timeout: DETECTION_RETRY_WINDOW_MS
    });
    expect(result.current.state).toMatchObject({ snapshot: { publicKey: walletPublicKey } });
  }, DETECTION_RETRY_WINDOW_MS + 1000);

  it("reads a connected wallet on mount", async () => {
    install(connectedApi);
    const { result } = renderHook(() => useFreighter());

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state).toMatchObject({
      snapshot: { publicKey: walletPublicKey, network: "testnet" }
    });
  });

  it("picks up an extension installed after the retry window via manual refresh", async () => {
    install(undefined);
    const { result } = renderHook(() => useFreighter());
    await waitFor(() => expect(result.current.state.status).toBe("error"), {
      timeout: DETECTION_RETRY_WINDOW_MS + 1000
    });

    install(connectedApi);
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
  }, DETECTION_RETRY_WINDOW_MS + 2000);

  it("moves from not-allowed to connected after requesting access", async () => {
    install(lockedApi);
    const { result } = renderHook(() => useFreighter());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state).toMatchObject({ snapshot: { allowed: false } });

    install(connectedApi);
    await act(async () => {
      await result.current.connect();
    });

    await waitFor(() =>
      expect(result.current.state).toMatchObject({ snapshot: { allowed: true } })
    );
  });
});
