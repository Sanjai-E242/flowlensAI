/**
 * FlowLens AI - Deterministic Time & Duration Utilities
 * Phase 1: Event Data Engine
 */

/**
 * Deterministically parses a date string or number into a Unix millisecond timestamp and ISO string.
 * Supports ISO-8601, standard database datetime (YYYY-MM-DD HH:mm[:ss]), slashes, and Unix epochs.
 */
export function parseDeterministicTimestamp(input: string | number | undefined | null): {
  timestamp: number;
  iso: string;
} | null {
  if (input === undefined || input === null) {
    return null;
  }

  // If already a number
  if (typeof input === "number") {
    // Check if unix timestamp in seconds (10 digits) vs ms (13 digits)
    const ms = input < 1e11 ? input * 1000 : input;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return { timestamp: d.getTime(), iso: d.toISOString() };
  }

  const str = input.trim();
  if (!str) return null;

  // Numeric string timestamp
  if (/^\d{10,13}$/.test(str)) {
    const num = parseInt(str, 10);
    const ms = num < 1e11 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      return { timestamp: d.getTime(), iso: d.toISOString() };
    }
  }

  // Replace space with 'T' if format is YYYY-MM-DD HH:mm:ss
  let normalizedStr = str;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2}(\.\d+)?)?/.test(str)) {
    normalizedStr = str.replace(/\s+/, "T");
  } else if (/^\d{4}\/\d{2}\/\d{2}/.test(str)) {
    normalizedStr = str.replace(/\//g, "-").replace(/\s+/, "T");
  }

  const parsed = new Date(normalizedStr);
  const time = parsed.getTime();

  if (isNaN(time)) {
    // Try fallback for common DD/MM/YYYY or MM/DD/YYYY formats
    const slashParts = str.split(/[\sT]+/);
    const dateParts = slashParts[0].split(/[/-]/);
    const timePart = slashParts[1] || "00:00:00";

    if (dateParts.length === 3) {
      // If year is the third part: DD-MM-YYYY or MM-DD-YYYY
      if (dateParts[2].length === 4) {
        // Assume standard ISO conversion: YYYY-MM-DD
        const year = dateParts[2];
        const month = dateParts[0].padStart(2, "0");
        const day = dateParts[1].padStart(2, "0");
        const fallbackDate = new Date(`${year}-${month}-${day}T${timePart}`);
        if (!isNaN(fallbackDate.getTime())) {
          return { timestamp: fallbackDate.getTime(), iso: fallbackDate.toISOString() };
        }
      }
    }
    return null;
  }

  return {
    timestamp: time,
    iso: parsed.toISOString(),
  };
}

/**
 * Formats a duration in milliseconds into a concise, human-friendly duration string.
 * Example: 90000 -> "1m 30s", 3720000 -> "1h 2m", 86400000 -> "1d"
 */
export function formatDurationMs(ms: number): string {
  if (isNaN(ms) || ms < 0) {
    return "0ms";
  }

  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 && days === 0 && hours === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.length > 0 ? parts.join(" ") : "<1s";
}

/**
 * Helper to compute arithmetic mean of a numbers array
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return sum / values.length;
}

/**
 * Helper to compute median of a numbers array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Helper to compute population standard deviation
 */
export function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}
