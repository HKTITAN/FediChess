/**
 * Safe copy to clipboard: uses Clipboard API when available, falls back to execCommand.
 * Works in non-secure contexts (e.g. HTTP) where navigator.clipboard may be undefined.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to fallback
  }
  const input = document.createElement("input");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}
