import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDialog } from '../contexts/DialogContext';
import { Department } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Briefcase, Plus, Trash2, Pencil } from 'lucide-react';


import { useAuth } from '../contexts/AuthContext';

export function DepartmentsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);

  const isReadOnly = profile?.role === 'director';

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingDepartmentId(null);
  };

  const handleEditDepartment = (dept: Department) => {
    if (isReadOnly) return;
    setEditingDepartmentId(dept.id);
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
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      if (editingDepartmentId) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            name: formData.name,
            description: formData.description
          })
          .eq('id', editingDepartmentId);

        if (error) throw error;
        await dialog.alert('Department updated successfully!', { variant: 'success', title: 'Success' });
      } else {
        // Create new department
        const { error } = await supabase.from('departments').insert({
          name: formData.name,
          description: formData.description,
          is_active: true
        });

        if (error) throw error;
        await dialog.alert('Department added successfully!', { variant: 'success', title: 'Success' });
      }

      handleCloseModal();
      loadDepartments();
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
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      loadDepartments();
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
        {!isReadOnly && (
          <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }} className="hidden md:flex">
            <Plus size={18} className="mr-2" />
            Add Department
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase size={20} />
            <CardTitle>All Departments</CardTitle>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={dept.is_active ? 'success' : 'default'}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {!isReadOnly && (
                        <TableCell>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditDepartment(dept)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10">
                            <Pencil size={16} />
                            </Button>
                            <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                            onClick={() => handleDelete(dept.id)}
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
