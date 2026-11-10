/**
 * FamGateway UPI guidance helpers.
 *
 * Do NOT fabricate app-specific payment URLs (gpay://, phonepe://, etc.).
 * Use FamGateway hosted `checkout_url` for app selection / QR / fallback,
 * and the gateway-returned generic `upi_intent` (upi://pay?...) so the OS
 * presents installed UPI apps (GPay, PhonePe, Paytm, BHIM, Cred, FamPay, …).
 */

export function describeSupportedUpiApps(): string[] {
  return [
    'Google Pay',
    'PhonePe',
    'Paytm',
    'BHIM',
    'Cred',
    'FamPay',
    'Other installed UPI applications',
  ];
}

export function isLikelyMobileUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}
