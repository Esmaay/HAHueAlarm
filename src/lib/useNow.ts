/**
 * Re-renders the caller on a fixed interval so relative-time displays
 * ("in 12h 24m", "Rings in 8h") stay current without manual refresh.
 *
 * Returns the current epoch millis, but callers can ignore it and simply rely
 * on the re-render — the pure time helpers read the wall clock themselves.
 */

import { useEffect, useState } from 'react';

export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
