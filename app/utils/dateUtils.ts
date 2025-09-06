// Utility functions for date/time operations extracted from DateTimePicker
// Keeping this focused (no React imports) for easy unit testing.

export type DateDisplayMode = "date" | "time" | "datetime"

/** Internal validity guard */
function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/** Format a date according to the display mode (24-hour time). Returns fallback if invalid or null. */
export function formatDisplayDate(
  value: Date | null,
  mode: DateDisplayMode,
  fallback: string,
): string {
  if (!value || !isValidDate(value)) return fallback

  try {
    if (mode === "date") {
      return value.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    }
    if (mode === "time") {
      return value.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
    }
    // datetime
    const dateStr = value.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    const timeStr = value.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    })
    return `${dateStr} ${timeStr}`
  } catch {
    return fallback
  }
}
