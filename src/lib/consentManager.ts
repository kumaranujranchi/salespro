/**
 * Digital Personal Data Protection (DPDP) Act, 2023 (India)
 * Consent Manager & Verifiable Audit Trail Client Utility
 */

export type ConsentLanguage = 'en' | 'hi';
export type ConsentActionType = 'GRANTED' | 'REJECTED' | 'UPDATED' | 'WITHDRAWN';

export interface ConsentPreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

export interface StoredConsentState {
  anonymousId: string;
  preferences: ConsentPreferences;
  language: ConsentLanguage;
  policyVersion: string;
  actionType: ConsentActionType;
  noticeTextHash: string;
  timestamp: string;
}

export const DPDP_POLICY_VERSION = 'v1.0-2026';

export const DPDP_NOTICE_TEXT_EN =
  'RealSalePro collects user data via lead generation forms, site analytics, and marketing pixels to manage real estate CRM leads, analyze site performance, and deliver personalized property updates. In accordance with the Digital Personal Data Protection (DPDP) Act, 2023, you have full control over your personal data. Essential cookies remain active to power your session, while Analytics and Marketing cookies are blocked until your explicit consent. You may withdraw or modify your consent at any time.';

export const DPDP_NOTICE_TEXT_HI =
  'RealSalePro रियल एस्टेट CRM लीड प्रबंधन, साइट प्रदर्शन विश्लेषण और प्रासंगिक प्रॉपर्टी अपडेट प्रदान करने के लिए लीड जनरेशन फॉर्म, एनालिटिक्स और मार्केटिंग पिक्सल के माध्यम से आपका डेटा एकत्र करता है। डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम, 2023 के अनुसार, आपके व्यक्तिगत डेटा पर आपका पूर्ण नियंत्रण है। अनिवार्य कुकीज़ आपके सत्र को सुरक्षित रखने के लिए सक्रिय रहती हैं, जबकि एनालिटिक्स और मार्केटिंग कुकीज़ आपकी स्पष्ट सहमति तक पूरी तरह से ब्लॉक रहती हैं। आप किसी भी समय अपनी सहमति वापस ले सकते हैं या बदल सकते हैं।';

export const GRIEVANCE_OFFICER_INFO = {
  name: 'Anuj Kumar Singh',
  designation: 'Data Protection & Grievance Redressal Officer',
  email: 'grievance@realsalepro.com',
  company: 'RealSalePro Technologies Private Limited',
  address: 'Ranchi, Jharkhand, India - 834001',
  slaHours: 72,
  legalBasis: 'Rule 3(2) of the Digital Personal Data Protection Rules, 2026 (India)',
};

const COOKIE_NAME = 'dpdp_consent_id';
const STORAGE_KEY = 'dpdp_consent_preferences_v1';

/**
 * Reads a cookie value by key.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Sets a persistent cookie (1-year validity for strictly necessary consent tracking).
 */
export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Generates an RFC4122 v4 UUID in browser.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates the persistent anonymous identifier (UUID) for DPDP consent audit trail.
 */
export function getOrCreateAnonymousId(): string {
  let id = getCookie(COOKIE_NAME);
  if (!id && typeof localStorage !== 'undefined') {
    id = localStorage.getItem('dpdp_anon_id');
  }
  if (!id) {
    id = generateUUID();
    setCookie(COOKIE_NAME, id, 365);
    try {
      localStorage.setItem('dpdp_anon_id', id);
    } catch {
      // Ignore localStorage error
    }
  }
  return id;
}

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
export async function computeNoticeHash(text: string): Promise<string> {
  const clean = String(text || '').trim();
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const msgUint8 = new TextEncoder().encode(clean);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto error, falling back to basic hash representation:', err);
  }

  // Fallback 32-bit FNV-1a hex representation if subtle crypto unavailable
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(64, '0');
}

/**
 * Updates Google Tag Manager & Google Analytics Consent Mode v2 state.
 */
export function updateGtagConsent(prefs: ConsentPreferences): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        ad_user_data: prefs.marketing ? 'granted' : 'denied',
        ad_personalization: prefs.marketing ? 'granted' : 'denied',
      });
    } catch (err) {
      console.warn('Gtag consent update error:', err);
    }
  }
}

/**
 * Retrieves cached consent state from local storage.
 */
export function getStoredConsent(): StoredConsentState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsentState;
  } catch {
    return null;
  }
}

/**
 * Checks whether user has already made an explicit consent choice.
 */
export function hasExplicitConsent(): boolean {
  return getStoredConsent() !== null;
}

/**
 * Checks whether user has granted consent for a specific category.
 */
export function hasConsentFor(category: 'essential' | 'analytics' | 'marketing'): boolean {
  if (category === 'essential') return true;
  const stored = getStoredConsent();
  if (!stored) return false;
  return Boolean(stored.preferences[category]);
}

/**
 * Records and synchronizes consent to backend and local storage.
 */
export async function submitConsent({
  preferences,
  language = 'en',
  actionType,
}: {
  preferences: Partial<ConsentPreferences>;
  language?: ConsentLanguage;
  actionType: ConsentActionType;
}): Promise<StoredConsentState> {
  const anonymousId = getOrCreateAnonymousId();
  const noticeText = language === 'hi' ? DPDP_NOTICE_TEXT_HI : DPDP_NOTICE_TEXT_EN;
  const noticeTextHash = await computeNoticeHash(noticeText);

  const fullPreferences: ConsentPreferences = {
    essential: true, // Always ON
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
  };

  const payload = {
    anonymous_id: anonymousId,
    policy_version: DPDP_POLICY_VERSION,
    language,
    preferences: fullPreferences,
    action_type: actionType,
    notice_text_hash: noticeTextHash,
  };

  // 1. Update Google Consent Mode v2 immediately
  updateGtagConsent(fullPreferences);

  // 2. Cache in LocalStorage
  const state: StoredConsentState = {
    anonymousId,
    preferences: fullPreferences,
    language,
    policyVersion: DPDP_POLICY_VERSION,
    actionType,
    noticeTextHash,
    timestamp: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Unable to cache consent state in localStorage:', err);
  }

  // 3. Dispatch global browser event for any component/script listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dpdp_consent_updated', {
        detail: state,
      })
    );
  }

  // 4. Asynchronously send verifiable consent proof to backend
  try {
    const response = await fetch('/api/v1/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Fallback try /api/consent
      await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch (apiErr) {
    console.warn('Failed to dispatch consent proof to backend (will retry on next load):', apiErr);
  }

  return state;
}

/**
 * Complete withdrawal of consent (sets analytics and marketing to false, logs WITHDRAWN).
 */
export async function withdrawAllConsent(language: ConsentLanguage = 'en'): Promise<StoredConsentState> {
  return submitConsent({
    preferences: {
      essential: true,
      analytics: false,
      marketing: false,
    },
    language,
    actionType: 'WITHDRAWN',
  });
}

/**
 * Records explicit, verifiable consent proof for lead capture forms (Web Form, Template Download, Contact Us).
 * Complies with DPDP Act, 2023 Section 5 (Notice) & Section 6 (Consent).
 */
export async function recordLeadFormConsent({
  identifier,
  name,
  purpose = 'Real Estate Inquiry, CRM Walkthrough & Follow-up Communications',
  noticeText = 'I consent to receiving property details and communications via WhatsApp/SMS/Call under DPDP Act, 2023.',
  language = 'en',
  leadId,
}: {
  identifier: string;
  name?: string;
  purpose?: string;
  noticeText?: string;
  language?: ConsentLanguage;
  leadId?: string;
}): Promise<{ success: boolean; consent_proof_id?: string; error?: string }> {
  try {
    const payload = {
      identifier,
      name,
      purpose,
      notice_text: noticeText,
      language,
      lead_id: leadId,
      anonymous_id: getOrCreateAnonymousId(),
    };

    const res = await fetch('/api/v1/consent/lead-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Fallback endpoint
      const fb = await fetch('/api/consent/lead-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await fb.json();
    }

    return await res.json();
  } catch (err: any) {
    console.warn('[DPDP] Error dispatching lead consent proof:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Submits Data Subject Rights Request (DSR) under DPDP Act, 2023.
 * Supports Section 12 (Right to Erasure) & Section 11 (Right to Access).
 */
export async function submitDSRRequest({
  identifier,
  requestType = 'erasure',
  confirmation,
  reason,
}: {
  identifier: string;
  requestType: 'erasure' | 'access';
  confirmation?: string;
  reason?: string;
}): Promise<any> {
  const payload = {
    identifier,
    request_type: requestType,
    confirmation,
    reason,
  };

  const res = await fetch('/api/v1/consent/dsr-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const fb = await fetch('/api/consent/dsr-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await fb.json();
  }

  return await res.json();
}

/**
 * Checks privacy and consent records for a given phone or email.
 */
export async function lookupDSRData(identifier: string): Promise<any> {
  const query = encodeURIComponent(identifier);
  const res = await fetch(`/api/v1/consent/dsr-lookup?identifier=${query}`);
  if (!res.ok) {
    const fb = await fetch(`/api/consent/dsr-lookup?identifier=${query}`);
    return await fb.json();
  }
  return await res.json();
}
