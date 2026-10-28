/**
 * Phone number masking & protection utilities for RealSalePro.
 * Protects customer lead contact info from unauthorized lead export/theft by team members.
 */

/**
 * Determines whether lead phone masking is currently active for the viewing user.
 * - Active ONLY when tenant.settings?.security?.mask_lead_phone is true.
 * - Platform admins, super_admins, and tenant admins always see unmasked full numbers.
 * - Regular team members (sales executives, telecallers, managers, etc.) see masked numbers.
 */
export function isLeadPhoneMasked(
  tenant: { settings?: { security?: { mask_lead_phone?: boolean } } } | null | undefined,
  profile: { role?: string } | null | undefined
): boolean {
  if (!tenant?.settings?.security?.mask_lead_phone) {
    return false;
  }
  const role = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  // Tenant admin, super_admin, or platform admin always see unmasked numbers
  if (role === 'super_admin' || role === 'admin' || role === 'platform_admin') {
    return false;
  }
  return true;
}

/**
 * Formats a phone number with masking for protected team view.
 * Displays the first 5 digits so the user can verify carrier/series or context,
 * and masks the remaining digits with bullets (•••••).
 *
 * Examples:
 *   "9876543210"      => "98765 •••••"
 *   "+919876543210"   => "+91 98765 •••••"
 *   "+91 98765 43210" => "+91 98765 •••••"
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const str = String(phone).trim();
  const digits = str.replace(/\D/g, '');

  if (digits.length >= 10) {
    // 10 digits without country code or 12 digits with 91
    if (str.startsWith('+')) {
      const countryCode = str.slice(0, str.indexOf(' ') > 0 ? str.indexOf(' ') : 3);
      const remainingDigits = digits.slice(countryCode.replace(/\D/g, '').length);
      const visible = remainingDigits.slice(0, 5);
      return `${countryCode} ${visible} •••••`;
    }
    const last10 = digits.slice(-10);
    return `${last10.slice(0, 5)} •••••`;
  }

  if (digits.length > 4) {
    return `${digits.slice(0, 3)} •••••`;
  }

  return '•••••';
}
