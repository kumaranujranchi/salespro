import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDialog } from '../contexts/DialogContext';
import { useToast } from '../contexts/ToastContext';
import { Project } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Building, Plus, ExternalLink, Trash2, Pencil, X } from 'lucide-react';


import { useAuth } from '../contexts/AuthContext';

export function ProjectsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('name');
    if (data) setProjects(data);
    setLoading(false);
  };

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

  const handleEditProject = (project: Project) => {
    if (isReadOnly) return;
    setEditingProjectId(project.id);
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
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploadingImage(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      if (editingProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            address: formData.address,
            google_maps_url: formData.googleMapsUrl || null,
            project_type: formData.projectType,
            image_url: formData.imageUrl || null,
            status: formData.status
          })
          .eq('id', editingProjectId);

        if (error) throw error;
        toast.success('Project updated successfully!');
      } else {
        // Create new project
        const { error } = await supabase.from('projects').insert({
          name: formData.name,
          address: formData.address,
          google_maps_url: formData.googleMapsUrl || null,
          project_type: formData.projectType,
          image_url: formData.imageUrl || null,
          status: formData.status,
          is_active: formData.status === 'Running', // Sync is_active with status
          site_photos: [], // Initialize as empty array
          metadata: {}
        });

        if (error) throw error;
        toast.success('Project added successfully!');
      }

      handleCloseModal();
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    const confirmed = await dialog.confirm('Are you sure you want to delete this project?', {
      variant: 'danger',
      confirmText: 'Delete Project',
      title: 'Delete Project'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      loadProjects();
      toast.success('Project deleted.');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. It might be referenced by other records.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Manage property projects and listings</p>
        </div>
        {!isReadOnly && (
          <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }} className="hidden md:flex">
            <Plus size={18} className="mr-2" />
            Add Project
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building size={20} />
            <CardTitle>All Projects</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1673FF] border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
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
                    {!isReadOnly && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10">
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
            {/* ... */}
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
              {editingProjectId ? (
                <>
                  <span className="hidden md:inline">Update Project</span>
                  <span className="md:hidden">Update</span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">Create Project</span>
                  <span className="md:hidden">Create</span>
                </>
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
