const UNCLAIMED_HOST = 'unclaimed.motogt.local';

/** Walk-in accounts get a synthetic email like walkin+{phone}@unclaimed.motogt.local. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${UNCLAIMED_HOST}`);
}

/** Display email for UI — blank when the backend used a walk-in placeholder. */
export function displayCustomerEmail(email: string | null | undefined): string | null {
  if (!email || isPlaceholderEmail(email)) return null;
  return email;
}
