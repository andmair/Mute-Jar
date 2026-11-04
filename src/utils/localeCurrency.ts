/**
 * Local Currency Detection & Formatting
 * Detects the user's local currency based on browser/system locale and timezone settings.
 */

// Mapping common countries / locales to their standard ISO 4217 currency codes
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  NZ: 'NZD',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  JP: 'JPY',
  IN: 'INR',
  SG: 'SGD',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  ZA: 'ZAR',
  BR: 'BRL',
  MX: 'MXN',
};

// Common timezones to country code fallbacks
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Europe/London': 'GB',
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Asia/Tokyo': 'JP',
  'Asia/Singapore': 'SG',
  'Asia/Kolkata': 'IN',
  'Pacific/Auckland': 'NZ',
};

/**
 * Detect the user's local currency code (e.g. AUD, USD, GBP, EUR) from browser/system settings
 */
export function detectLocalCurrency(): { currencyCode: string; symbol: string; countryCode: string } {
  try {
    let countryCode = 'US';

    // 1. Try detecting from navigator.language / languages (e.g. "en-AU" => "AU")
    const languages = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    for (const lang of languages) {
      if (lang && lang.includes('-')) {
        const parts = lang.split('-');
        if (parts[1] && parts[1].length === 2) {
          countryCode = parts[1].toUpperCase();
          break;
        }
      }
    }

    // 2. Check timezone mapping if countryCode is still default
    if (countryCode === 'US') {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz && TIMEZONE_COUNTRY_MAP[tz]) {
          countryCode = TIMEZONE_COUNTRY_MAP[tz];
        }
      } catch {
        // ignore
      }
    }

    const currencyCode = LOCALE_CURRENCY_MAP[countryCode] || 'USD';

    // Get currency symbol via Intl
    const symbol = getCurrencySymbol(currencyCode);

    return { currencyCode, symbol, countryCode };
  } catch {
    return { currencyCode: 'USD', symbol: '$', countryCode: 'US' };
  }
}

/**
 * Extract symbol from Intl.NumberFormat
 */
export function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0);
    const symbolPart = parts.find((p) => p.type === 'currency');
    return symbolPart ? symbolPart.value : '$';
  } catch {
    return '$';
  }
}

/**
 * Format a number as local currency using Intl.NumberFormat
 */
export function formatLocalCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export const POPULAR_CURRENCIES = [
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { code: 'NZD', label: 'NZD ($) - New Zealand Dollar' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { code: 'SGD', label: 'SGD ($) - Singapore Dollar' },
  { code: 'INR', label: 'INR (₹) - Indian Rupee' },
];
