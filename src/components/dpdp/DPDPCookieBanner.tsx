import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Settings,
  Lock,
  BarChart3,
  Target,
  ExternalLink,
  Languages,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  ConsentLanguage,
  ConsentPreferences,
  DPDP_NOTICE_TEXT_EN,
  DPDP_NOTICE_TEXT_HI,
  getStoredConsent,
  hasExplicitConsent,
  submitConsent,
  withdrawAllConsent,
} from '../../lib/consentManager';
import { GrievanceOfficerModal } from './GrievanceOfficerModal';

interface DPDPCookieBannerProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function DPDPCookieBanner({ forceOpen = false, onClose }: DPDPCookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState<ConsentLanguage>('en');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Granular preference state: Default OFF for non-essential (Strict DPDP Act compliance: No pre-ticked boxes)
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Strictly Necessary is always ON and locked
    analytics: false,
    marketing: false,
  });

  const [hasExistingConsent, setHasExistingConsent] = useState(false);

  useEffect(() => {
    const existing = getStoredConsent();
    if (existing) {
      setHasExistingConsent(true);
      setLanguage(existing.language || 'en');
      setPreferences(existing.preferences);
      if (forceOpen) {
        setIsVisible(true);
        setShowPreferences(true); // Open directly to preferences if manually opened by user
      }
    } else {
      // First time visitor: show banner automatically
      setIsVisible(true);
    }
  }, [forceOpen]);

  // Listen for external open triggers (e.g. from ManageConsentButton)
  useEffect(() => {
    const handleReopen = () => {
      const current = getStoredConsent();
      if (current) {
        setPreferences(current.preferences);
        setLanguage(current.language);
      }
      setIsVisible(true);
      setShowPreferences(true);
    };

    window.addEventListener('dpdp_open_preferences', handleReopen);
    return () => window.removeEventListener('dpdp_open_preferences', handleReopen);
  }, []);

  if (!isVisible && !forceOpen) return null;

  const isHindi = language === 'hi';

  const handleAcceptAll = async () => {
    setIsSubmitting(true);
    try {
      await submitConsent({
        preferences: { essential: true, analytics: true, marketing: true },
        language,
        actionType: 'GRANTED',
      });
      setIsVisible(false);
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAll = async () => {
    setIsSubmitting(true);
    try {
      await submitConsent({
        preferences: { essential: true, analytics: false, marketing: false },
        language,
        actionType: 'REJECTED',
      });
      setIsVisible(false);
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSubmitting(true);
    try {
      const actionType = hasExistingConsent ? 'UPDATED' : 'GRANTED';
      await submitConsent({
        preferences,
        language,
        actionType,
      });
      setIsVisible(false);
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawConsent = async () => {
    setIsSubmitting(true);
    try {
      await withdrawAllConsent(language);
      setPreferences({ essential: true, analytics: false, marketing: false });
      setIsVisible(false);
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-5 pointer-events-none animate-slideUp"
        role="region"
        aria-label="DPDP Act Cookie and Privacy Notice"
      >
        <div className="max-w-4xl mx-auto bg-[#071d14]/95 backdrop-blur-xl border-2 border-emerald-500/30 rounded-2xl shadow-2xl shadow-black/80 p-4 sm:p-6 text-[#f4faf6] pointer-events-auto transition-all">
          
          {/* Header Row: Badge & Language Toggle */}
          <div className="flex items-center justify-between gap-3 border-b border-emerald-500/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isHindi ? '🇮🇳 DPDP अधिनियम (भारत) अनुपालन' : '🇮🇳 DPDP Act (India) Compliant'}</span>
              </span>
              <span className="hidden sm:inline text-slate-400 text-xs">• RealSalePro Privacy Notice</span>
            </div>

            {/* Language Switcher (DPDP Mandatory Dual-Language Support) */}
            <div className="flex items-center gap-1 bg-[#04120c] p-1 rounded-xl border border-emerald-500/25">
              <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Main Notice Body */}
          <div className="py-3 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
            <p>{isHindi ? DPDP_NOTICE_TEXT_HI : DPDP_NOTICE_TEXT_EN}</p>

            {/* Transparent Hyperlinks */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-400 pt-1 font-medium">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-emerald-300 inline-flex items-center gap-1"
              >
                {isHindi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-emerald-300 inline-flex items-center gap-1"
              >
                {isHindi ? 'सेवा की शर्तें (Terms)' : 'Terms of Service'}
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setShowGrievanceModal(true)}
                className="underline underline-offset-4 hover:text-emerald-300 text-emerald-400 inline-flex items-center gap-1 cursor-pointer"
              >
                {isHindi ? 'शिकायत निवारण अधिकारी संपर्क (Grievance Officer)' : 'Grievance Officer Contact'}
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => setShowPreferences(!showPreferences)}
                className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isHindi ? 'प्राथमिकताएं कस्टमाइज़ करें' : 'Customize Preferences'}</span>
                {showPreferences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Granular Toggles Drawer (No pre-ticked boxes for analytics & marketing) */}
          {showPreferences && (
            <div className="mt-2 mb-4 p-3.5 sm:p-4 rounded-xl bg-[#04120c] border border-emerald-500/25 space-y-3.5 animate-fadeIn">
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                <span>{isHindi ? 'विस्तृत कुकी एवं डेटा विकल्प' : 'Granular Cookie & Data Consent Choices'}</span>
                <span className="text-[11px] font-normal lowercase text-slate-400">
                  {isHindi ? 'धारा 6 के अनुसार स्पष्ट सहमति' : 'DPDP Section 6 compliant'}
                </span>
              </div>

              {/* 1. Essential / Strictly Necessary (Always ON) */}
              <div className="p-3 rounded-lg bg-[#071d14] border border-emerald-500/20 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {isHindi ? '1. अनिवार्य एवं आवश्यक (Essential)' : '1. Strictly Necessary / Essential'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      {isHindi ? 'सदैव सक्रिय' : 'Always Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isHindi
                      ? 'सुरक्षित लॉगिन, CSRF सुरक्षा, वर्कस्पेस रूटिंग और मुख्य CRM लीड फॉर्म कार्यप्रणाली के लिए आवश्यक।'
                      : 'Required for secure user authentication, CSRF token security, workspace routing, and core CRM lead capture forms.'}
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    aria-label="Essential Cookies Always On"
                    className="w-4 h-4 rounded text-emerald-500 bg-[#0a2318] border-emerald-500/50 cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              {/* 2. Analytics & Performance (Default OFF) */}
              <div className="p-3 rounded-lg bg-[#071d14] border border-emerald-500/20 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {isHindi ? '2. एनालिटिक्स एवं प्रदर्शन (Analytics)' : '2. Analytics & Performance'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {isHindi ? 'डिफ़ॉल्ट बंद' : 'Default OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isHindi
                      ? 'साइट प्रदर्शन, पेज नेविगेशन और एरर रिपोर्टिंग के अनाम विश्लेषण के लिए ताकि हम प्लेटफॉर्म को तेज और सुगम बना सकें।'
                      : 'Allows aggregate, anonymized traffic measurement, page navigation metrics, and error diagnostics to improve CRM responsiveness.'}
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    id="dpdp-analytics-toggle"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-[#0a2318] border-emerald-500/50 focus:ring-emerald-400/20 cursor-pointer"
                  />
                </div>
              </div>

              {/* 3. Marketing & Retargeting (Default OFF) */}
              <div className="p-3 rounded-lg bg-[#071d14] border border-emerald-500/20 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {isHindi ? '3. मार्केटिंग एवं विज्ञापन (Marketing)' : '3. Marketing & Retargeting'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {isHindi ? 'डिफ़ॉल्ट बंद' : 'Default OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isHindi
                      ? 'Meta Ads पिक्सल और Google Ads के माध्यम से प्रासंगिक रियल एस्टेट अपडेट, वेबिनार और व्यक्तिगत ऑफर प्रदर्शित करने के लिए।'
                      : 'Enables Meta Pixel & Google Ads conversion tracking to show relevant real estate webinars, updates, and tailored property offers.'}
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    id="dpdp-marketing-toggle"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-[#0a2318] border-emerald-500/50 focus:ring-emerald-400/20 cursor-pointer"
                  />
                </div>
              </div>

              {/* Easy Withdrawal Option if previously consented */}
              {hasExistingConsent && (
                <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{isHindi ? 'सहमति वापस लेने का अधिकार:' : 'Right to Withdraw Consent:'}</span>
                  <button
                    type="button"
                    onClick={handleWithdrawConsent}
                    disabled={isSubmitting}
                    className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-4 cursor-pointer"
                  >
                    {isHindi ? 'सभी सहमति तुरंत वापस लें (Withdraw All)' : 'Withdraw All Consent'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dark-Pattern Free Buttons: Strictly EQUAL Visual Weight, Height & Contrast */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            
            {/* Button 1: Reject All */}
            <button
              type="button"
              onClick={handleRejectAll}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#04120c] hover:bg-slate-900 border-2 border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {isHindi ? 'सभी अस्वीकार करें (Reject All)' : 'Reject All'}
            </button>

            {/* Button 2: Save Preferences */}
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#0a271a] hover:bg-[#0e3624] border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-200 hover:text-white transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {isHindi ? 'प्राथमिकताएं सहेजें (Save)' : 'Save Preferences'}
            </button>

            {/* Button 3: Accept All */}
            <button
              type="button"
              onClick={handleAcceptAll}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {isHindi ? 'सभी स्वीकार करें (Accept All)' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>

      {/* Grievance Officer Modal */}
      <GrievanceOfficerModal
        isOpen={showGrievanceModal}
        onClose={() => setShowGrievanceModal(false)}
        language={language}
      />
    </>
  );
}
