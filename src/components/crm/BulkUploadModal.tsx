import { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; errors: { row: number; error: string; mobile?: string }[] } | null>(null);

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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setPreviewData(jsonData);
      } catch (error) {
        setErrors(['Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.']);
      }
    };
    reader.readAsBinaryString(file);
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
          'Executive Email': 'sales@example.com', // Mandatory for assignment
          'Budget': '50L-1Cr',
          'Purpose': 'Investment',
          'Status': 'New',
          'Source': 'Walk-in',
          'Score': 'Warm',
          'Date': '2023-12-01'
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

    setUploading(true);
    setProgress({ current: 0, total: previewData.length });
    const resultErrors: { row: number; error: string; mobile?: string }[] = [];
    let successCount = 0;

    // 1. Fetch metadata for mapping
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

    for (let i = 0; i < previewData.length; i++) {
      const row: any = previewData[i];
      const rowNum = i + 2;

      try {
        if (!row['Mobile']) {
          throw new Error('Mobile number is missing');
        }
        const customerName = row['Customer Name'] || 'Unknown';

        // Check Duplicate
        const { data: existing } = await supabase
          .from('leads')
          .select('id, lead_status, metadata')
          .eq('tenant_id', profile.tenant_id)
          .eq('mobile', String(row['Mobile']))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Map Executive (Strictly by Email)
        let salesExecutiveId = profile.id; // Default to uploader
        if (row['Executive Email']) {
          const exec = executives?.find(e => e.email.toLowerCase() === String(row['Executive Email']).toLowerCase().trim());
          if (exec) {
            salesExecutiveId = exec.id;
          } else {
            throw new Error(`Executive with email '${row['Executive Email']}' not found in system.`);
          }
        }

        let shouldInsert = true;

        if (existing) {
          if (existing.lead_status === 'Lost') {
            // Reactivate Logic: Update existing lead
            // We update essential fields and set status to NEW
            const { error: updateError } = await supabase.from('leads').update({
              lead_status: 'New',
              sales_executive_id: salesExecutiveId,
              customer_name: customerName, // Update name if changed
              updated_at: new Date().toISOString(),
              updated_by: profile.id,
              metadata: { ...existing.metadata, reactivated_from_bulk: true, reactivated_at: new Date().toISOString() }
            }).eq('id', existing.id);

            if (updateError) throw updateError;

            // Add a system note/followup? Optional.
            shouldInsert = false;
            successCount++;
            // Continue to next iteration is handled by not entering Insert block if shouldInsert is false
          } else if (existing.lead_status === 'Converted') {
            // Allow Insert: Treat as fresh lead
            shouldInsert = true;
          } else {
            // Active Lead: Block
            throw new Error(`Mobile ${row['Mobile']} already exists (Status: ${existing.lead_status})`);
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
          if (row['Project']) {
            const proj = projects?.find(p => p.name.toLowerCase() === String(row['Project']).toLowerCase());
            if (proj) projectId = proj.id;
          }

          const getVal = (key: string, allowed: string[], fallback: string | null) => {
            if (!row[key]) return fallback;
            const value = String(row[key]);
            return allowed.includes(value) ? value : fallback;
          };

          const { error: insertError } = await supabase.from('leads').insert({
            tenant_id: profile.tenant_id,
            lead_id: leadId,
            customer_name: customerName,
            mobile: String(row['Mobile']),
            email: row['Email'] || null,
            city: row['City'] || null,
            project_id: projectId,
            budget_range: getVal('Budget', ['<50L', '50L-1Cr', '1Cr-2Cr', '>2Cr'], null) as any,
            purpose: getVal('Purpose', ['Investment', 'End Use'], 'Investment') as any,
            lead_source: getVal('Source', ['Ads', 'Walk-in', 'Reference', 'Channel Partner'], 'Walk-in') as any,
            lead_status: 'New', // Always New for fresh upload
            lead_score: getVal('Score', ['Hot', 'Warm', 'Cold'], 'Warm') as any,
            lead_date: row['Date'] ? new Date(row['Date']).toISOString() : new Date().toISOString(),
            created_by: profile.id,
            updated_by: profile.id,
            sales_executive_id: salesExecutiveId
          });

          if (insertError) throw insertError;
          successCount++;
        }

      } catch (err: any) {
        resultErrors.push({
          row: rowNum,
          error: err.message,
          mobile: row['Mobile']
        });
      }

      setProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setUploading(false);
    setUploadResult({
      success: successCount,
      failed: resultErrors.length,
      errors: resultErrors
    });

    if (resultErrors.length === 0) {
      onSuccess();
    }
  };

  const handleClose = () => {
    if (uploadResult && uploadResult.failed === 0) {
      onSuccess();
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads from Excel" size="lg">
      <div className="space-y-6">

        {/* Result View */}
        {uploadResult ? (
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

            <div className="flex justify-end pt-4">
              {uploadResult.failed > 0 ? (
                <Button onClick={() => setUploadResult(null)}>Try Again</Button>
              ) : (
                <Button onClick={handleClose} variant="primary">Done</Button>
              )}
            </div>
          </div>
        ) : (
          /* Upload View */
          <>
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Download the sample template.</li>
                  <li><strong>Do NOT change the Column Headers</strong> (First Row).</li>
                  <li>Delete the sample data row and add your own leads.</li>
                  <li><strong>Mobile Number</strong> is mandatory.</li>
                  <li>If <strong>Executive Email</strong> is empty, the lead will be assigned to YOU.</li>
                </ol>
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
                  Need the correct format?
                </p>
                <Button variant="secondary" onClick={downloadTemplate} className="w-full">
                  <Download size={16} className="mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* Preview / Progress */}
            {file && (
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploading ? 'Uploading...' : 'File Ready'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {previewData.length} records found
                  </span>
                </div>
                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                )}
                {errors.length > 0 && (
                  <div className="mt-4 max-h-32 overflow-y-auto space-y-1 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20 custom-scrollbar">
                    {errors.map((err, idx) => (
                      <div key={idx}>{err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={processUpload}
                disabled={!file || uploading || previewData.length === 0}
              >
                {uploading ? 'Processing...' : `Import ${previewData.length} Leads`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
