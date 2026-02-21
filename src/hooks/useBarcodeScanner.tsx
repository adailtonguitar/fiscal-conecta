import { useEffect, useCallback, useRef } from "react";

/**
 * Hook to capture barcode scanner input.
 * USB/Bluetooth barcode scanners act as keyboard devices,
 * typing characters rapidly and ending with Enter.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (tag === "TEXTAREA") return;

      // Skip inputs marked as non-barcode (qty, discount, etc.)
      if (tag === "INPUT" && target.dataset.noBarcodeCapture === "true") return;

      // If typing in search input, let it through but also capture for barcode
      const isInput = tag === "INPUT";

      if (e.key === "Enter" && buffer.current.length >= 3) {
        e.preventDefault();
        const code = buffer.current.trim();
        buffer.current = "";
        if (timeout.current) clearTimeout(timeout.current);
        onScan(code);
        return;
      }

      // Only capture printable single characters (not F-keys)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer.current += e.key;

        // Reset buffer after 100ms of no input (human typing is slower)
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          buffer.current = "";
        }, 100);
      }
    },
    [onScan]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [handleKeyDown]);
}
