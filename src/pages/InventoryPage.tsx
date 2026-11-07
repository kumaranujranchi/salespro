import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { ActionMenu } from '../components/ui/ActionMenu';
import {
  Building,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Filter,
  Sparkles,
  Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export function InventoryPage() {
  const { profile, tenant } = useAuth();
  const currentTenantId = profile?.tenant_id || tenant?.id || tenant?._id;
  const toast = useToast();
  const dialog = useDialog();

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'platform_admin' || String(profile?.role || '').toLowerCase().includes('admin');

  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [activeTab, setActiveTab] = useState<'units' | 'fields'>('units');

  // Queries
  const projects = useQuery(api.projects.listAllProjects, currentTenantId ? { tenant_id: currentTenantId as Id<"tenants"> } : "skip");

  // Auto-select first project if none is selected
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      const firstId = (projects[0]._id || projects[0].id) as Id<"projects">;
      if (firstId) {
        setSelectedProjectId(firstId);
      }
    }
  }, [projects, selectedProjectId]);
  
  // Resolve active project reactively from query results
  const selectedProject = projects?.find(p => (p._id === selectedProjectId || p.id === selectedProjectId));
  const selectedProjectMetadata = typeof selectedProject?.metadata === 'string'
    ? (() => { try { return JSON.parse(selectedProject.metadata); } catch { return {}; } })()
    : (selectedProject?.metadata || {});
  const customFields: CustomField[] = Array.isArray(selectedProjectMetadata?.custom_fields) ? selectedProjectMetadata.custom_fields : [];

  // Units query
  const units = useQuery(api.projects.listUnits, selectedProjectId ? { project_id: selectedProjectId } : "skip");

  // Mutations
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const createOrUpdateUnit = useMutation(api.projects.createOrUpdateUnit);
  const deleteUnit = useMutation(api.projects.deleteUnit);

  // Custom Field Form State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [modalFieldProjectId, setModalFieldProjectId] = useState<Id<"projects"> | string>('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select'>('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Dynamic project for Field Modal
  const activeFieldProjectId = modalFieldProjectId || selectedProjectId || (projects && projects[0] ? (projects[0]._id || projects[0].id) : null);
  const activeFieldProject = projects?.find((p: any) => (p._id === activeFieldProjectId || p.id === activeFieldProjectId)) || selectedProject;

  // Unit Form State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [modalProjectId, setModalProjectId] = useState<Id<"projects"> | string>('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitStatus, setUnitStatus] = useState('Available');
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [editingUnitId, setEditingUnitId] = useState<any>(null);

  // Dynamic project & specifications inside Unit Modal
  const activeModalProjectId = modalProjectId || selectedProjectId || (projects && projects[0] ? (projects[0]._id || projects[0].id) : null);
  const activeModalProject = projects?.find((p: any) => (p._id === activeModalProjectId || p.id === activeModalProjectId)) || selectedProject;
  const activeModalMetadata = typeof activeModalProject?.metadata === 'string'
    ? (() => { try { return JSON.parse(activeModalProject.metadata); } catch { return {}; } })()
    : (activeModalProject?.metadata || {});
  const activeModalCustomFields: CustomField[] = Array.isArray(activeModalMetadata?.custom_fields)
    ? activeModalMetadata.custom_fields
    : [];

  // Unit Details State (Read-only view for agents)
  const [selectedUnitForDetails, setSelectedUnitForDetails] = useState<any | null>(null);

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // systemField -> excelHeader
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // General Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Dynamic custom fields filter state: { fieldId: { value, min, max } }
  const [customFilters, setCustomFilters] = useState<Record<string, any>>({});

  // Reset Form Helpers
  const resetFieldForm = () => {
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setEditingFieldId(null);
    setModalFieldProjectId(selectedProjectId || (projects && projects[0] ? (projects[0]._id || projects[0].id) : ''));
  };

  const resetUnitForm = () => {
    setUnitNumber('');
    setUnitStatus('Available');
    setCustomValues({});
    setEditingUnitId(null);
    setModalProjectId(selectedProjectId || (projects && projects[0] ? (projects[0]._id || projects[0].id) : ''));
  };

  // Manage custom fields
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = activeFieldProject || selectedProject;
    if (!isAdmin || !targetProject) return;

    const targetProjectMeta = typeof targetProject?.metadata === 'string'
      ? (() => { try { return JSON.parse(targetProject.metadata); } catch { return {}; } })()
      : (targetProject?.metadata || {});
    const targetProjectFields: CustomField[] = Array.isArray(targetProjectMeta?.custom_fields)
      ? targetProjectMeta.custom_fields
      : [];

    const fieldId = editingFieldId || fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (!editingFieldId && targetProjectFields.some((f: CustomField) => f.id === fieldId)) {
      toast.error('A field with a similar label already exists in this project.');
      return;
    }

    const newField: CustomField = {
      id: fieldId,
      label: fieldLabel.trim(),
      type: fieldType,
      options: fieldType === 'select' ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean) : [],
    };

    let updatedFields: CustomField[];
    if (editingFieldId) {
      updatedFields = targetProjectFields.map((f: CustomField) => f.id === editingFieldId ? newField : f);
    } else {
      updatedFields = [...targetProjectFields, newField];
    }

    try {
      const pId = targetProject._id || targetProject.id;
      await updateProjectMutation({
        id: pId,
        name: targetProject.name,
        project_type: targetProject.project_type || 'Other',
        status: targetProject.status || 'Running',
        is_active: targetProject.is_active,
        metadata: {
          ...targetProjectMeta,
          custom_fields: updatedFields,
        }
      });
      toast.success(editingFieldId ? 'Field updated for this project.' : `Custom field added to ${targetProject.name}.`);
      setIsFieldModalOpen(false);
      resetFieldForm();
    } catch {
      toast.error('Failed to save custom field.');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!isAdmin || !selectedProject) return;
    const confirmed = await dialog.confirm(`Deleting this field will remove it from ${selectedProject.name}. Are you sure?`, {
      variant: 'danger',
      confirmText: 'Delete Field',
      title: 'Delete Custom Field'
    });
    if (!confirmed) return;

    const targetProjectMeta = typeof selectedProject?.metadata === 'string'
      ? (() => { try { return JSON.parse(selectedProject.metadata); } catch { return {}; } })()
      : (selectedProject?.metadata || {});
    const targetProjectFields: CustomField[] = Array.isArray(targetProjectMeta?.custom_fields)
      ? targetProjectMeta.custom_fields
      : [];

    const updatedFields = targetProjectFields.filter((f: CustomField) => f.id !== fieldId);
    try {
      const pId = selectedProject._id || selectedProject.id;
      await updateProjectMutation({
        id: pId,
        name: selectedProject.name,
        project_type: selectedProject.project_type || 'Other',
        status: selectedProject.status || 'Running',
        is_active: selectedProject.is_active,
        metadata: {
          ...targetProjectMeta,
          custom_fields: updatedFields,
        }
      });
      toast.success(`Field removed from ${selectedProject.name}.`);
    } catch {
      toast.error('Failed to delete field.');
    }
  };

  // Manage individual unit
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only administrators can add or update inventory units.');
      return;
    }

    const targetProject = activeModalProject || selectedProject;
    if (!targetProject) {
      toast.error('Please select a project for this unit.');
      return;
    }

    const targetProjectId = targetProject._id || targetProject.id;
    const targetTenantId = targetProject.tenant_id || currentTenantId;

    if (!targetProjectId) {
      toast.error('A project must be selected to save the unit.');
      return;
    }

    if (!unitNumber || !unitNumber.trim()) {
      toast.error('Unit Number / ID is required.');
      return;
    }

    try {
      await createOrUpdateUnit({
        id: editingUnitId || undefined,
        tenant_id: targetTenantId,
        project_id: targetProjectId,
        unit_number: unitNumber.trim(),
        status: unitStatus,
        custom_values: customValues,
      });

      toast.success(editingUnitId ? 'Unit updated successfully.' : 'Unit added successfully.');
      setIsUnitModalOpen(false);
      resetUnitForm();

      // Ensure the table displays this project's units
      if (targetProjectId) {
        setSelectedProjectId(targetProjectId as Id<"projects">);
      }
    } catch (err: any) {
      console.error('Save unit error:', err);
      toast.error(err?.message || 'Failed to save unit.');
    }
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnitId(unit._id || unit.id);
    setUnitNumber(unit.unit_number);
    setUnitStatus(unit.status);
    setCustomValues(unit.custom_values || {});
    setModalProjectId(unit.project_id || selectedProjectId || '');
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = async (unitId: any) => {
    if (!isAdmin) return;
    const confirmed = await dialog.confirm('Are you sure you want to delete this unit?', {
      variant: 'danger',
      confirmText: 'Delete Unit',
      title: 'Delete Unit'
    });
    if (!confirmed) return;

    try {
      await deleteUnit({ id: unitId });
      toast.success('Unit removed from inventory.');
    } catch {
      toast.error('Failed to delete unit.');
    }
  };

  // Excel parsing and mapping
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length === 0) {
          toast.error('Uploaded file is empty.');
          return;
        }

        const headers = rawData[0].map(h => String(h).trim()).filter(Boolean);
        const rows = rawData.slice(1).map((row) => {
          const rowObj: Record<string, any> = {};
          headers.forEach((header, index) => {
            rowObj[header] = row[index] !== undefined ? row[index] : '';
          });
          return rowObj;
        });

        setExcelHeaders(headers);
        setExcelRows(rows);

        // Pre-configure initial mappings by matching names
        const initialMappings: Record<string, string> = {};
        const matchHeader = (fieldKey: string) => {
          return headers.find(h => h.toLowerCase().replace(/[\s_-]/g, '') === fieldKey.toLowerCase().replace(/[\s_-]/g, '')) || '';
        };

        initialMappings['unit_number'] = matchHeader('unitnumber') || matchHeader('unit') || matchHeader('plot') || matchHeader('flat') || matchHeader('id') || headers[0];
        initialMappings['status'] = matchHeader('status') || matchHeader('availability') || matchHeader('state') || '';

        customFields.forEach(field => {
          initialMappings[field.id] = matchHeader(field.label) || matchHeader(field.id) || '';
        });

        setMappings(initialMappings);
        setIsMappingModalOpen(true);
      } catch {
        toast.error('Failed to read Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // clear input
  };

  // Perform bulk import
  const handleImportExcel = async () => {
    if (!selectedProject || excelRows.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    try {
      for (let i = 0; i < excelRows.length; i++) {
        const row = excelRows[i];
        
        // Extract mapped values
        const mappedUnitNum = String(row[mappings['unit_number'] || ''] || '').trim();
        if (!mappedUnitNum) continue;

        const rawStatus = String(row[mappings['status'] || ''] || 'Available').trim().toLowerCase();
        let mappedStatus = 'Available';
        if (rawStatus.includes('sold')) {
          mappedStatus = 'Sold';
        } else if (rawStatus.includes('hold') || rawStatus.includes('block')) {
          mappedStatus = 'Hold';
        } else if (rawStatus.includes('book')) {
          mappedStatus = 'Booked';
        }

        const mappedCustomValues: Record<string, any> = {};
        customFields.forEach((field) => {
          const excelColHeader = mappings[field.id];
          if (excelColHeader && row[excelColHeader] !== undefined) {
            const rawVal = row[excelColHeader];
            if (field.type === 'number') {
              mappedCustomValues[field.id] = Number(rawVal) || 0;
            } else {
              mappedCustomValues[field.id] = String(rawVal).trim();
            }
          }
        });

        await createOrUpdateUnit({
          tenant_id: selectedProject.tenant_id,
          project_id: selectedProject._id,
          unit_number: mappedUnitNum,
          status: mappedStatus,
          custom_values: mappedCustomValues,
        });

        successCount++;
        setImportProgress(Math.round(((i + 1) / excelRows.length) * 100));
      }

      toast.success(`Successfully imported ${successCount} units from Excel!`);
      setIsMappingModalOpen(false);
    } catch {
      toast.error(`Import failed mid-way. Successfully imported ${successCount} units.`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Advanced dynamic filter validation
  const filteredUnits = (units || []).filter((unit: any) => {
    if (!unit) return false;
    if (!unit.unit_number && !unit.unit) return false;
    const unitNum = String(unit.unit_number || unit.unit || '');
    // 1. Search Query Match
    const matchesSearch = unitNum.toLowerCase().includes((searchQuery || '').toLowerCase());
    
    // 2. Status Match
    const matchesStatus = !statusFilter || statusFilter === 'All' || unit.status === statusFilter;
    
    // 3. Dynamic Custom Filters Match
    let matchesCustom = true;
    for (const field of customFields) {
      const filterVal = customFilters[field.id];
      if (!filterVal) continue;

      const unitVal = unit.custom_values?.[field.id];

      if (field.type === 'select') {
        if (filterVal.value && filterVal.value !== 'All') {
          if (unitVal !== filterVal.value) {
            matchesCustom = false;
            break;
          }
        }
      } else if (field.type === 'number') {
        if (filterVal.min !== undefined && filterVal.min !== '') {
          if (Number(unitVal) < Number(filterVal.min)) {
            matchesCustom = false;
            break;
          }
        }
        if (filterVal.max !== undefined && filterVal.max !== '') {
          if (Number(unitVal) > Number(filterVal.max)) {
            matchesCustom = false;
            break;
          }
        }
      } else {
        if (filterVal.value && filterVal.value.trim() !== '') {
          if (!String(unitVal || '').toLowerCase().includes(filterVal.value.toLowerCase())) {
            matchesCustom = false;
            break;
          }
        }
      }
    }

    return matchesSearch && matchesStatus && matchesCustom;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-blue-500 h-8 w-8" />
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Select a project to configure specs, add inventory items, or search availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Project Selection Dropdown */}
          <div className="relative">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => {
                setSelectedProjectId(e.target.value ? e.target.value as Id<"projects"> : null);
                setCustomFilters({});
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Real Estate Project --</option>
              {projects?.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.project_type || 'Property'})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* If no project selected, show empty state */}
      {!selectedProjectId ? (
        <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden py-16 text-center">
          <CardContent className="space-y-4">
            <Building className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {projects && projects.length === 0 ? "No Projects Found" : "No Project Selected"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {projects && projects.length === 0
                ? "You haven't created any real estate projects yet. Please create a project under Projects first to start managing inventory units."
                : "Please choose a real estate project from the dropdown at the top right to start managing custom fields and unit inventory."}
            </p>
            {projects && projects.length > 0 && isAdmin && (
              <div className="pt-2">
                <Button variant="primary" onClick={() => {
                  const firstId = (projects[0]._id || projects[0].id) as Id<"projects">;
                  setSelectedProjectId(firstId);
                  resetUnitForm();
                  setIsUnitModalOpen(true);
                }}>
                  <Plus size={16} className="mr-1.5" /> Add Unit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('units')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'units'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              All Units / Flats / Plots
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('fields')}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'fields'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Configure Specs / Fields
              </button>
            )}
          </div>

          {/* Tab Contents */}
          {activeTab === 'units' ? (
            <div className="space-y-6">
              {/* Dynamic Filter Panel */}
              <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">Search & Specifications Filter</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* General Search Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Input
                      label="Unit Number / ID"
                      placeholder="Search Unit #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Availability Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Hold">Hold</option>
                        <option value="Booked">Booked</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>
                  </div>

                  {/* Render Custom Fields Filters dynamically */}
                  {customFields.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Specs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {customFields.map((field) => {
                          if (field.type === 'select') {
                            return (
                              <div key={field.id}>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                                <select
                                  value={customFilters[field.id]?.value || 'All'}
                                  onChange={(e) => setCustomFilters(prev => ({
                                    ...prev,
                                    [field.id]: { value: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                >
                                  <option value="All">All ({field.label})</option>
                                  {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          } else if (field.type === 'number') {
                            return (
                              <div key={field.id} className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-500">{field.label} Range</label>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder="Min"
                                    value={customFilters[field.id]?.min || ''}
                                    onChange={(e) => setCustomFilters(prev => ({
                                      ...prev,
                                      [field.id]: { ...prev[field.id], min: e.target.value }
                                    }))}
                                    className="w-1/2 px-2 py-1.5 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Max"
                                    value={customFilters[field.id]?.max || ''}
                                    onChange={(e) => setCustomFilters(prev => ({
                                      ...prev,
                                      [field.id]: { ...prev[field.id], max: e.target.value }
                                    }))}
                                    className="w-1/2 px-2 py-1.5 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={field.id}>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                                <input
                                  type="text"
                                  placeholder={`Search ${field.label}...`}
                                  value={customFilters[field.id]?.value || ''}
                                  onChange={(e) => setCustomFilters(prev => ({
                                    ...prev,
                                    [field.id]: { value: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reset Filters button */}
                  {(searchQuery || statusFilter !== 'All' || Object.keys(customFilters).length > 0) && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('All');
                          setCustomFilters({});
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Units Table card */}
              <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Inventory Units</CardTitle>
                      <CardDescription>
                        Showing {filteredUnits.length} of {units?.length || 0} registered units.
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        {/* Excel Upload hidden input trigger */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleExcelUpload}
                          accept=".xlsx, .xls, .csv"
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <Upload size={16} className="mr-1.5" /> Upload Excel
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => { resetUnitForm(); setIsUnitModalOpen(true); }}>
                          <Plus size={16} className="mr-1.5" /> Add Unit
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!units ? (
                    <div className="text-center py-12 text-slate-500">Loading units database...</div>
                  ) : filteredUnits.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      No units matching the criteria. Add custom fields or upload units.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Unit / ID</TableHead>
                            <TableHead>Status</TableHead>
                            {customFields.map((field) => (
                              <TableHead key={field.id}>{field.label}</TableHead>
                            ))}
                            {isAdmin && <TableHead className="text-right pr-6">Actions</TableHead>}
                            {!isAdmin && <TableHead className="text-right pr-6">Details</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUnits.map((unit) => (
                            <TableRow key={unit._id}>
                              <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">
                                {unit.unit_number}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  unit.status === 'Available' ? 'success' :
                                  unit.status === 'Hold' ? 'warning' :
                                  unit.status === 'Booked' ? 'outline' : 'danger'
                                }>
                                  {unit.status}
                                </Badge>
                              </TableCell>
                              {customFields.map((field) => (
                                <TableCell key={field.id} className="text-slate-600 dark:text-slate-300">
                                  {unit.custom_values?.[field.id] !== undefined ? String(unit.custom_values[field.id]) : '-'}
                                </TableCell>
                              ))}
                              <TableCell className="text-right pr-6">
                                {isAdmin ? (
                                  <ActionMenu actions={[
                                    { label: 'Edit Details', icon: Pencil, onClick: () => handleEditUnit(unit) },
                                    { label: 'Delete', icon: Trash2, variant: 'danger', onClick: () => handleDeleteUnit(unit._id) }
                                  ]} />
                                ) : (
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedUnitForDetails(unit)}>
                                    View Specifications
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            // Custom Fields Configuration Tab (Admin Only)
            <div className="space-y-6">
              {/* Active Project Banner and Switcher */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Project Specific Configuration</span>
                      <Badge variant="outline" className="text-[11px] font-bold">
                        {selectedProject?.project_type || 'Property'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedProject?.name || 'Select a Project'}
                    </h3>
                  </div>
                </div>

                {/* Quick Project Switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Configure for Project:</span>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => {
                      const newPid = e.target.value as Id<"projects">;
                      setSelectedProjectId(newPid);
                      setCustomFilters({});
                    }}
                    className="px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects?.map((p: any) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name} ({p.project_type || 'Property'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Configured Specifications for {selectedProject?.name}</CardTitle>
                    <CardDescription>
                      These custom attributes belong exclusively to <strong>{selectedProject?.name}</strong> ({selectedProject?.project_type || 'Property'}). Units created for other projects will not show these fields unless defined there as well.
                    </CardDescription>
                  </div>
                  <Button variant="primary" onClick={() => { resetFieldForm(); setModalFieldProjectId(selectedProjectId || ''); setIsFieldModalOpen(true); }}>
                    <Plus size={16} className="mr-1.5" /> Add Custom Field
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {customFields.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 max-w-md mx-auto space-y-3">
                      <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
                      <h4 className="text-base font-bold">No Custom Fields for {selectedProject?.name}</h4>
                      <p className="text-sm">
                        Create attributes like {selectedProject?.project_type?.toLowerCase().includes('land') ? '"Plot Area" or "Road Width"' : '"House Configuration" or "Facing"'} specifically for this project.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Field Name</TableHead>
                          <TableHead>System Identifier</TableHead>
                          <TableHead>Field Type</TableHead>
                          <TableHead>Available Options</TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="pl-6 font-bold text-slate-800 dark:text-slate-200">{field.label}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-500">{field.id}</TableCell>
                            <TableCell className="capitalize text-slate-600">{field.type}</TableCell>
                            <TableCell className="text-slate-600">
                              {field.options && field.options.length > 0 ? field.options.join(', ') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right pr-6 space-x-3">
                              <button
                                onClick={() => {
                                  setEditingFieldId(field.id);
                                  setFieldLabel(field.label);
                                  setFieldType(field.type);
                                  setFieldOptions(field.options ? field.options.join(', ') : '');
                                  setIsFieldModalOpen(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 font-semibold text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="text-red-500 hover:text-red-700 font-semibold text-sm"
                              >
                                Delete
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Field Editor Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title={editingFieldId ? "Edit Custom Field" : "Create Custom Field for Project"}
      >
        <form onSubmit={handleSaveField} className="space-y-4">
          {/* Target Project Dropdown inside Field Modal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Configure for Project <span className="text-red-500">*</span>
            </label>
            <select
              value={activeFieldProjectId || ''}
              onChange={(e) => {
                const pid = e.target.value as Id<"projects">;
                setModalFieldProjectId(pid);
                if (pid) setSelectedProjectId(pid);
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm font-medium"
            >
              <option value="">-- Select Project * --</option>
              {projects?.map((p: any) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.project_type || 'Property'})
                </option>
              ))}
            </select>
            {activeFieldProject && (
              <div className="mt-1.5 flex items-center justify-between gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/50 dark:border-blue-900/50">
                <span>Target: <strong>{activeFieldProject.name}</strong></span>
                <span className="font-semibold uppercase text-[10px]">{activeFieldProject.project_type || 'General'}</span>
              </div>
            )}
          </div>

          {/* Quick Specification Templates */}
          {!editingFieldId && (
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1.5">
                Quick Suggestions for {activeFieldProject?.project_type || 'this project'}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  (activeFieldProject?.project_type || '').toLowerCase().includes('land') ||
                  (activeFieldProject?.project_type || '').toLowerCase().includes('plot')
                    ? [
                        { label: 'Plot Area (sq ft)', type: 'number' },
                        { label: 'Facing', type: 'select', opts: 'East, West, North, South, North-East, South-West' },
                        { label: 'Road Width (ft)', type: 'number' },
                        { label: 'Plot Dimensions', type: 'text' },
                        { label: 'Corner Plot', type: 'select', opts: 'Yes, No' },
                        { label: 'Boundary Wall', type: 'select', opts: 'Done, Not Done' }
                      ]
                    : (activeFieldProject?.project_type || '').toLowerCase().includes('commer')
                    ? [
                        { label: 'Carpet Area (sq ft)', type: 'number' },
                        { label: 'Property Type', type: 'select', opts: 'Retail Shop, Office, Food Court, Warehouse' },
                        { label: 'Floor Number', type: 'number' },
                        { label: 'Power Backup', type: 'select', opts: '100% DG Backup, Standard, None' },
                        { label: 'Furnishing Status', type: 'select', opts: 'Bare Shell, Warm Shell, Fully Furnished' }
                      ]
                    : [
                        { label: 'House Configuration', type: 'select', opts: '1 BHK, 2 BHK, 3 BHK, 4 BHK, Villa, Penthouse' },
                        { label: 'Facing', type: 'select', opts: 'East, West, North, South, North-East, South-West' },
                        { label: 'Floor Number', type: 'number' },
                        { label: 'Super Built-up Area (sq ft)', type: 'number' },
                        { label: 'Carpet Area (sq ft)', type: 'number' },
                        { label: 'Furnishing Status', type: 'select', opts: 'Unfurnished, Semi-Furnished, Fully-Furnished' }
                      ]
                ).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFieldLabel(sug.label);
                      setFieldType(sug.type as any);
                      if (sug.opts) setFieldOptions(sug.opts);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-xs rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                  >
                    + {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Field Label"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            required
            placeholder="e.g. Facing, Super Area, BHK, Plot Size"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Type
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
            >
              <option value="text">Text (e.g. Dimensions, Block Name)</option>
              <option value="number">Number (e.g. Area sqft, Floor No, Price)</option>
              <option value="select">Dropdown Options (e.g. 2BHK/3BHK, Facing list)</option>
            </select>
          </div>
          {fieldType === 'select' && (
            <Input
              label="Select Options (comma-separated list)"
              value={fieldOptions}
              onChange={(e) => setFieldOptions(e.target.value)}
              required
              placeholder="e.g. East, West, North, South"
            />
          )}
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsFieldModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Field</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Unit Editor Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnitId ? "Edit Unit Details" : "Add Unit / Flat / Plot"}
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          {/* Project Selection Dropdown inside Modal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Project <span className="text-red-500">*</span>
            </label>
            <select
              value={activeModalProjectId || ''}
              onChange={(e) => {
                const newPid = e.target.value as Id<"projects">;
                setModalProjectId(newPid);
                setCustomValues({}); // Cleanly reset custom values when project changes
                if (newPid) {
                  setSelectedProjectId(newPid);
                }
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm font-medium"
            >
              <option value="">-- Select Project * --</option>
              {projects?.map((p: any) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.project_type || 'Property'})
                </option>
              ))}
            </select>
            {activeModalProject && (
              <div className="mt-1.5 flex items-center justify-between gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-900/50">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Project: <strong>{activeModalProject.name}</strong></span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5">
                  {activeModalProject.project_type || 'Property'}
                </Badge>
              </div>
            )}
          </div>

          <Input
            label="Unit Number / ID *"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
            placeholder="e.g. Flat-102, Plot-56, Shop-12"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Availability Status
            </label>
            <select
              value={unitStatus}
              onChange={(e) => setUnitStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
            >
              <option value="Available">Available</option>
              <option value="Hold">Hold</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          {/* Render Custom Fields dynamically ONLY for this selected project */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeModalProject?.name} Specifications ({activeModalCustomFields.length})
              </span>
            </div>

            {activeModalCustomFields.length === 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-500">
                No custom specifications configured for <strong>{activeModalProject?.name || 'this project'}</strong> yet. You can add specs anytime under the <em>Configure Specs / Fields</em> tab.
              </div>
            ) : (
              activeModalCustomFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={customValues[field.id] || ''}
                      onChange={(e) => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                    >
                      <option value="">-- Select {field.label} --</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={customValues[field.id] || ''}
                      onChange={(e) => setCustomValues(prev => ({
                        ...prev,
                        [field.id]: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                      }))}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsUnitModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Unit</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Read-Only Unit Details Modal (for Sales Agents) */}
      <Modal
        isOpen={selectedUnitForDetails !== null}
        onClose={() => setSelectedUnitForDetails(null)}
        title={`Unit Specifications: ${selectedUnitForDetails?.unit_number}`}
      >
        {selectedUnitForDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <span className="text-xs text-slate-500 block">Unit Number / ID</span>
                <span className="font-semibold text-slate-800 dark:text-white">{selectedUnitForDetails.unit_number}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Current Status</span>
                <Badge variant={
                  selectedUnitForDetails.status === 'Available' ? 'success' :
                  selectedUnitForDetails.status === 'Hold' ? 'warning' :
                  selectedUnitForDetails.status === 'Booked' ? 'outline' : 'danger'
                }>
                  {selectedUnitForDetails.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Specifications</h4>
              {customFields.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No additional specifications defined for this project.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">{field.label}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedUnitForDetails.custom_values?.[field.id] !== undefined ? String(selectedUnitForDetails.custom_values[field.id]) : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ModalFooter>
              <Button type="button" variant="primary" onClick={() => setSelectedUnitForDetails(null)}>Close</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Excel Upload and Column Mapping Modal */}
      <Modal
        isOpen={isMappingModalOpen}
        onClose={() => !isImporting && setIsMappingModalOpen(false)}
        title="Excel Column Mapping Wizard"
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-500">
            Map columns from your Excel file (e.g. headers detected on Row 1) to RealSalePro system parameters and configured specifications.
          </p>

          {isImporting ? (
            <div className="space-y-4 py-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Importing data, please wait...</p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
              </div>
              <span className="text-xs text-slate-500">{importProgress}% Completed</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {/* Mapping for System fields */}
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">System Fields</h4>
                
                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit / Plot Number *</label>
                  <select
                    value={mappings['unit_number'] || ''}
                    onChange={(e) => setMappings(prev => ({ ...prev, unit_number: e.target.value }))}
                    className="px-2 py-1 bg-white border border-gray-200 dark:bg-slate-800 rounded-md text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Unmapped --</option>
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Availability Status</label>
                  <select
                    value={mappings['status'] || ''}
                    onChange={(e) => setMappings(prev => ({ ...prev, status: e.target.value }))}
                    className="px-2 py-1 bg-white border border-gray-200 dark:bg-slate-800 rounded-md text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Fallback (Available) --</option>
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Mapping for configured Custom fields */}
              {customFields.length > 0 && (
                <div className="p-3 bg-blue-50/20 dark:bg-white/5 rounded-xl border space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Configured Project Specs</h4>
                  
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between gap-4">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{field.label}</label>
                      <select
                        value={mappings[field.id] || ''}
                        onChange={(e) => setMappings(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="px-2 py-1 bg-white border border-gray-200 dark:bg-slate-800 rounded-md text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Do Not Import --</option>
                        {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isImporting && (
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsMappingModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleImportExcel} disabled={!mappings['unit_number']}>
                Import {excelRows.length} Rows
              </Button>
            </ModalFooter>
          )}
        </div>
      </Modal>
    </div>
  );
}
