"use client";

import { useCallback, useEffect, useState } from "react";
import { readWallet, requestAccess } from "@/features/freighter-connect/lib/freighter";
import type {
  FreighterErrorCode,
  WalletSnapshot
} from "@/features/freighter-connect/types";

export type FreighterState =
  | { status: "checking" }
  | { status: "ready"; snapshot: WalletSnapshot }
  | { status: "error"; code: FreighterErrorCode };

/** How long to keep retrying a "not installed" read before giving up. */
export const DETECTION_RETRY_WINDOW_MS = 800;
/** Delay between detection attempts while the extension has not appeared yet. */
export const DETECTION_RETRY_INTERVAL_MS = 150;

function toState(
  result: Awaited<ReturnType<typeof readWallet>>
): FreighterState {
  return result.ok
    ? { status: "ready", snapshot: result.value }
    : { status: "error", code: result.code };
}

export function useFreighter() {
  // The first render is already "checking", so the mount effect below only has
  // to publish the answer — it never sets state synchronously.
  const [state, setState] = useState<FreighterState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + DETECTION_RETRY_WINDOW_MS;

    // Extensions inject their API asynchronously and inconsistently across
    // browsers, so a single check-on-mount can miss one that hasn't finished
    // loading yet. Retry within a bounded window instead of failing fast.
    async function attempt() {
      const result = await readWallet();
      if (!active) return;

      if (result.ok || result.code !== "not_installed" || Date.now() >= deadline) {
        setState(toState(result));
        return;
      }

      timeoutId = setTimeout(() => {
        void attempt();
      }, DETECTION_RETRY_INTERVAL_MS);
    }

    void attempt();

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const refresh = useCallback(async () => {
    setState({ status: "checking" });
    setState(toState(await readWallet()));
  }, []);

  const connect = useCallback(async () => {
    setState({ status: "checking" });
    setState(toState(await requestAccess()));
  }, []);

  return { state, refresh, connect };
}
