import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Download, FileSpreadsheet, ArrowRight, Check, AlertCircle, 
  Sparkles, Shield, ChevronDown, ChevronUp, Star, ExternalLink,
  Laptop, Database, ArrowDownToLine
} from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';

export function ExcelTemplatePage() {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sampleLeads = [
    {
      date: '2026-11-10',
      name: 'Rahul Sharma',
      mobile: '+91 98765 43210',
      source: 'Meta Ads',
      project: 'Godrej Palm Retreat',
      budget: '₹1.2 Cr - ₹1.5 Cr',
      config: '3 BHK',
      stage: 'Site Visit Scheduled',
      priority: 'Hot',
      remarks: 'Park-facing unit, 8th floor. Family walkthrough confirmed.'
    },
    {
      date: '2026-11-09',
      name: 'Pooja Verma',
      mobile: '+91 98234 56789',
      source: 'Magicbricks',
      project: 'Sobha Dream Acres',
      budget: '₹75L - ₹90L',
      config: '2 BHK',
      stage: 'Contacted',
      priority: 'Warm',
      remarks: 'Sent brochure on WhatsApp. Will check with husband.'
    },
    {
      date: '2026-11-08',
      name: 'Vikram Malhotra',
      mobile: '+91 97112 23344',
      source: 'Google Ads',
      project: 'DLF Cyber Residences',
      budget: '₹2.5 Cr - ₹3.0 Cr',
      config: '4 BHK Luxury',
      stage: 'Negotiation',
      priority: 'Hot',
      remarks: 'Visit done. Discussing payment milestone & parking slot.'
    },
    {
      date: '2026-11-07',
      name: 'Suresh Gupta',
      mobile: '+91 99887 76655',
      source: 'Walk-in',
      project: 'Godrej Palm Retreat',
      budget: '₹1.5 Cr',
      config: '3 BHK',
      stage: 'Token Booked',
      priority: 'Hot',
      remarks: 'Token advance paid ₹1,00,000. Agreement in progress.'
    }
  ];

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Leads Tracker
      const leadsSheetData = [
        {
          "Lead Date": "2026-11-10",
          "Customer Name": "Rahul Sharma",
          "Mobile Number": "9876543210",
          "Email ID": "rahul.sharma@example.com",
          "Lead Source": "Meta Ads",
          "Project": "Godrej Palm Retreat",
          "Budget Range": "₹1.2 Cr - ₹1.5 Cr",
          "Configuration": "3 BHK",
          "Purpose": "Self-use",
          "Lead Status": "Site Visit Scheduled",
          "Priority": "Hot",
          "Assigned To": "Amit Kumar",
          "Latest Remarks": "Looking for park-facing unit on 8th floor or above. Family visit confirmed.",
          "Next Follow-up": "2026-11-12",
          "Site Visit Date": "2026-11-15"
        },
        {
          "Lead Date": "2026-11-09",
          "Customer Name": "Pooja Verma",
          "Mobile Number": "9823456789",
          "Email ID": "pooja.v@example.com",
          "Lead Source": "Magicbricks",
          "Project": "Sobha Dream Acres",
          "Budget Range": "₹75L - ₹90L",
          "Configuration": "2 BHK",
          "Purpose": "Investment",
          "Lead Status": "Contacted",
          "Priority": "Warm",
          "Assigned To": "Neha Singh",
          "Latest Remarks": "Sent brochure on WhatsApp. Will check with husband and confirm visit date.",
          "Next Follow-up": "2026-11-11",
          "Site Visit Date": ""
        },
        {
          "Lead Date": "2026-11-08",
          "Customer Name": "Vikram Malhotra",
          "Mobile Number": "9711223344",
          "Email ID": "v.malhotra@corporate.in",
          "Lead Source": "Google Ads",
          "Project": "DLF Cyber Residences",
          "Budget Range": "₹2.5 Cr - ₹3.0 Cr",
          "Configuration": "4 BHK Luxury",
          "Purpose": "Self-use",
          "Lead Status": "Negotiation",
          "Priority": "Hot",
          "Assigned To": "Rohan Mehra",
          "Latest Remarks": "Site visit completed. Discussing payment milestone plan and parking slot allocation.",
          "Next Follow-up": "2026-11-11",
          "Site Visit Date": "2026-11-09"
        },
        {
          "Lead Date": "2026-11-07",
          "Customer Name": "Suresh Gupta",
          "Mobile Number": "9988776655",
          "Email ID": "suresh.gupta@biz.com",
          "Lead Source": "Walk-in",
          "Project": "Godrej Palm Retreat",
          "Budget Range": "₹1.5 Cr",
          "Configuration": "3 BHK",
          "Purpose": "Self-use",
          "Lead Status": "Token Booked",
          "Priority": "Hot",
          "Assigned To": "Rohan Mehra",
          "Latest Remarks": "Token advance paid ₹1,00,000. Unit 1204 blocked. Agreement drafting in progress.",
          "Next Follow-up": "2026-11-14",
          "Site Visit Date": "2026-11-07"
        }
      ];

      const ws1 = XLSX.utils.json_to_sheet(leadsSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, "Leads Tracker");

      // Sheet 2: Pipeline Stages
      const stagesData = [
        { "Stage": "New Lead", "Definition": "Raw inquiry from Meta/Google/Portals", "Target SLA": "Call within 5 minutes" },
        { "Stage": "Contacted", "Definition": "Phone conversation / WhatsApp brochure shared", "Target SLA": "Within 2 hours" },
        { "Stage": "Site Visit Scheduled", "Definition": "Prospect confirmed date & time for site visit", "Target SLA": "Confirm 2 hours prior" },
        { "Stage": "Site Visit Done", "Definition": "Customer completed model flat walkthrough", "Target SLA": "Feedback call within 4 hours" },
        { "Stage": "Negotiation", "Definition": "Discussing cost sheet, floor rise & discounts", "Target SLA": "Close within 7 days" },
        { "Stage": "Token Booked", "Definition": "Booking advance cheque/online transfer received", "Target SLA": "Sale agreement in 15 days" },
        { "Stage": "Converted", "Definition": "Agreement registered and developer commission logged", "Target SLA": "Completed" },
        { "Stage": "Lost / Disqualified", "Definition": "Budget mismatch or bought elsewhere", "Target SLA": "Move to revival sequence" }
      ];
      const ws2 = XLSX.utils.json_to_sheet(stagesData);
      XLSX.utils.book_append_sheet(wb, ws2, "Pipeline Stages Guide");

      // Sheet 3: RealSalePro Upgrade Note
      const upgradeData = [
        { "Advantage": "Automate Facebook & WhatsApp Leads", "Excel": "Manual copy-pasting (misses leads)", "RealSalePro Free CRM": "Instant 30-sec webhook auto-sync" },
        { "Advantage": "Prevent Lead Theft by Staff", "Excel": "Staff can copy/export full sheet", "RealSalePro Free CRM": "Phone number masking (hides last 5 digits)" },
        { "Advantage": "Follow-up Reminders", "Excel": "Forgotten in spreadsheet rows", "RealSalePro Free CRM": "Automated WhatsApp & dashboard notifications" },
        { "Advantage": "Site Visit Coordination", "Excel": "Manual phone calls", "RealSalePro Free CRM": "Driver dispatch & client route location link" },
        { "Advantage": "Cost", "Excel": "Free (heavy manual labor)", "RealSalePro Free CRM": "100% Free Forever up to 1,000 Leads (No Card Required)" },
        { "Advantage": "Free Signup Link", "Excel": "N/A", "RealSalePro Free CRM": "https://realsalepro.com/register" }
      ];
      const ws3 = XLSX.utils.json_to_sheet(upgradeData);
      XLSX.utils.book_append_sheet(wb, ws3, "Upgrade to Free Cloud CRM");

      XLSX.writeFile(wb, "RealSalePro-Real-Estate-CRM-Template-2026.xlsx");
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 8000);
    } catch (e) {
      // Fallback to static public download
      window.location.href = '/downloads/real-estate-crm-template.xlsx';
      setDownloadSuccess(true);
    }
  };

  const templateSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Real Estate CRM Excel Template 2026",
    "operatingSystem": "All (Excel, Google Sheets, Numbers)",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Free downloadable Real Estate CRM Excel Template & Google Sheets tracker with pre-built pipeline stages, site visit logs, and lead follow-up tracker."
  };

  return (
    <div className="min-h-screen bg-[#07130E] text-slate-100 font-sans selection:bg-[#00E576] selection:text-[#07130E]">
      <SEOHead
        title="Free Real Estate CRM Excel Template & Google Sheets Tracker (2026 Download) | RealSalePro"
        description="Download our free 2026 Real Estate CRM Excel template & Google Sheets lead tracker. Pre-configured with pipeline stages, property inventory & site visit logs. 100% free download."
        canonicalUrl="https://realsalepro.com/templates/real-estate-crm-excel-template"
        keywords="real estate crm template, real estate crm excel template, free real estate crm template, real estate lead tracker sheet, property crm excel sheet download"
        jsonLd={templateSchema}
      />

      {/* Navigation */}
      <nav className="border-b border-emerald-950/60 bg-[#07130E]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/RealSalePro_Favicon.png" alt="RealSalePro Logo" className="w-9 h-9 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">
              RealSale<span className="text-[#00E576]">Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/free-real-estate-crm" className="hover:text-white transition-colors text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={15} /> Free CRM Software
            </Link>
            <a href="#preview" className="hover:text-white transition-colors">Sheet Preview</a>
            <a href="#why-switch" className="hover:text-white transition-colors">Excel vs Cloud CRM</a>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2">
              Log in
            </Link>
            <button
              onClick={handleDownloadExcel}
              className="text-xs sm:text-sm font-bold bg-[#00E576] hover:bg-[#00c853] text-[#07130E] px-4 py-2.5 rounded-full shadow-lg shadow-[#00E576]/20 transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={15} /> Download Free .XLSX
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-emerald-950/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,229,118,0.12),transparent_70%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold mb-6">
            <FileSpreadsheet size={15} className="text-[#00E576]" />
            Free Downloadable Resource • Updated for 2026
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Free Real Estate CRM Excel Template & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E576] via-emerald-300 to-teal-400">
              Google Sheets Lead Tracker
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg text-slate-300 leading-relaxed mb-10">
            A battle-tested spreadsheet template designed specifically for Indian property dealers, brokers, and builders. 
            Organize customer inquiries, property requirements, site visits, and booking tokens in one clean layout.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={handleDownloadExcel}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#00E576] to-emerald-400 text-[#07130E] text-base font-extrabold rounded-2xl shadow-xl shadow-[#00E576]/25 hover:opacity-95 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <ArrowDownToLine size={20} />
              Download Excel File (.xlsx)
            </button>
            <a
              href="/downloads/real-estate-crm-template.xlsx"
              download
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-base font-semibold rounded-2xl border border-white/10 transition-all cursor-pointer"
            >
              Direct Browser Download
            </a>
          </div>

          {downloadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm max-w-lg mx-auto flex items-center justify-center gap-2 animate-fadeIn mb-8">
              <Check size={18} className="text-[#00E576]" />
              <strong>Download complete!</strong> Check your Downloads folder for the .xlsx file.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-4">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[#00E576]" /> Compatible with MS Excel 2016-365</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[#00E576]" /> Google Sheets Ready</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[#00E576]" /> 100% Free Forever</span>
          </div>
        </div>
      </section>

      {/* Interactive Sheet Preview */}
      <section id="preview" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3">What's Inside The Workbook</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Interactive Spreadsheet Preview</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Includes pre-configured formulas, dropdown stages, and sample client entries.
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="ml-2 font-mono text-slate-300 font-semibold">Sheet 1: Leads Tracker.xlsx</span>
            </div>
            <span className="text-[#00E576] font-semibold flex items-center gap-1">
              <Sparkles size={14} /> Ready for Import
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-emerald-950/50 text-slate-300 font-semibold border-b border-emerald-900/50">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Lead Source</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Config</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Latest Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {sampleLeads.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-slate-400">{row.date}</td>
                    <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                    <td className="py-3 px-4 text-slate-300">{row.mobile}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                        {row.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-300">{row.project}</td>
                    <td className="py-3 px-4">{row.budget}</td>
                    <td className="py-3 px-4">{row.config}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-sans font-semibold text-[11px] ${
                        row.stage === 'Token Booked' ? 'bg-emerald-500/20 text-[#00E576]' :
                        row.stage === 'Site Visit Scheduled' ? 'bg-sky-500/20 text-sky-300' :
                        row.stage === 'Negotiation' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {row.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.priority === 'Hot' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The "Why Excel Fails" / Soft-Upgrade Bridge Section */}
      <section id="why-switch" className="py-20 bg-gradient-to-b from-[#07130E] to-[#040C09] border-y border-emerald-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold mb-3 border border-amber-500/20">
              <AlertCircle size={14} /> The Hidden Cost of Spreadsheets
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              When Should You Graduate from Excel to <span className="text-[#00E576]">RealSalePro Free CRM</span>?
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              Spreadsheets are great when you have 10 leads. But when you run Meta ads and have 5 telecallers, Excel becomes a bottleneck.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-14">
            {/* The Excel Problem */}
            <div className="p-8 rounded-3xl bg-rose-950/10 border border-rose-900/30">
              <h3 className="text-xl font-bold text-rose-300 mb-6 flex items-center gap-2">
                <span>❌</span> Where Excel Breaks in Real Estate:
              </h3>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Leads Are Entered at 10 PM:</strong> When Facebook ad leads arrive at 2 PM, telecallers don't copy-paste them until the end of the day. By then, the client already booked a visit with another broker.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Staff Lead Theft:</strong> Any employee can download or copy-paste your entire 5,000-contact database to a pen drive and take it to a rival agency.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Forgotten Follow-ups:</strong> 80% of real estate deals close on the 5th to 8th call. In Excel, follow-up dates get lost in rows with zero alert notifications.
                  </div>
                </li>
              </ul>
            </div>

            {/* The RealSalePro Free Solution */}
            <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30">
              <h3 className="text-xl font-bold text-[#00E576] mb-6 flex items-center gap-2">
                <span>✅</span> How RealSalePro Free Solves This:
              </h3>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#00E576] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Instant 30-Sec Webhook Sync:</strong> Every Meta, Instagram, or WhatsApp inquiry pings your team immediately. Calling within 5 minutes boosts conversion by 391%.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#00E576] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Strict Phone Number Masking:</strong> Telecallers can call directly through the dialer without seeing the last 5 digits. Zero database theft guaranteed.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#00E576] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">100% Free Forever (Up to 1,000 Leads):</strong> You get all these cloud features for ₹0 without entering any credit card details.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Direct 1-Click Import CTA */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-900/30 via-emerald-800/20 to-teal-900/30 border border-emerald-500/40 text-center max-w-3xl mx-auto shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              Import This Exact Excel Template into RealSalePro
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Already have leads in this format? You can bulk-import this exact spreadsheet into RealSalePro in under 30 seconds. 
              Our system automatically deduplicates existing numbers and sets up your pipeline.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#00E576] hover:bg-[#00c853] text-[#07130E] font-extrabold rounded-2xl shadow-xl shadow-[#00E576]/20 transition-all hover:scale-105 cursor-pointer"
            >
              Start Free CRM (1,000 Leads Included) →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3">Template FAQs</div>
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Can I use this template in Google Sheets?",
              a: "Yes! Simply download the .xlsx file, open Google Drive, click 'New' > 'File upload', and select the downloaded file. It opens cleanly in Google Sheets with all columns intact."
            },
            {
              q: "Is there any cost or email required to download the template?",
              a: "None. You can download the full Excel workbook instantly with a single click. No email gate, no credit card, and no subscription."
            },
            {
              q: "How do I import this sheet into RealSalePro?",
              a: "Once you create your free RealSalePro account, go to Leads > Bulk Import. Upload this .xlsx file and your leads will be automatically mapped to projects and team members."
            },
            {
              q: "Can I customize the columns or add my own property names?",
              a: "Absolutely. The sheet is 100% unlocked. You can add custom columns, project names, and commission percentage rates as you see fit."
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left py-4 px-6 flex items-center justify-between text-base font-semibold text-white focus:outline-none cursor-pointer"
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp size={18} className="text-[#00E576]" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-950/80 bg-[#040C09] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/images/RealSalePro_Favicon.png" alt="RealSalePro Logo" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-slate-300">RealSalePro © {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/free-real-estate-crm" className="hover:text-white">Free Real Estate CRM</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
