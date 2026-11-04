/**
 * Security and sanitization utilities
 * Enforces safe URL schemes (preventing javascript:, data:, vbscript: XSS vectors)
 * and bounds input text lengths.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates and sanitizes a URL.
 * Only http: and https: protocols are permitted.
 * Returns empty string for invalid, dangerous, or unparseable URLs.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    // If user provided a URL without protocol (e.g. "www.globalgiving.org"), prepend https://
    const urlWithProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(urlWithProtocol);
    if (ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Checks if a URL is valid and safe to navigate to.
 */
export function isSafeUrl(url?: string | null): boolean {
  return sanitizeUrl(url).length > 0;
}

/**
 * Bounds text input, removes dangerous control characters, and prevents excessive payloads.
 */
export function sanitizeText(text?: string | null, maxLength = 250): string {
  if (!text || typeof text !== 'string') return '';
  // Strip non-printable ASCII control characters (keep standard whitespace)
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Validates a numeric value within safe finite bounds.
 */
export function sanitizeNumeric(value: unknown, fallback = 0, min = 0, max = 1000000): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}
