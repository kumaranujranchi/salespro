import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Search, 
  ExternalLink 
} from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'processing' | 'result';

interface FieldMapping {
  key: string;
  label: string;
  required: boolean;
  type?: 'text' | 'select' | 'date';
  options?: string[];
  description?: string;
  defaultValue?: string;
}

interface ImportDetailItem {
  row: number;
  customer_name: string;
  mobile: string;
  status: 'success' | 'failed';
  reason?: string;
  lead_id?: string;
}

interface UploadResult {
  total: number;
  inserted: number;
  failed: number;
  details: ImportDetailItem[];
}

const CRM_FIELDS: FieldMapping[] = [
  { key: 'customer_name', label: 'Customer Name', required: false },
  { key: 'mobile', label: 'Mobile Number', required: true, description: 'Mandatory for unique identification' },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'project', label: 'Project Interest', required: false, description: 'Matches Project Name in CRM' },
  { key: 'executive_email', label: 'Sales Executive Email', required: false, description: 'For assignment. If empty/not found, assigned to you.' },
  { key: 'budget', label: 'Budget', required: false, type: 'select', options: ['<50L', '50L-1Cr', '1Cr-2Cr', '>2Cr'] },
  { key: 'purpose', label: 'Purpose', required: false, type: 'select', options: ['Investment', 'End Use'] },
  { key: 'source', label: 'Lead Source', required: false, type: 'select', options: ['Referral', '99acres', 'MagicBrick', 'Housing', 'Meta', 'Google', 'Walk-in'] },
  { key: 'status', label: 'Lead Status', required: false, type: 'select', options: [
    'New', 'Contacted', 'In Progress', 'Qualified', 'Site Visit Scheduled', 'Site Visit Done', 'Lost', 'Disqualified', 'Converted'
  ] },
  { key: 'score', label: 'Lead Score', required: false, type: 'select', options: ['Hot', 'Warm', 'Cold'] },
  { key: 'date', label: 'Inquiry Date', required: false },
  { key: 'remarks', label: 'Remarks / Notes', required: false },
];

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // CRM Field Key -> File Header
  
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Progress Bar State
  const [progress, setProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('Initializing upload...');

  // Detailed Report Window State (shown only for active session)
  const [showDetailedReport, setShowDetailedReport] = useState<boolean>(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [reportSearch, setReportSearch] = useState<string>('');

  // Backend queries
  const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");
  const staff = useQuery(api.profiles.listActiveStaff, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

  // Backend mutations
  const bulkInsertLeads = useMutation(api.leads.bulkInsertLeads);

  // Reset state when modal opens or closes (guarantees one-time report display per session)
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setFile(null);
      setPreviewData([]);
      setFileHeaders([]);
      setColumnMapping({});
      setErrors([]);
      setUploadResult(null);
      setProgress(0);
      setProgressStatus('');
      setShowDetailedReport(false);
      setReportFilter('all');
      setReportSearch('');
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setUploadResult(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        if (rawData.length === 0) {
          throw new Error("File appears to be empty.");
        }

        const headers = rawData[0] as string[];
        const validHeaders = headers.filter(h => h && typeof h === 'string' && h.trim().length > 0);
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        setFileHeaders(validHeaders);
        setPreviewData(jsonData);
        
        const newMapping: Record<string, string> = {};
        CRM_FIELDS.forEach(field => {
          const exactMatch = validHeaders.find(h => 
            h.toLowerCase().trim() === field.label.toLowerCase().trim() || 
            h.toLowerCase().trim() === field.key.toLowerCase()
          );
          if (exactMatch) {
            newMapping[field.key] = exactMatch;
          } else {
            const fieldTerms = field.label.toLowerCase().split(' ');
            const match = validHeaders.find(h => {
              const headerLower = h.toLowerCase();
              return fieldTerms.some(term => term.length > 2 && headerLower.includes(term));
            });
            if (match) newMapping[field.key] = match;
          }
        });
        
        setColumnMapping(newMapping);
        setStep('mapping');

      } catch (error: any) {
        setErrors([error?.message || 'Failed to parse Excel file.']);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (crmKey: string, header: string) => {
    setColumnMapping(prev => ({ ...prev, [crmKey]: header }));
  };

  const downloadTemplate = () => {
    try {
      const templateData = [{
        'Customer Name': 'Rahul Sharma',
        'Mobile': '9876543210',
        'Email': 'rahul@example.com',
        'City': 'Mumbai',
        'Project': 'Sunrise Apartments',
        'Sales Executive Email': 'sales@example.com',
        'Budget': '50L-1Cr',
        'Purpose': 'Investment',
        'Status': 'New',
        'Source': 'Walk-in',
        'Score': 'Warm',
        'Date': '2026-11-01',
        'Remarks': 'Interested in 2BHK'
      }];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Lead_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed");
    }
  };

  const processUpload = async () => {
    if (!profile || previewData.length === 0) return;
    if (!columnMapping['mobile']) {
      setErrors(['Please map the "Mobile Number" column before proceeding.']);
      return;
    }

    setStep('processing');
    setProgress(15);
    setProgressStatus('Validating spreadsheet rows and mapping fields...');

    try {
      const preparedLeads = previewData.map((row) => {
        const getValue = (key: string) => {
          const header = columnMapping[key];
          return header ? row[header] : undefined;
        };

        const validateEnum = (key: string, allowed: string[], fallback: string) => {
          const raw = getValue(key);
          if (!raw) return fallback;
          const valStr = String(raw).trim().toLowerCase();
          const match = allowed.find(a => a.toLowerCase() === valStr);
          return match || fallback;
        };

        const mobile = String(getValue('mobile') || '').trim();
        const projectName = getValue('project');
        const executiveEmail = getValue('executive_email');

        let projectId = null;
        if (projectName && projects) {
          projectId = projects.find((p: any) => p.name.toLowerCase() === String(projectName).toLowerCase())?._id || null;
        }

        let salesExecutiveId = profile.id as Id<"profiles">;
        if (executiveEmail && staff) {
          salesExecutiveId = staff.find((s: any) => s.email.toLowerCase() === String(executiveEmail).toLowerCase().trim())?._id || salesExecutiveId;
        }

        return {
          customer_name: String(getValue('customer_name') || 'Unknown'),
          mobile,
          email: getValue('email') ? String(getValue('email')) : null,
          city: getValue('city') ? String(getValue('city')) : null,
          project_id: projectId as Id<"projects"> | null,
          budget_range: validateEnum('budget', ['<50L', '50L-1Cr', '1Cr-2Cr', '>2Cr'], '<50L'),
          purpose: validateEnum('purpose', ['Investment', 'End Use'], 'Investment'),
          lead_source: validateEnum('source', ['Referral', '99acres', 'MagicBrick', 'Housing', 'Meta', 'Google', 'Walk-in'], 'Walk-in'),
          lead_status: validateEnum('status', ['New', 'Contacted', 'In Progress', 'Qualified', 'Site Visit Scheduled', 'Site Visit Done', 'Lost', 'Disqualified', 'Converted'], 'New'),
          lead_score: validateEnum('score', ['Hot', 'Warm', 'Cold'], 'Warm'),
          lead_date: getValue('date') ? new Date(getValue('date')).toISOString() : new Date().toISOString(),
          sales_executive_id: salesExecutiveId,
          internal_notes: getValue('remarks') ? String(getValue('remarks')) : null,
        };
      });

      setProgress(40);
      setProgressStatus('Checking for duplicates and inserting leads into database...');

      const result: any = await bulkInsertLeads({
        tenant_id: profile.tenant_id as Id<"tenants">,
        leads: preparedLeads,
        created_by: profile.id as Id<"profiles">
      });

      setProgress(90);
      setProgressStatus('Generating verification report...');

      // Standardize result format
      const normalizedResult: UploadResult = {
        total: result?.total ?? preparedLeads.length,
        inserted: result?.inserted ?? result?.success ?? 0,
        failed: result?.failed ?? (result?.errors ? result.errors.length : 0),
        details: Array.isArray(result?.details) ? result.details : (
          (result?.errors || []).map((err: any) => ({
            row: err.row || 0,
            customer_name: err.customer_name || 'Customer',
            mobile: err.mobile || 'N/A',
            status: 'failed' as const,
            reason: err.error || err.reason || 'Failed to insert'
          }))
        )
      };

      setProgress(100);
      setProgressStatus('Upload complete!');

      setTimeout(() => {
        setUploadResult(normalizedResult);
        setStep('result');
      }, 400);

    } catch (e: any) {
      console.error("Bulk upload fatal error", e);
      setErrors(['Process Interrupted: ' + (e.message || 'Unknown error occurred')]);
      setStep('upload');
    }
  };

  const handleClose = () => {
    // If any lead was uploaded successfully, trigger parent refresh
    if (uploadResult && uploadResult.inserted > 0) {
      onSuccess();
    }
    // Dismiss active session report
    setUploadResult(null);
    setShowDetailedReport(false);
    onClose();
  };

  // Export failed rows as Excel
  const downloadFailedRowsExcel = () => {
    if (!uploadResult) return;
    const failedItems = uploadResult.details.filter(d => d.status === 'failed');
    if (failedItems.length === 0) return;

    const exportRows = failedItems.map(item => ({
      'Row Number': item.row,
      'Customer Name': item.customer_name,
      'Mobile Number': item.mobile,
      'Failure Reason': item.reason || 'Unspecified error',
      'Recommended Action': item.reason?.toLowerCase().includes('duplicate') 
        ? 'Duplicate lead in CRM or file. Check existing leads or update contact info.' 
        : item.reason?.toLowerCase().includes('invalid') 
          ? 'Provide a valid 10-digit mobile number and re-upload.'
          : 'Check row values and retry import.'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed_Leads');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Failed_Leads_Report_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export full audit report
  const downloadFullAuditExcel = () => {
    if (!uploadResult) return;
    const exportRows = uploadResult.details.map(item => ({
      'Row Number': item.row,
      'Customer Name': item.customer_name,
      'Mobile Number': item.mobile,
      'Upload Status': item.status === 'success' ? 'UPLOADED' : 'FAILED',
      'Lead ID': item.lead_id || '-',
      'Reason / Note': item.reason || 'Uploaded successfully'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Full_Import_Audit');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Full_Lead_Import_Audit_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filtered list for detailed report window
  const filteredDetails = useMemo(() => {
    if (!uploadResult) return [];
    return uploadResult.details.filter(item => {
      if (reportFilter === 'success' && item.status !== 'success') return false;
      if (reportFilter === 'failed' && item.status !== 'failed') return false;
      if (reportSearch.trim()) {
        const query = reportSearch.toLowerCase().trim();
        const matchesName = (item.customer_name || '').toLowerCase().includes(query);
        const matchesMobile = (item.mobile || '').toLowerCase().includes(query);
        const matchesReason = (item.reason || '').toLowerCase().includes(query);
        return matchesName || matchesMobile || matchesReason;
      }
      return true;
    });
  }, [uploadResult, reportFilter, reportSearch]);

  return (
    <>
      <Modal isOpen={isOpen && !showDetailedReport} onClose={handleClose} title="Import Leads" size="lg">
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Flexible Excel / CSV Import</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload any Excel format; map your columns in the next step.</li>
                  <li><strong>Mobile Number is mandatory</strong> (must be at least 10 digits).</li>
                  <li>Duplicates are automatically identified to protect existing CRM records.</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors bg-gray-50 dark:bg-slate-800/50">
                <FileSpreadsheet className="text-gray-400 mb-3" size={40} />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {file ? file.name : 'Click to upload Excel file'}
                </p>
                <p className="text-xs text-gray-500 mb-4">Supported formats: .xlsx, .csv</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx,.csv" 
                  className="hidden" 
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                  <Download className="text-slate-600 dark:text-slate-300" size={20} />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Need a template?</h4>
                <p className="text-xs text-gray-500 mb-4">Download our pre-formatted sample Excel file with all columns ready.</p>
                <Button variant="secondary" onClick={downloadTemplate} className="w-full">
                  <Download size={16} className="mr-2" /> Download Sample
                </Button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                {errors[0]}
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Map Your Columns</h3>
                <p className="text-xs text-gray-500">Confirm which column in your file matches each CRM field.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                Matched: {Object.keys(columnMapping).length} / {CRM_FIELDS.length}
              </span>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-[50vh]">
              <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 grid grid-cols-12 gap-4 font-semibold text-xs uppercase text-gray-500 tracking-wider">
                <div className="col-span-5">CRM Field</div>
                <div className="col-span-2 flex justify-center"><ArrowRight size={14} /></div>
                <div className="col-span-5">Excel Column Header</div>
              </div>
              <div className="overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900">
                {CRM_FIELDS.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5 text-sm font-medium text-gray-700 dark:text-gray-200">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                    </div>
                    <div className="col-span-2 flex justify-center text-gray-300">
                      <ArrowRight size={16} />
                    </div>
                    <div className="col-span-5">
                      <select
                        className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      >
                        <option value="">-- Ignore --</option>
                        {fileHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="ghost" onClick={() => setStep('upload')}>Back</Button>
              <Button variant="primary" onClick={processUpload}>
                Start Lead Import ({previewData.length} records)
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                {errors[0]}
              </div>
            )}
          </div>
        )}

        {/* Progress Bar View */}
        {step === 'processing' && (
          <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 relative flex items-center justify-center mb-6">
              <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/40 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Uploading & Processing Leads...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              {progressStatus}
            </p>

            {/* Visual Animated Progress Bar */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>Progress</span>
                <span className="text-emerald-600 dark:text-emerald-400">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-gray-600">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right">
                Total records: {previewData.length}
              </p>
            </div>
          </div>
        )}

        {/* Result Screen */}
        {step === 'result' && uploadResult && (
          <div className="space-y-6">
            {/* Header Status */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              uploadResult.failed === 0 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              {uploadResult.failed === 0 ? (
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-base">
                  {uploadResult.failed === 0 
                    ? 'All leads uploaded successfully!' 
                    : `Upload finished: ${uploadResult.inserted} uploaded, ${uploadResult.failed} failed/skipped`}
                </h4>
                <p className="text-xs opacity-90">
                  {uploadResult.failed === 0
                    ? `Successfully imported all ${uploadResult.inserted} leads into your CRM database.`
                    : 'Some leads could not be imported due to duplicate mobile numbers or invalid data.'}
                </p>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{uploadResult.total}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Total Leads in File</div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{uploadResult.inserted}</div>
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mt-1">Successfully Uploaded</div>
              </div>
              <div className={`p-4 border rounded-xl text-center ${
                uploadResult.failed > 0
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div className={`text-2xl font-bold ${
                  uploadResult.failed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}>
                  {uploadResult.failed}
                </div>
                <div className={`text-xs font-medium mt-1 ${
                  uploadResult.failed > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-slate-500'
                }`}>
                  Failed / Skipped
                </div>
              </div>
            </div>

            {/* Failure Breakdown Preview */}
            {uploadResult.failed > 0 && (
              <div className="border border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-rose-50 dark:bg-rose-900/30 px-4 py-2.5 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider flex items-center gap-2">
                    <XCircle size={14} /> Failed Rows Preview ({uploadResult.failed})
                  </span>
                  <button
                    onClick={downloadFailedRowsExcel}
                    className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1"
                  >
                    <Download size={13} /> Export Failed Rows (Excel)
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Mobile</th>
                        <th className="px-3 py-2">Reason for Failure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {uploadResult.details.filter(d => d.status === 'failed').slice(0, 5).map((err, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 font-mono text-gray-500">{err.row}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{err.customer_name}</td>
                          <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-300">{err.mobile}</td>
                          <td className="px-3 py-2 text-rose-600 dark:text-rose-400">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {uploadResult.failed > 5 && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/60 text-xs text-gray-500 text-center border-t dark:border-gray-800">
                    Showing top 5 of {uploadResult.failed} failed records. Click "See Detailed Report" below for full breakdown.
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDetailedReport(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-600"
              >
                <FileText size={16} /> See Detailed Report
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setPreviewData([]);
                    setUploadResult(null);
                  }}
                >
                  Upload More
                </Button>
                <Button 
                  onClick={handleClose} 
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dedicated Full Detailed Report Window / Modal (One-time active session display) */}
      {showDetailedReport && uploadResult && (
        <Modal 
          isOpen={showDetailedReport} 
          onClose={() => setShowDetailedReport(false)} 
          title="Lead Import Audit Report" 
          size="xl"
        >
          <div className="space-y-4">
            {/* Report Header Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Audit Report for: {file?.name || 'Uploaded File'}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total Records: <span className="font-semibold">{uploadResult.total}</span> | 
                  Uploaded: <span className="text-emerald-600 font-semibold">{uploadResult.inserted}</span> | 
                  Failed: <span className="text-rose-600 font-semibold">{uploadResult.failed}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {uploadResult.failed > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadFailedRowsExcel}
                    className="text-xs flex items-center gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                  >
                    <Download size={14} /> Export Failed Rows
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={downloadFullAuditExcel}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Download size={14} /> Export Full Audit (.xlsx)
                </Button>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Tab Filters */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => setReportFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    reportFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  All ({uploadResult.total})
                </button>
                <button
                  onClick={() => setReportFilter('success')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    reportFilter === 'success'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  Uploaded ({uploadResult.inserted})
                </button>
                <button
                  onClick={() => setReportFilter('failed')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    reportFilter === 'failed'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-700 dark:text-rose-400 hover:text-rose-800'
                  }`}
                >
                  Failed ({uploadResult.failed})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, mobile or reason..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 uppercase tracking-wider font-semibold sticky top-0 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-2.5 w-16 text-center">Row</th>
                    <th className="px-3 py-2.5">Customer Name</th>
                    <th className="px-3 py-2.5">Mobile</th>
                    <th className="px-3 py-2.5 w-28">Status</th>
                    <th className="px-3 py-2.5">Details / Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-slate-900">
                  {filteredDetails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDetails.map((item, idx) => (
                      <tr 
                        key={idx}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${
                          item.status === 'failed' ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center font-mono text-gray-500">
                          {item.row}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                          {item.customer_name}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-300">
                          {item.mobile}
                        </td>
                        <td className="px-3 py-2.5">
                          {item.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 size={12} /> Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                              <XCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                          {item.status === 'success' ? (
                            <span className="text-gray-500 dark:text-gray-400">
                              Lead created successfully {item.lead_id && `(${item.lead_id})`}
                            </span>
                          ) : (
                            <div>
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {item.reason}
                              </span>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.reason?.toLowerCase().includes('duplicate') ? (
                                  'Action: Mobile already exists. Merge note or verify the contact.'
                                ) : item.reason?.toLowerCase().includes('invalid') ? (
                                  'Action: Needs a 10-digit valid phone number.'
                                ) : (
                                  'Action: Check row formatting and retry.'
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500">
                This report is available for this active session only.
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDetailedReport(false)}
                >
                  Back to Summary
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Done & Refresh Leads
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
