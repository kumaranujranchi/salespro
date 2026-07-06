import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, AlertCircle, ArrowRight } from 'lucide-react';

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
  { key: 'date', label: 'Inquiry Date', required: false, },
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
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; errors: { row: number; error: string; mobile?: string }[] } | null>(null);

  // Convex Queries
  const projects = useQuery(api.projects.listRunningProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");
  const staff = useQuery(api.profiles.listActiveStaff, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

  // Convex Mutations
  const bulkInsertLeads = useMutation(api.leads.bulkInsertLeads);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setFile(null);
      setPreviewData([]);
      setFileHeaders([]);
      setColumnMapping({});
      setErrors([]);
      setUploadResult(null);
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
          const exactMatch = validHeaders.find(h => h.toLowerCase().trim() === field.label.toLowerCase().trim() || h.toLowerCase().trim() === field.key.toLowerCase());
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

      } catch (error) {
        setErrors(['Failed to parse Excel file.']);
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
        'Customer Name': 'Rahul Sharma', 'Mobile': '9876543210', 'Email': 'rahul@example.com', 'City': 'Mumbai',
        'Project': 'Sunrise Apartments', 'Sales Executive Email': 'sales@example.com', 'Budget': '50L-1Cr',
        'Purpose': 'Investment', 'Status': 'New', 'Source': 'Walk-in', 'Score': 'Warm', 'Date': '2023-12-01', 'Remarks': 'Interested'
      }];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Lead_Import_Template.xlsx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch (err) { alert("Download failed"); }
  };

  const processUpload = async () => {
    if (!profile || previewData.length === 0) return;
    if (!columnMapping['mobile']) {
      setErrors(['Please map the "Mobile Number" column before proceeding.']);
      return;
    }

    setStep('processing');

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
          projectId = projects.find(p => p.name.toLowerCase() === String(projectName).toLowerCase())?._id || null;
        }

        let salesExecutiveId = profile.id as Id<"profiles">;
        if (executiveEmail && staff) {
          salesExecutiveId = staff.find(s => s.email.toLowerCase() === String(executiveEmail).toLowerCase().trim())?._id || salesExecutiveId;
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

      const result = await bulkInsertLeads({
        tenant_id: profile.tenant_id as Id<"tenants">,
        leads: preparedLeads,
        created_by: profile.id as Id<"profiles">
      });

      setUploadResult(result);
      setStep('result');
    } catch (e: any) {
      console.error("Bulk upload fatal error", e);
      setErrors(['Process Interrupted: ' + e.message]);
      setStep('upload');
    }
  };

  const handleClose = () => {
    if (uploadResult && uploadResult.failed === 0) onSuccess();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads" size="lg">
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Flexible Import</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload any Excel format. map your columns next.</li>
                <li>Mobile Number is mandatory.</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-slate-800/50">
              <FileSpreadsheet className="text-gray-400 mb-3" size={40} />
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{file ? file.name : 'Click to upload Excel file'}</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.csv" className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Select File</Button>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800">
              <Button variant="secondary" onClick={downloadTemplate} className="w-full"><Download size={16} className="mr-2" /> Download Sample</Button>
            </div>
          </div>
          {errors.length > 0 && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{errors[0]}</div>}
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Map Your Columns</h3>
            <span className="text-xs text-gray-500">Matches found: {Object.keys(columnMapping).length} / {CRM_FIELDS.length}</span>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-[50vh]">
            <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 grid grid-cols-12 gap-4 font-medium text-xs uppercase text-gray-500">
              <div className="col-span-5">CRM Field</div>
              <div className="col-span-2 flex justify-center"><ArrowRight size={14} /></div>
              <div className="col-span-5">Excel Header</div>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900">
              {CRM_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-12 gap-4 items-center">
                   <div className="col-span-5 text-sm font-medium text-gray-700 dark:text-gray-200">{field.label}{field.required && '*'}</div>
                   <div className="col-span-2 flex justify-center text-gray-300"><ArrowRight size={16} /></div>
                   <div className="col-span-5">
                     <select
                       className="w-full text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                       value={columnMapping[field.key] || ''}
                       onChange={(e) => handleMappingChange(field.key, e.target.value)}
                     >
                       <option value="">-- Ignore --</option>
                       {fileHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                     </select>
                   </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-4">
             <Button variant="ghost" onClick={() => setStep('upload')}>Back</Button>
             <Button variant="primary" onClick={processUpload}>Import Leads</Button>
          </div>
          {errors.length > 0 && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{errors[0]}</div>}
        </div>
      )}

      {step === 'processing' && (
         <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Importing Leads...</h3>
            <p className="text-gray-500 text-sm">Please wait while we process your records.</p>
         </div>
      )}

      {step === 'result' && uploadResult && (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{uploadResult.success}</div>
                <div className="text-green-800 dark:text-green-200 text-sm">Successfully Uploaded</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600">{uploadResult.failed}</div>
                <div className="text-red-800 dark:text-red-200 text-sm">Failed</div>
              </div>
            </div>
            {uploadResult.failed > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs dark:bg-slate-700 uppercase">
                    <tr><th className="px-4 py-2">Row</th><th className="px-4 py-2">Mobile</th><th className="px-4 py-2">Error</th></tr>
                  </thead>
                  <tbody>
                    {uploadResult.errors.map((err, idx) => (
                      <tr key={idx} className="border-t dark:border-gray-700 dark:bg-slate-800">
                        <td className="px-4 py-2">{err.row}</td>
                        <td className="px-4 py-2">{err.mobile}</td>
                        <td className="px-4 py-2 text-red-500">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end pt-4 gap-2">
                <Button variant="ghost" onClick={() => setStep('upload')}>Import More</Button>
                <Button onClick={handleClose} variant="primary">Done</Button>
            </div>
        </div>
      )}
    </Modal>
  );
}
