import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  FileCheck,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { submitDSRRequest, lookupDSRData, GRIEVANCE_OFFICER_INFO } from '../lib/consentManager';

export function DataSubjectRequestPage() {
  const [activeTab, setActiveTab] = useState<'erasure' | 'access'>('erasure');
  const [identifier, setIdentifier] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('Data Principal requested permanent erasure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erasureResult, setErasureResult] = useState<any | null>(null);
  const [accessResult, setAccessResult] = useState<any | null>(null);

  const handleErasureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErasureResult(null);

    const clean = identifier.trim();
    if (!clean) {
      setError('Please provide your registered mobile number or email address.');
      return;
    }

    if (confirmation.trim() !== 'DELETE') {
      setError('Please type DELETE in capital letters to confirm permanent data erasure.');
      return;
    }

    setLoading(true);
    try {
      const res = await submitDSRRequest({
        identifier: clean,
        requestType: 'erasure',
        confirmation: 'DELETE',
        reason,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to process data erasure request.');
      }

      setErasureResult(res);
      setIdentifier('');
      setConfirmation('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAccessResult(null);

    const clean = identifier.trim();
    if (!clean) {
      setError('Please provide your mobile number or email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await lookupDSRData(clean);
      if (!res.success) {
        throw new Error(res.error || 'Unable to query consent records.');
      }
      setAccessResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to lookup data records.');
    } finally {
      setLoading(false);
    }
  };

  const dsrPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'DPDP Privacy Rights & Data Erasure Portal | RealSalePro',
    description:
      'Exercise your statutory rights under the Indian Digital Personal Data Protection (DPDP) Act, 2023. Self-serve Data Principal Right to Erasure (Section 12) and Right to Access (Section 11).',
    url: 'https://realsalepro.com/data-deletion',
  };

  return (
    <>
      <SEOHead
        title="DPDP Privacy Rights & Data Erasure Portal | RealSalePro"
        description="Self-service privacy portal under India's DPDP Act, 2023. Request permanent erasure of personal data (Section 12) or verify stored consent logs (Section 11)."
        canonicalUrl="https://realsalepro.com/data-deletion"
        keywords="data erasure real estate, dpdp act right to erasure, delete lead data, data subject request india, realsalepro privacy portal"
        jsonLd={dsrPageSchema}
      />

      <div className="min-h-screen bg-[#07130D] text-white py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
        <div className="max-w-4xl mx-auto">
          {/* Header Back Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-emerald-300/80 font-mono bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DPDP Act (India) Compliant</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-10 mb-10">
            <div className="max-w-3xl mb-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                Statutory Data Principal Rights
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Privacy Rights & Data Erasure Portal
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/70 leading-relaxed">
                In accordance with Sections 11 &amp; 12 of the{' '}
                <strong className="text-white">Digital Personal Data Protection (DPDP) Act, 2023 (India)</strong>, you have
                the statutory right to withdraw consent and demand immediate erasure of your personal data from
                RealSalePro and our client developers.
              </p>
            </div>

            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-3 mb-8 bg-black/40 p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('erasure');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'erasure'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trash2 className="w-4 h-4" /> Right to Erasure (Delete Data)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('access');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'access'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" /> Right to Access (Check Consent)
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-white">Request Error</strong>
                  {error}
                </div>
              </div>
            )}

            {/* TAB 1: ERASURE FORM */}
            {activeTab === 'erasure' && (
              <div>
                {erasureResult ? (
                  /* Official Erasure Certificate */
                  <div className="p-6 sm:p-8 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-left space-y-5 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Data Erasure Certificate Generated</h3>
                        <p className="text-xs text-emerald-300 font-mono">
                          Statutory Proof ID: {erasureResult.erasure_proof_id}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-gray-400">Target Identifier:</span>
                        <span className="font-mono text-white">{erasureResult.identifier}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-gray-400">Legal Basis:</span>
                        <span className="text-emerald-300 font-semibold">DPDP Act, 2023 Sec 12 &amp; Sec 6(4)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-gray-400">Leads Anonymized:</span>
                        <span className="font-mono text-white">{erasureResult.erased_leads_count} record(s)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-gray-400">WhatsApp Opt-Out:</span>
                        <span className="text-emerald-300 font-semibold">Active (All messaging halted)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Timestamp (UTC):</span>
                        <span className="font-mono text-white">{new Date(erasureResult.recorded_at).toISOString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Your phone number and name have been anonymized across RealSalePro's databases. You will not receive
                      further automated calls, SMS, or WhatsApp follow-ups. A permanent, tamper-proof record of your erasure
                      request has been written to our 3-year WORM compliance ledger.
                    </p>

                    <button
                      type="button"
                      onClick={() => setErasureResult(null)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                    >
                      Submit another erasure request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleErasureSubmit} className="space-y-5">
                    <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-xl text-xs text-red-200/90 leading-relaxed">
                      <strong>⚠️ Permanent Erasure Action:</strong> This action permanently removes your personal details
                      from active sales pipelines and marketing sequences. If you ever contact us again, you will be
                      treated as a fresh visitor.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                        Registered Mobile Number or Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. +91 98765 43210 or yourname@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-red-500 focus:outline-none text-white text-sm placeholder-gray-500"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Enter the phone number or email you used when making property inquiries or downloading templates.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                        Reason for Erasure (Optional)
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Bought a home, no longer interested in property calls"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-red-500 focus:outline-none text-white text-sm placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-red-300 uppercase tracking-wider mb-1.5">
                        Confirmation: Type "DELETE" to confirm *
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-red-500/40 focus:border-red-500 focus:outline-none text-white text-sm placeholder-gray-600 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Erasing Personal Data...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Permanently Erase My Data &amp; Withdraw Consent
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: ACCESS LOOKUP */}
            {activeTab === 'access' && (
              <div>
                <form onSubmit={handleAccessLookup} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                      Your Mobile Number or Email *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="+91 98765 43210 or yourname@example.com"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm placeholder-gray-500"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Lookup
                      </button>
                    </div>
                  </div>
                </form>

                {accessResult && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h4 className="text-sm font-bold text-white">Privacy Record Status</h4>
                        <p className="text-xs text-gray-400">Identifier: {accessResult.identifier}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          accessResult.is_erased
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : accessResult.has_stored_records
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {accessResult.is_erased
                          ? 'ERASED / WITHDRAWN'
                          : accessResult.has_stored_records
                          ? 'ACTIVE CONSENT RECORD'
                          : 'NO RECORDS FOUND'}
                      </span>
                    </div>

                    {accessResult.consent_history?.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emerald-300">Consent Audit Trail (Immutable WORM Logs):</p>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {accessResult.consent_history.map((log: any) => (
                            <div
                              key={log.id}
                              className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs flex justify-between items-center"
                            >
                              <div>
                                <span className="font-semibold text-white block">{log.action_type}</span>
                                <span className="text-[11px] text-gray-400">{log.purpose}</span>
                              </div>
                              <span className="text-[11px] text-gray-400 font-mono">
                                {new Date(log.created_at).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        No prior consent or marketing records were found for this identifier.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grievance Redressal Officer Disclosure (Mandatory under DPDP Rule 3(2)) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-1">
                  Data Protection &amp; Grievance Redressal Officer
                </h3>
                <p className="text-xs text-emerald-100/70 leading-relaxed mb-3">
                  Under Section 13 of the Digital Personal Data Protection (DPDP) Act, 2023, if you have any unanswered
                  concerns regarding the processing or erasure of your personal data, you may directly contact our
                  designated Grievance Redressal Officer:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 p-4 rounded-xl border border-white/5">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Officer Name:</span>
                    <strong className="text-white">{GRIEVANCE_OFFICER_INFO.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Email Redressal Desk:</span>
                    <a
                      href={`mailto:${GRIEVANCE_OFFICER_INFO.email}`}
                      className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      {GRIEVANCE_OFFICER_INFO.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Resolution SLA:</span>
                    <span className="text-white">Within 72 working hours</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Statutory Escalation:</span>
                    <span className="text-gray-300">Data Protection Board of India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default DataSubjectRequestPage;
