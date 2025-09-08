import { translate } from "@/i18n/translate"
import type { TxKeyPath } from "@/i18n"

/**
 * Safely translate an error or message key. Accepts either a translation key (namespace:key)
 * or a raw string. If translation fails or the string is not in key format, returns the input.
 */
export function safeTranslate(key: string | null | undefined): string {
  if (!key) return ""
  if (key.includes(":")) {
    try {
      return translate(key as TxKeyPath)
    } catch {
      return key
    }
  }
  return key
}
