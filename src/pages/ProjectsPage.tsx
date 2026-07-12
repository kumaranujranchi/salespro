import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useDialog } from '../contexts/DialogContext';
import { useToast } from '../contexts/ToastContext';
import { Project } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Building, Plus, ExternalLink, Trash2, Pencil, X, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ActionMenu } from '../components/ui/ActionMenu';

export function ProjectsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const toast = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<Id<"projects"> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewType, setViewType] = useState<'card' | 'list'>('list');
  const [selectedProjectForInventory, setSelectedProjectForInventory] = useState<any | null>(null);

  const isReadOnly = profile?.role === 'director';

  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    googleMapsUrl: string;
    projectType: Project['project_type'];
    imageUrl: string;
    status: Project['status'];
  }>({
    name: '',
    address: '',
    googleMapsUrl: '',
    projectType: 'Other',
    imageUrl: '',
    status: 'Running'
  });

  // Convex Queries
  const projects = useQuery(api.projects.listAllProjects, profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip");

  // Convex Mutations
  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      googleMapsUrl: '',
      projectType: 'Flat/Apartment',
      imageUrl: '',
      status: 'Running'
    });
    setEditingProjectId(null);
  };

  const handleEditProject = (project: any) => {
    if (isReadOnly) return;
    setEditingProjectId(project._id);
    setFormData({
      name: project.name,
      address: project.address || '',
      googleMapsUrl: project.google_maps_url || '',
      projectType: project.project_type || 'Other',
      imageUrl: project.image_url || '',
      status: project.status || 'Running'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // For now, keeping a placeholder for image upload as Convex storage integration
    // requires more setup. We'll implement this properly in a future step.
    toast.info("Image upload to Convex storage will be implemented soon.");
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !profile?.tenant_id) return;
    setIsSubmitting(true);
    try {
      const projectData = {
        name: formData.name,
        address: formData.address,
        google_maps_url: formData.googleMapsUrl || undefined,
        project_type: formData.projectType,
        image_url: formData.imageUrl || undefined,
        status: formData.status,
        is_active: formData.status === 'Running'
      };

      if (editingProjectId) {
        await updateProjectMutation({
          id: editingProjectId,
          ...projectData
        });
        toast.success('Project updated successfully!');
      } else {
        await createProjectMutation({
          tenant_id: profile.tenant_id as Id<"tenants">,
          ...projectData
        });
        toast.success('Project added successfully!');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"projects">) => {
    if (isReadOnly) return;
    const confirmed = await dialog.confirm('Are you sure you want to delete this project?', {
      variant: 'danger',
      confirmText: 'Delete Project',
      title: 'Delete Project'
    });

    if (!confirmed) return;

    try {
      await deleteProjectMutation({ id });
      toast.success('Project deleted.');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project.');
    }
  };

  if (selectedProjectForInventory) {
    return (
      <InventorySubView
        project={selectedProjectForInventory}
        onBack={() => setSelectedProjectForInventory(null)}
        profile={profile}
        updateProjectMutation={updateProjectMutation}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Manage property projects and listings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 mr-2 shadow-sm">
            <button onClick={() => setViewType('card')} className={`p-1.5 rounded-md transition-all ${viewType === 'card' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewType('list')} className={`p-1.5 rounded-md transition-all ${viewType === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
          </div>
          {!isReadOnly && (
            <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }} className="hidden md:flex">
              <Plus size={18} className="mr-2" />
              Add Project
            </Button>
          )}
        </div>
      </div>

      {!projects ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1673FF] border-t-transparent"></div>
        </div>
      ) : viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project._id} className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
              {project.image_url ? (
                <div className="h-48 w-full overflow-hidden relative">
                  <img src={project.image_url} alt={project.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                  <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-full shadow-md">
                    {!isReadOnly && (
                      <ActionMenu actions={[
                        { label: 'Edit', icon: Pencil, onClick: () => handleEditProject(project) },
                        { label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => handleDelete(project._id) }
                      ]} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center relative">
                  <Building size={48} className="text-blue-500/40" />
                  <div className="absolute top-4 right-4 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-1 rounded-full shadow-md">
                    {!isReadOnly && (
                      <ActionMenu actions={[
                        { label: 'Edit', icon: Pencil, onClick: () => handleEditProject(project) },
                        { label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => handleDelete(project._id) }
                      ]} />
                    )}
                  </div>
                </div>
              )}
              <CardHeader className="border-b-0 pb-2 flex-grow">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{project.project_type || 'Other'}</Badge>
                  <Badge variant={
                    project.status === 'Running' ? 'success' :
                      project.status === 'Closed' ? 'secondary' : 'warning'
                  }>
                    {project.status || 'Running'}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold mt-3 leading-tight truncate">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">{project.address || 'No Address'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-6 flex items-center justify-between border-t border-gray-100/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                {project.google_maps_url ? (
                  <a
                    href={project.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1673FF] hover:underline flex items-center gap-1 text-sm font-semibold"
                  >
                    View Map <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs font-medium">No Map Link</span>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedProjectForInventory(project)}>
                  View Inventory <ExternalLink size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building size={20} />
              <CardTitle>All Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Inventory</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: any) => (
                  <TableRow key={project._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-500">{project.address || 'No Address'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.project_type || 'Other'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        project.status === 'Running' ? 'success' :
                          project.status === 'Closed' ? 'secondary' : 'warning'
                      }>
                        {project.status || 'Running'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.google_maps_url ? (
                        <a
                          href={project.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1673FF] hover:underline flex items-center gap-1"
                        >
                          View Map <ExternalLink size={14} />
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedProjectForInventory(project)}>
                        View Inventory
                      </Button>
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        <ActionMenu actions={[
                          { label: 'View Inventory', icon: LayoutGrid, onClick: () => setSelectedProjectForInventory(project) },
                          { label: 'Edit', icon: Pencil, onClick: () => handleEditProject(project) },
                          { label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => handleDelete(project._id) }
                        ]} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button for Mobile */}
      {!isReadOnly && (
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="md:hidden fixed bottom-24 right-4 w-12 h-12 bg-[#1673FF] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 active:scale-95 transition-all z-30"
        >
          <Plus size={24} />
        </button>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProjectId ? "Edit Project" : "Add New Project"}
      >
        <form onSubmit={handleSaveProject} className="space-y-6">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="e.g. Sunrise Apartments"
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Property location details..."
          />
          <Input
            label="Google Maps URL"
            value={formData.googleMapsUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
            placeholder="https://maps.google.com/..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Type
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="Flat/Apartment">Flat/Apartment</option>
                <option value="Residential Land (Plotting)">Residential Land (Plotting)</option>
                <option value="Serviced Apartments">Serviced Apartments</option>
                <option value="Residential Land">Residential Land</option>
                <option value="1 RK/ Studio Apartment">1 RK/ Studio Apartment</option>
                <option value="Independent House/Villa">Independent House/Villa</option>
                <option value="Farm House">Farm House</option>
                <option value="Duplex">Duplex</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="Running">Running</option>
                <option value="Hold">Hold</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Image
            </label>
            <div className="flex items-center gap-4">
              {formData.imageUrl && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="cursor-pointer"
                />
                {uploadingImage && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingProjectId ? "Update Project" : "Create Project"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Custom Inventory Management Sub-view component
function InventorySubView({ project, onBack, profile, updateProjectMutation }: {
  project: any;
  onBack: () => void;
  profile: any;
  updateProjectMutation: any;
}) {
  const toast = useToast();
  const dialog = useDialog();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  // State
  const [activeTab, setActiveTab] = useState<'units' | 'fields'>('units');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Custom field modal state
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select'>('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Unit modal state
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitNumber, setUnitNumber] = useState('');
  const [unitStatus, setUnitStatus] = useState('Available');
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [editingUnitId, setEditingUnitId] = useState<any>(null);

  // Read-only unit details modal state
  const [selectedUnitForDetails, setSelectedUnitForDetails] = useState<any | null>(null);

  // Fetch project units
  const units = useQuery(api.projects.listUnits, { project_id: project._id });
  const createOrUpdateUnit = useMutation(api.projects.createOrUpdateUnit);
  const deleteUnit = useMutation(api.projects.deleteUnit);

  const customFields = project.metadata?.custom_fields || [];

  // Manage custom fields
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const fieldId = editingFieldId || fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check for duplicate field ID
    if (!editingFieldId && customFields.some((f: any) => f.id === fieldId)) {
      toast.error('A field with a similar label already exists.');
      return;
    }

    const newField = {
      id: fieldId,
      label: fieldLabel,
      type: fieldType,
      options: fieldType === 'select' ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean) : [],
    };

    let updatedFields;
    if (editingFieldId) {
      updatedFields = customFields.map((f: any) => f.id === editingFieldId ? newField : f);
    } else {
      updatedFields = [...customFields, newField];
    }

    try {
      await updateProjectMutation({
        id: project._id,
        name: project.name,
        project_type: project.project_type,
        status: project.status,
        is_active: project.is_active,
        metadata: {
          ...project.metadata,
          custom_fields: updatedFields,
        }
      });
      toast.success(editingFieldId ? 'Field updated.' : 'Custom field added.');
      setIsFieldModalOpen(false);
      setFieldLabel('');
      setFieldType('text');
      setFieldOptions('');
      setEditingFieldId(null);
    } catch {
      toast.error('Failed to save custom field.');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!isAdmin) return;
    const confirmed = await dialog.confirm('Deleting this field will also remove its logged values from all units. Are you sure?', {
      variant: 'danger',
      confirmText: 'Delete Field',
      title: 'Delete Custom Field'
    });
    if (!confirmed) return;

    const updatedFields = customFields.filter((f: any) => f.id !== fieldId);
    try {
      await updateProjectMutation({
        id: project._id,
        name: project.name,
        project_type: project.project_type,
        status: project.status,
        is_active: project.is_active,
        metadata: {
          ...project.metadata,
          custom_fields: updatedFields,
        }
      });
      toast.success('Field deleted.');
    } catch {
      toast.error('Failed to delete field.');
    }
  };

  // Manage units
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      await createOrUpdateUnit({
        id: editingUnitId || undefined,
        tenant_id: project.tenant_id,
        project_id: project._id,
        unit_number: unitNumber,
        status: unitStatus,
        custom_values: customValues,
      });

      toast.success(editingUnitId ? 'Unit updated successfully.' : 'Unit added successfully.');
      setIsUnitModalOpen(false);
      setUnitNumber('');
      setUnitStatus('Available');
      setCustomValues({});
      setEditingUnitId(null);
    } catch {
      toast.error('Failed to save unit.');
    }
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnitId(unit._id);
    setUnitNumber(unit.unit_number);
    setUnitStatus(unit.status);
    setCustomValues(unit.custom_values || {});
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = async (unitId: any) => {
    if (!isAdmin) return;
    const confirmed = await dialog.confirm('Are you sure you want to delete this unit from inventory?', {
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

  // Filtered units
  const filteredUnits = (units || []).filter((unit: any) => {
    const matchesSearch = unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || unit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button onClick={onBack} className="hover:underline">Projects</button>
            <span>/</span>
            <span className="text-slate-800 font-medium">Inventory</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {project.name} - Inventory
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {project.address || 'No Address'} • {project.project_type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to Projects
          </Button>
          {isAdmin && activeTab === 'units' && (
            <Button variant="primary" onClick={() => {
              setEditingUnitId(null);
              setUnitNumber('');
              setUnitStatus('Available');
              setCustomValues({});
              setIsUnitModalOpen(true);
            }}>
              <Plus size={18} className="mr-2" /> Add Unit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
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
            Custom Fields Config
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'units' ? (
        <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Inventory List</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search by Unit / Plot #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sm:w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Hold">Hold</option>
                  <option value="Booked">Booked</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!units ? (
              <div className="text-center py-8 text-slate-500">Loading units...</div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No units matching current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Number / ID</TableHead>
                      <TableHead>Status</TableHead>
                      {customFields.map((field: any) => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit: any) => (
                      <TableRow key={unit._id}>
                        <TableCell className="font-semibold text-slate-900 dark:text-white">
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
                        {customFields.map((field: any) => (
                          <TableCell key={field.id} className="text-slate-600 dark:text-slate-300">
                            {unit.custom_values?.[field.id] !== undefined ? String(unit.custom_values[field.id]) : '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          {isAdmin ? (
                            <ActionMenu actions={[
                              { label: 'Edit', icon: Pencil, onClick: () => handleEditUnit(unit) },
                              { label: 'Delete', icon: Trash2, variant: 'danger', onClick: () => handleDeleteUnit(unit._id) }
                            ]} />
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUnitForDetails(unit)}>
                              Details
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
      ) : (
        // Custom Fields Tab (Admin Only)
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Configured Fields</CardTitle>
                <CardDescription>Fields that define project unit details (e.g. BHK, size, facing)</CardDescription>
              </div>
              <Button variant="primary" onClick={() => {
                setEditingFieldId(null);
                setFieldLabel('');
                setFieldType('text');
                setFieldOptions('');
                setIsFieldModalOpen(true);
              }}>
                <Plus size={18} className="mr-2" /> Add Field
              </Button>
            </CardHeader>
            <CardContent>
              {customFields.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No custom fields defined yet. Define fields so you can specify unit parameters (BHK, facing, area etc).
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Label</TableHead>
                      <TableHead>Database Key</TableHead>
                      <TableHead>Input Type</TableHead>
                      <TableHead>Dropdown Options</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFields.map((field: any) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-semibold">{field.label}</TableCell>
                        <TableCell className="font-mono text-xs">{field.id}</TableCell>
                        <TableCell className="capitalize">{field.type}</TableCell>
                        <TableCell>{field.options && field.options.length > 0 ? field.options.join(', ') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => {
                              setEditingFieldId(field.id);
                              setFieldLabel(field.label);
                              setFieldType(field.type);
                              setFieldOptions(field.options ? field.options.join(', ') : '');
                              setIsFieldModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 mr-3 text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold"
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

      {/* Field Editor Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title={editingFieldId ? "Edit Custom Field" : "Add Custom Field"}
      >
        <form onSubmit={handleSaveField} className="space-y-4">
          <Input
            label="Field Label"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            required
            placeholder="e.g. Facing, Super Area, BHK"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Type
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="text">Text (e.g. A Block, Sector 4)</option>
              <option value="number">Number (e.g. 1200, 4)</option>
              <option value="select">Dropdown List (e.g. East/West, 2BHK/3BHK)</option>
            </select>
          </div>
          {fieldType === 'select' && (
            <Input
              label="Options (comma separated)"
              value={fieldOptions}
              onChange={(e) => setFieldOptions(e.target.value)}
              required
              placeholder="e.g. 2 BHK, 3 BHK, 4 BHK"
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
        title={editingUnitId ? "Edit Unit Details" : "Add Unit to Inventory"}
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <Input
            label="Unit / Plot Number"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
            placeholder="e.g. Flat 101, Plot 32"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Availability Status
            </label>
            <select
              value={unitStatus}
              onChange={(e) => setUnitStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="Available">Available</option>
              <option value="Hold">Hold</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          {/* Render Custom Fields dynamically */}
          {customFields.map((field: any) => (
            <div key={field.id} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={customValues[field.id] || ''}
                  onChange={(e) => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="">Select Option</option>
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={customValues[field.id] || ''}
                  onChange={(e) => setCustomValues(prev => ({ ...prev, [field.id]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsUnitModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Unit</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Read-Only Unit Details Modal (for Sales Executives) */}
      <Modal
        isOpen={selectedUnitForDetails !== null}
        onClose={() => setSelectedUnitForDetails(null)}
        title={`Unit Details: ${selectedUnitForDetails?.unit_number}`}
      >
        {selectedUnitForDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <span className="text-xs text-slate-500 block">Unit / Plot Number</span>
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
                  {customFields.map((field: any) => (
                    <div key={field.id} className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border">
                      <span className="text-[10px] text-slate-500 uppercase block">{field.label}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
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
    </div>
  );
}
