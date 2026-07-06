import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useDialog } from '../contexts/DialogContext';
import { Department } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Briefcase, Plus, Trash2, Pencil, Loader2, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ActionMenu } from '../components/ui/ActionMenu';

export function DepartmentsPage() {
  const { profile, tenant } = useAuth();
  const dialog = useDialog();
  
  const [viewType, setViewType] = useState<'card' | 'list'>('list');
  
  const departmentsData = useQuery(api.departments.list, 
    tenant?._id ? { tenant_id: tenant._id } : "skip" as any
  );
  const departments = (departmentsData || []) as Department[];
  
  const createDept = useMutation(api.departments.create);
  const updateDept = useMutation(api.departments.update);
  const deleteDept = useMutation(api.departments.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);

  const isReadOnly = profile?.role === 'director';

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingDepartmentId(null);
  };

  const handleEditDepartment = (dept: Department) => {
    if (isReadOnly) return;
    setEditingDepartmentId(dept._id);
    setFormData({
      name: dept.name,
      description: dept.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !tenant) return;
    setIsSubmitting(true);
    try {
      if (editingDepartmentId) {
        await updateDept({
          id: editingDepartmentId as Id<"departments">,
          name: formData.name,
          description: formData.description
        });
        await dialog.alert('Department updated successfully!', { variant: 'success', title: 'Success' });
      } else {
        await createDept({
          tenant_id: tenant._id,
          name: formData.name,
          description: formData.description,
        });
        await dialog.alert('Department added successfully!', { variant: 'success', title: 'Success' });
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving department:', error);
      await dialog.alert('Failed to save department', { variant: 'danger', title: 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    const confirmed = await dialog.confirm('Are you sure you want to delete this department?', {
      variant: 'danger',
      confirmText: 'Delete Department',
      title: 'Delete Department'
    });

    if (!confirmed) return;

    try {
      await deleteDept({ id: id as Id<"departments"> });
      await dialog.alert('Department deleted.', { variant: 'success', title: 'Deleted' });
    } catch (error) {
      console.error('Error deleting department:', error);
      await dialog.alert('Failed to delete department. It might be referenced by other records.', { variant: 'danger', title: 'Error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">Departments</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Manage organizational departments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 mr-2 shadow-sm">
            <button onClick={() => setViewType('card')} className={`p-1.5 rounded-md transition-all ${viewType === 'card' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewType('list')} className={`p-1.5 rounded-md transition-all ${viewType === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
          </div>
          {!isReadOnly && (
            <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }} className="hidden md:flex">
              <Plus size={18} className="mr-2" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {departmentsData === undefined ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      ) : viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept._id} className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-indigo-500">
              <CardHeader className="bg-slate-50 dark:bg-white/5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl">
                    <Briefcase size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  {!isReadOnly && (
                    <div>
                      <ActionMenu actions={[
                        { label: 'Edit', icon: Pencil, onClick: () => handleEditDepartment(dept) },
                        { label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => handleDelete(dept._id) }
                      ]} />
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <CardTitle className="text-xl font-bold truncate">{dept.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">{dept.description || 'No description provided.'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                <Badge variant={dept.is_active ? 'success' : 'default'}>
                  {dept.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase size={20} />
              <CardTitle>All Departments</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept._id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={dept.is_active ? 'success' : 'default'}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {!isReadOnly && (
                        <TableCell>
                          <ActionMenu actions={[
                            { label: 'Edit', icon: Pencil, onClick: () => handleEditDepartment(dept) },
                            { label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => handleDelete(dept._id) }
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
        title={editingDepartmentId ? "Edit Department" : "Add Department"}
      >
        <form onSubmit={handleSaveDepartment} className="space-y-6">
          <Input
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="e.g. Marketing"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Department responsibilities..."
          />
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
              {editingDepartmentId ? (
                <>
                  <span className="hidden md:inline">Update Department</span>
                  <span className="md:hidden">Update</span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">Create Department</span>
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
