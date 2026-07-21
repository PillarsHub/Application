import { useCallback } from "react";

export function useUniversalCopy() {
  const copy = useCallback(async (text) => {
    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);

    // Modern API (not reliable on iOS Safari)
    if (!isIOS && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback below
      }
    }

    // Fallback for iOS + older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // iOS requires visible-but-offscreen element
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 99999); // iOS requirement

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    return success;
  }, []);

  return copy;
}
