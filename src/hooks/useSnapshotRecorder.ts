import { useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

const DEBOUNCE_MS = 10_000;

interface UseSnapshotRecorderOptions {
  netWorth: number;
  currency: string;
  enabled: boolean;
  onSnapshotsUpdated: () => void;
}

export function useSnapshotRecorder({
  netWorth,
  currency,
  enabled,
  onSnapshotsUpdated,
}: UseSnapshotRecorderOptions) {
  const netWorthRef = useRef(netWorth);
  const currencyRef = useRef(currency);
  const lastRecordedRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    netWorthRef.current = netWorth;
  }, [netWorth]);

  useEffect(() => {
    currencyRef.current = currency;
  }, [currency]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const doRecord = useCallback(async () => {
    const value = netWorthRef.current;
    if (value === lastRecordedRef.current) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      await api.snapshots.create({
        totalValue: value,
        currency: currencyRef.current,
      });
      lastRecordedRef.current = value;
      onSnapshotsUpdated();
    } catch {
      // snapshot recording is best-effort
    } finally {
      inFlightRef.current = false;
    }
  }, [onSnapshotsUpdated]);

  const requestSnapshot = useCallback(() => {
    if (!enabled) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      doRecord();
    }, DEBOUNCE_MS);
  }, [enabled, doRecord]);

  const recordSnapshotNow = useCallback(() => {
    if (!enabled) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    doRecord();
  }, [enabled, doRecord]);

  return { requestSnapshot, recordSnapshotNow };
}
