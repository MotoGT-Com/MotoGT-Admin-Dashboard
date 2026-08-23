export interface DialCountry {
  iso: string;
  dial: string;
  name: string;
  flag: string;
}

/** Common storefront markets — Jordan first (default). */
export const DIAL_COUNTRIES: DialCountry[] = [
  { iso: "JO", dial: "+962", name: "Jordan", flag: "🇯🇴" },
  { iso: "AE", dial: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { iso: "SA", dial: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { iso: "EG", dial: "+20", name: "Egypt", flag: "🇪🇬" },
  { iso: "IQ", dial: "+964", name: "Iraq", flag: "🇮🇶" },
  { iso: "PS", dial: "+970", name: "Palestine", flag: "🇵🇸" },
  { iso: "LB", dial: "+961", name: "Lebanon", flag: "🇱🇧" },
  { iso: "KW", dial: "+965", name: "Kuwait", flag: "🇰🇼" },
  { iso: "QA", dial: "+974", name: "Qatar", flag: "🇶🇦" },
  { iso: "BH", dial: "+973", name: "Bahrain", flag: "🇧🇭" },
  { iso: "US", dial: "+1", name: "United States", flag: "🇺🇸" },
  { iso: "GB", dial: "+44", name: "United Kingdom", flag: "🇬🇧" },
];

export const DEFAULT_DIAL = DIAL_COUNTRIES[0].dial;

/** Digits only (keeps leading + if present on full numbers). */
export function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * Split a stored/E.164 phone into dial code + national number.
 * Falls back to Jordan (+962) when no known prefix matches.
 */
export function splitPhone(
  fullPhone: string,
  fallbackDial: string = DEFAULT_DIAL,
): { dial: string; national: string } {
  const trimmed = fullPhone.trim();
  if (!trimmed) {
    return { dial: fallbackDial, national: "" };
  }

  const normalized = trimmed.startsWith("+")
    ? trimmed
    : trimmed.startsWith("00")
      ? `+${trimmed.slice(2)}`
      : trimmed;

  if (normalized.startsWith("+")) {
    const sorted = [...DIAL_COUNTRIES].sort(
      (a, b) => b.dial.length - a.dial.length,
    );
    for (const country of sorted) {
      if (normalized.startsWith(country.dial)) {
        return {
          dial: country.dial,
          national: digitsOnly(normalized.slice(country.dial.length)),
        };
      }
    }
    return {
      dial: fallbackDial,
      national: digitsOnly(normalized),
    };
  }

  // Local form e.g. 0791234567 — keep as national under default dial.
  return {
    dial: fallbackDial,
    national: digitsOnly(normalized),
  };
}

/**
 * Compose E.164-style phone. Strips a single leading 0 from national
 * numbers (common when typing local Jordan mobiles).
 */
export function composePhone(dial: string, national: string): string {
  let local = digitsOnly(national);
  if (local.startsWith("0")) {
    local = local.slice(1);
  }
  const code = dial.startsWith("+") ? dial : `+${digitsOnly(dial)}`;
  if (!local) return code;
  return `${code}${local}`;
}

export function isPhoneReady(dial: string, national: string): boolean {
  const local = digitsOnly(national).replace(/^0/, "");
  return Boolean(dial) && local.length >= 7;
}

/** Canonical digits for comparison (no + / spaces / leading trunk 0). */
export function phoneMatchKey(phone: string): string {
  let digits = digitsOnly(phone);
  // Drop international 00 prefix if present as digits.
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

/** True when two phones refer to the same line (handles +962 / 962 / 07… forms). */
export function phonesMatch(a: string, b: string): boolean {
  const ka = phoneMatchKey(a);
  const kb = phoneMatchKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  // Compare national tails (ignore country code length differences).
  const tailLen = Math.min(9, ka.length, kb.length);
  if (tailLen < 7) return false;
  return ka.slice(-tailLen) === kb.slice(-tailLen);
}

/** Search strings to try against GET /admin/users?q= for a composed E.164 phone. */
export function phoneSearchVariants(dial: string, national: string): string[] {
  const e164 = composePhone(dial, national);
  const local = digitsOnly(national).replace(/^0/, "");
  const withTrunk = local.startsWith("0") ? local : `0${local}`;
  const dialDigits = digitsOnly(dial);
  const variants = [
    e164,
    e164.replace(/^\+/, ""),
    local,
    withTrunk,
    `${dialDigits}${local}`,
  ];
  return [...new Set(variants.filter((v) => v.length >= 7))];
}

