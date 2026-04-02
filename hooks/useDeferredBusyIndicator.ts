import { useEffect, useState } from 'react';

/**
 * Waits before showing a full busy state so fast session/data checks don’t flash a heavy loader.
 */
export function useDeferredBusyIndicator(isBusy: boolean, delayMs = 280): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(id);
  }, [isBusy, delayMs]);

  return visible;
}
