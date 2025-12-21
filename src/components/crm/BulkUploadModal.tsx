import { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
  { key: 'source', label: 'Lead Source', required: false, type: 'select', options: ['Ads', 'Walk-in', 'Reference', 'Channel Partner'] },
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
  
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; errors: { row: number; error: string; mobile?: string }[] } | null>(null);

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
        
        // get raw array first to extract headers clearly
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        if (rawData.length === 0) {
          throw new Error("File appears to be empty.");
        }

        const headers = rawData[0] as string[];
        // Filter out empty headers
        const validHeaders = headers.filter(h => h && typeof h === 'string' && h.trim().length > 0);
        
        // Get data as objects
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        setFileHeaders(validHeaders);
        setPreviewData(jsonData);
        
        // Auto-map columns
        const newMapping: Record<string, string> = {};
        CRM_FIELDS.forEach(field => {
          // Find best match in headers
          const exactMatch = validHeaders.find(h => h.toLowerCase().trim() === field.label.toLowerCase().trim() || h.toLowerCase().trim() === field.key.toLowerCase());
          
          if (exactMatch) {
            newMapping[field.key] = exactMatch;
          } else {
            // Fuzzy match common terms
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
        setErrors(['Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.']);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (crmKey: string, header: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [crmKey]: header
    }));
  };

  const downloadTemplate = () => {
    try {
      const templateData = [
        {
          'Customer Name': 'John Doe',
          'Mobile': '9876543210',
          'Email': 'john@example.com',
          'City': 'Mumbai',
          'Project': 'Sunrise Apartments',
          'Sales Executive Email': 'sales@example.com',
          'Budget': '50L-1Cr',
          'Purpose': 'Investment',
          'Status': 'New',
          'Source': 'Walk-in',
          'Score': 'Warm',
          'Date': '2023-12-01',
          'Remarks': 'Interested in 2BHK'
        }
      ];

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
      console.error("Download failed", err);
      alert("Failed to download template. Please check your browser permissions.");
    }
  };

  const processUpload = async () => {
    if (!profile || previewData.length === 0) return;
    
    // Validate Mandatory Fields
    if (!columnMapping['mobile']) {
      setErrors(['Please map the "Mobile Number" column before proceeding.']);
      return;
    }

    setStep('processing');
    setProgress({ current: 0, total: previewData.length });
    const resultErrors: { row: number; error: string; mobile?: string }[] = [];
    let successCount = 0;

    // 1. Fetch metadata for reference
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('tenant_id', profile.tenant_id);

    // Fetch Executives for mapping
    const { data: executives } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('role', ['sales_executive', 'team_leader', 'admin'])
      .eq('tenant_id', profile.tenant_id);

    try {
      for (let i = 0; i < previewData.length; i++) {
        const row: any = previewData[i];
        const rowNum = i + 2;

        try {
          // Extract data using mapping
          const getValue = (key: string) => {
            const header = columnMapping[key];
            if (!header) return undefined;
            return row[header];
          };

          const rawMobile = getValue('mobile');
          if (!rawMobile) {
            throw new Error('Mobile number is missing');
          }
          const mobile = String(rawMobile).trim();
          
          const customerName = getValue('customer_name') || 'Unknown';
          const executiveEmail = getValue('executive_email');
          const projectName = getValue('project');

          // Check Duplicate
          const { data: existing } = await supabase
            .from('leads')
            .select('id, lead_status, metadata')
            .eq('tenant_id', profile.tenant_id)
            .eq('mobile', mobile)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Resolve Sales Executive
          let salesExecutiveId = profile.id; // Default to uploader
          if (executiveEmail) {
            const exec = executives?.find(e => e.email.toLowerCase() === String(executiveEmail).toLowerCase().trim());
            if (exec) {
              salesExecutiveId = exec.id;
            }
          }

          let shouldInsert = true;

          if (existing) {
            if (existing.lead_status === 'Lost') {
              // Reactivate Logic
              const { error: updateError } = await supabase.from('leads').update({
                lead_status: 'New',
                sales_executive_id: salesExecutiveId,
                customer_name: customerName,
                updated_at: new Date().toISOString(),
                updated_by: profile.id,
                metadata: { ...existing.metadata, reactivated_from_bulk: true, reactivated_at: new Date().toISOString() }
              }).eq('id', existing.id);

              if (updateError) throw updateError;
              shouldInsert = false;
              successCount++;
            } else if (existing.lead_status === 'Converted') {
               // Allow Insert
               shouldInsert = true;
            } else {
              // Active Lead: Block
              throw new Error(`Mobile ${mobile} already exists (Status: ${existing.lead_status})`);
            }
          }

          if (shouldInsert) {
            // Generate ID
            const { data: leadId } = await supabase.rpc('generate_lead_id', {
              tenant_uuid: profile.tenant_id
            });
            if (!leadId) throw new Error('Failed to generate Lead ID');

            // Map Project
            let projectId = null;
            if (projectName) {
              const proj = projects?.find(p => p.name.toLowerCase() === String(projectName).toLowerCase());
              if (proj) projectId = proj.id;
            }

            // Enhanced Enum Validation
            const validateEnum = (key: string, allowed: string[], fallback: string | null) => {
              const raw = getValue(key);
              if (!raw) return fallback;
              const valStr = String(raw).trim();
              
              // Case-insensitive match
              const match = allowed.find(a => a.toLowerCase() === valStr.toLowerCase());
              if (match) return match;

              // Partial match / Fuzzy match for common synonyms or typos
              // Only apply if the match is sufficiently long/unique to avoid false positives
              const partialMatch = allowed.find(a => a.toLowerCase().includes(valStr.toLowerCase()) || valStr.toLowerCase().includes(a.toLowerCase()));
              if (partialMatch && partialMatch.length < 30) return partialMatch;

              return fallback;
            };

            const remarks = getValue('remarks');
            const metadataStr = remarks ? { remarks, import_source: 'excel' } : { import_source: 'excel' };
            
            const rawDate = getValue('date');
            const leadDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

            // Validate Status with fallback to 'New' to prevent failures
            const status = validateEnum('status', [
                'New', 'Contacted', 'In Progress', 'Qualified', 'Site Visit Scheduled', 
                'Site Visit Done', 'Lost', 'Disqualified', 'Converted'
            ], 'New');

            const { error: insertError } = await supabase.from('leads').insert({
              tenant_id: profile.tenant_id,
              lead_id: leadId,
              customer_name: customerName,
              mobile: mobile,
              email: getValue('email') || null,
              city: getValue('city') || null,
              project_id: projectId,
              budget_range: validateEnum('budget', ['<50L', '50L-1Cr', '1Cr-2Cr', '>2Cr'], null) as any,
              purpose: validateEnum('purpose', ['Investment', 'End Use'], 'Investment') as any,
              lead_source: validateEnum('source', ['Ads', 'Walk-in', 'Reference', 'Channel Partner'], 'Walk-in') as any,
              lead_status: status as any,
              lead_score: validateEnum('score', ['Hot', 'Warm', 'Cold'], 'Warm') as any,
              lead_date: leadDate,
              created_by: profile.id,
              updated_by: profile.id,
              sales_executive_id: salesExecutiveId,
              metadata: metadataStr
            });

            if (insertError) throw insertError;
            successCount++;
          }
        } catch (err: any) {
          resultErrors.push({
            row: rowNum,
            error: err.message,
            mobile: String(row[columnMapping['mobile'] || ''] || 'Unknown')
          });
        }
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
    } catch (e: any) {
      console.error("Bulk upload fatal error", e);
      resultErrors.push({ row: 0, error: 'Process Interrupted: ' + e.message });
    }

    setUploadResult({
      success: successCount,
      failed: resultErrors.length,
      errors: resultErrors
    });
    setStep('result');
  };

  const reset = () => {
      setStep('upload');
      setFile(null);
      setPreviewData([]);
      setFileHeaders([]);
      setColumnMapping({});
      setErrors([]);
      setUploadResult(null);
  };

  const handleClose = () => {
    if (uploadResult && uploadResult.failed === 0) {
      onSuccess();
    }
    onClose();
  }

  // --- Render Steps ---

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold mb-1">New: Flexible Import</p>
          <ul className="list-disc list-inside space-y-1">
            <li>You can upload <strong>any Excel format</strong>.</li>
            <li>We will help you map your columns to our system in the next step.</li>
            <li><strong>Mobile Number</strong> is the only mandatory field.</li>
            <li>Use the template below if you want a reference format.</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-slate-800/50">
          <FileSpreadsheet className="text-gray-400 mb-3" size={40} />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {file ? file.name : 'Click to upload Excel file'}
          </p>
          <p className="text-xs text-gray-500 mb-4">.xlsx or .csv supported</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.csv"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Select File
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Need a starting point?
          </p>
          <Button variant="secondary" onClick={downloadTemplate} className="w-full">
            <Download size={16} className="mr-2" />
            Download Sample
          </Button>
        </div>
      </div>
      
      {errors.length > 0 && (
         <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{errors[0]}</div>
      )}
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Map Your Columns
        </h3>
        <span className="text-xs text-gray-500">
          Matches found: {Object.keys(columnMapping).length} / {CRM_FIELDS.length}
        </span>
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
               <div className="col-span-5">
                 <div className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                   {field.label}
                   {field.required && <span className="text-red-500 ml-1">*</span>}
                 </div>
                 {field.description && <div className="text-xs text-gray-400 truncate" title={field.description}>{field.description}</div>}
               </div>
               
               <div className="col-span-2 flex justify-center text-gray-300">
                 <ArrowRight size={16} />
               </div>

               <div className="col-span-5">
                 <select
                   className={`w-full text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 focus:ring-blue-500 ${columnMapping[field.key] ? 'text-gray-900 dark:text-white border-blue-300 dark:border-blue-800' : 'text-gray-400'}`}
                   value={columnMapping[field.key] || ''}
                   onChange={(e) => handleMappingChange(field.key, e.target.value)}
                 >
                   <option value="">-- Ignore --</option>
                   {fileHeaders.map((header) => (
                     <option key={header} value={header}>{header}</option>
                   ))}
                 </select>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
         <Button variant="ghost" onClick={reset}>Back to Upload</Button>
         <Button variant="primary" onClick={processUpload}>
            Import Leads
         </Button>
      </div>
      
      {errors.length > 0 && (
         <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{errors[0]}</div>
      )}
    </div>
  );

  const renderResultStep = () => (
    <div className="space-y-4">
        {uploadResult && (
          <>
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
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-800 p-3 font-semibold text-sm border-b border-gray-200 dark:border-gray-700">
                  Failure Details
                </div>
                <div className="max-h-60 overflow-y-auto p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400 sticky top-0">
                      <tr>
                        <th className="px-4 py-2">Row</th>
                        <th className="px-4 py-2">Mobile</th>
                        <th className="px-4 py-2">Error Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.errors.map((err, idx) => (
                        <tr key={idx} className="bg-white border-b dark:bg-slate-800 dark:border-gray-700">
                          <td className="px-4 py-2 font-medium">{err.row}</td>
                          <td className="px-4 py-2 font-mono">{err.mobile || '-'}</td>
                          <td className="px-4 py-2 text-red-600 dark:text-red-400">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 gap-2">
                <Button variant="ghost" onClick={reset}>Import More</Button>
                <Button onClick={handleClose} variant="primary">Done</Button>
            </div>
          </>
        )}
    </div>
  );

  const renderProcessingStep = () => (
     <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Importing Leads...</h3>
        <p className="text-gray-500 text-sm mb-6">Processing {previewData.length} records</p>
        
        <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-1 dark:bg-gray-700">
            <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
        </div>
        <div className="text-xs text-gray-400">
            {progress.current} / {progress.total}
        </div>
     </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads" size="lg">
      {step === 'upload' && renderUploadStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'result' && renderResultStep()}
    </Modal>
  );
}
