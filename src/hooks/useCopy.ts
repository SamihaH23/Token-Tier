import { useCallback, useEffect, useRef, useState } from 'react';

/** Copy text to the clipboard; `copiedId` is set for 2s after a successful copy. */
export function useCopy(onCopied?: () => void) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false; // clipboard blocked (insecure context or permission denied)
      }
      setCopiedId(id);
      onCopied?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedId(null), 2000);
      return true;
    },
    [onCopied]
  );

  return { copiedId, copy };
}
