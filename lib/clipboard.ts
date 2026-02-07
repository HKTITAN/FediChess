/**
 * Safe copy to clipboard: uses Clipboard API when available, falls back to execCommand.
 * Returns true if copy succeeded, false otherwise (e.g. permission denied, not in user gesture).
 * Works in non-secure contexts (e.g. HTTP) where navigator.clipboard may be undefined.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to fallback
  }
  // Fallback: use a temporary input. Some browsers (e.g. iOS) need it focusable and selected.
  const input = document.createElement("input");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.cssText =
    "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    // ignore
  }
  document.body.removeChild(input);
  return ok;
}
