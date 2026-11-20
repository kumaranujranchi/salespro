import React from 'react';
import { X, ShieldCheck, Mail, MapPin, Clock, Building2, ExternalLink } from 'lucide-react';
import { GRIEVANCE_OFFICER_INFO, ConsentLanguage } from '../../lib/consentManager';

interface GrievanceOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: ConsentLanguage;
}

export function GrievanceOfficerModal({ isOpen, onClose, language = 'en' }: GrievanceOfficerModalProps) {
  if (!isOpen) return null;

  const isHindi = language === 'hi';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-[#071d14] border border-emerald-500/30 rounded-2xl shadow-2xl p-6 sm:p-7 text-[#f4faf6] space-y-5"
        role="dialog"
        aria-labelledby="dpdp-grievance-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="dpdp-grievance-title" className="text-lg font-bold text-white tracking-tight">
                {isHindi ? 'शिकायत निवारण अधिकारी संपर्क' : 'Data Grievance Officer Contact'}
              </h3>
              <p className="text-xs text-emerald-300/80 font-mono">
                {isHindi
                  ? 'डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) नियम 3(2)'
                  : 'DPDP Act, 2023 • Rule 3(2) Disclosure'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            {isHindi
              ? 'डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम 2023 की धारा 13 के तहत, किसी भी डेटा गोपनीयता संबंधी चिंता, सहमति वापसी, या शिकायत के लिए आप सीधे हमारे नियुक्त शिकायत निवारण अधिकारी से संपर्क कर सकते हैं:'
              : 'Pursuant to Section 13 of the Digital Personal Data Protection Act, 2023, you may contact our designated Grievance Redressal Officer for any privacy questions, consent withdrawal, or data disputes:'}
          </p>

          <div className="bg-[#05160f] border border-emerald-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">{GRIEVANCE_OFFICER_INFO.name}</div>
                <div className="text-[11px] text-slate-400">{GRIEVANCE_OFFICER_INFO.designation}</div>
                <div className="text-[11px] text-emerald-400/90">{GRIEVANCE_OFFICER_INFO.company}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 border-t border-emerald-500/10">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px]">
                <span className="text-slate-400 mr-1.5">{isHindi ? 'ईमेल:' : 'Email:'}</span>
                <a
                  href={`mailto:${GRIEVANCE_OFFICER_INFO.email}`}
                  className="text-emerald-300 font-mono underline hover:text-emerald-200"
                >
                  {GRIEVANCE_OFFICER_INFO.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1 border-t border-emerald-500/10">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="text-slate-400 mr-1.5">{isHindi ? 'कार्यालय पता:' : 'Address:'}</span>
                <span className="text-white">{GRIEVANCE_OFFICER_INFO.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 border-t border-emerald-500/10">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px]">
                <span className="text-slate-400 mr-1.5">{isHindi ? 'निवारण समय सीमा:' : 'Response SLA:'}</span>
                <span className="text-emerald-300 font-semibold">
                  {isHindi
                    ? '72 कार्य घंटों के भीतर (DPDP अधिनियम अनिवार्य)'
                    : 'Within 72 working hours (Mandated by DPDP Rules)'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200/90">
            {isHindi ? (
              <span>
                यदि आपकी शिकायत का समाधान संतोषजनक ढंग से नहीं होता है, तो आपको भारत के{' '}
                <strong className="text-white">डेटा प्रोटेक्शन बोर्ड (Data Protection Board of India)</strong> के समक्ष
                अपील करने का वैधानिक अधिकार प्राप्त है।
              </span>
            ) : (
              <span>
                If your grievance is not resolved satisfactorily, you retain the statutory right to escalate and lodge a
                complaint with the{' '}
                <strong className="text-white">Data Protection Board of India</strong> under DPDP Section 13(3).
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
