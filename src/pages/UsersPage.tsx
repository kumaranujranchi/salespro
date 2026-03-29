import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Profile, TenantRole, Department } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Users, UserPlus, Pencil, Network } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function UsersPage() {
  const { tenant, profile } = useAuth();
  const toast = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"profiles"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [viewType, setViewType] = useState<'tree' | 'table'>('table');
  const isReadOnly = false; // Simplified for now

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: '',
    roleId: '' as string | Id<"tenant_roles">,
    departmentId: '' as string | Id<"departments">,
    reportingManagerId: '' as string | Id<"profiles">,
    password: '',
    confirmPassword: '',
    imageUrl: '',
    dob: '',
    marriageAnniversary: '',
    joiningDate: ''
  });

  const [error, setError] = useState('');

  // Convex Queries
  const users = useQuery(api.profiles.listUsersByTenant, 
    tenant?._id ? { 
      tenant_id: tenant._id,
      is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
    } : "skip"
  );
  
  const departments = useQuery(api.departments.list, tenant?._id ? { tenant_id: tenant._id } : "skip");
  const roles = useQuery(api.roles.list, tenant?._id ? { tenant_id: tenant._id } : "skip");

  // Convex Mutations
  const createUserProfileMutation = useMutation(api.profiles.createUserProfile);
  const updateProfileMutation = useMutation(api.profiles.updateProfile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '', email: '', phone: '', employeeId: '', role: '', roleId: '',
      departmentId: '', reportingManagerId: '', password: '', confirmPassword: '',
      imageUrl: '', dob: '', marriageAnniversary: '', joiningDate: ''
    });
    setEditingUserId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditUser = (user: any) => {
    if (isReadOnly) return;
    setEditingUserId(user._id || user.id);
    setFormData({
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || '',
      employeeId: user.employee_id,
      role: user.role,
      roleId: user.role_id || '',
      departmentId: user.department_id || '',
      reportingManagerId: user.reporting_manager_id || '',
      password: '',
      confirmPassword: '',
      imageUrl: user.image_url || '',
      dob: user.dob || '',
      marriageAnniversary: user.marriage_anniversary || '',
      joiningDate: user.joining_date || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !profile?.tenant_id) return;
    setError('');
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        await updateProfileMutation({
          id: editingUserId,
          full_name: formData.fullName,
          phone: formData.phone || null,
          role: formData.role,
          role_id: formData.roleId as Id<"tenant_roles"> || null,
          department_id: formData.departmentId as Id<"departments"> || null,
          reporting_manager_id: formData.reportingManagerId as Id<"profiles"> || null,
          image_url: formData.imageUrl || null,
          dob: formData.dob || null,
          marriage_anniversary: formData.marriageAnniversary || null,
          joining_date: formData.joiningDate || null
        });
        toast.success("User updated successfully!");
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
        
        // This is where we would create Auth User in a real app.
        // For simulation, we just create the Profile in Convex.
        await createUserProfileMutation({
          userId: `sim_${Math.random().toString(36).substr(2, 9)}`, // Simulated Auth ID
          tenant_id: profile.tenant_id as Id<"tenants">,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          employee_id: formData.employeeId,
          role: formData.role,
          role_id: formData.roleId as Id<"tenant_roles"> || null,
          department_id: formData.departmentId as Id<"departments"> || null,
          reporting_manager_id: formData.reportingManagerId as Id<"profiles"> || null,
          image_url: formData.imageUrl || null,
          dob: formData.dob || null,
          marriage_anniversary: formData.marriageAnniversary || null,
          joining_date: formData.joiningDate || null,
          is_active: true,
          force_password_change: true
        });
        toast.success("User created successfully!");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage team members and access control</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 mr-2">
            <button onClick={() => setViewType('tree')} className={`p-1.5 rounded-md transition-all ${viewType === 'tree' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Network size={18} /></button>
            <button onClick={() => setViewType('table')} className={`p-1.5 rounded-md transition-all ${viewType === 'table' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Users size={18} /></button>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-40 h-[42px]"
            options={[{ value: 'active', label: 'Active Users' }, { value: 'inactive', label: 'Inactive Users' }, { value: 'all', label: 'All Users' }]}
          />
          {!isReadOnly && <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-[42px] whitespace-nowrap"><UserPlus size={18} className="mr-2" />Add User</Button>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Users size={20} /><CardTitle>Users List</CardTitle></div>
        </CardHeader>
        <CardContent>
          {!users ? (
            <LoadingSpinner size="lg" className="min-h-[400px]" />
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : viewType === 'tree' ? (
            <div className="org-tree-container">
               {/* Simplified Tree view for now */}
               <div className="text-center p-4">Tree view active with {users.length} users.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as Profile[]).map((user: Profile) => (
                  <TableRow key={user._id} className={!user.is_active ? 'bg-gray-50' : ''}>
                    <TableCell className="font-mono text-xs">{user.employee_id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.image_url && <img src={user.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
                        <span className={!user.is_active ? 'text-gray-500' : ''}>{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{(roles as TenantRole[] | undefined)?.find((r: TenantRole) => r._id === user.role_id)?.name || user.role}</Badge>
                    </TableCell>
                    <TableCell><Badge variant={user.is_active ? 'success' : 'default'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right">
                       <ActionMenu actions={[{ label: 'Edit', icon: Pencil, onClick: () => handleEditUser(user) }]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUserId ? "Edit User" : "Add New User"} size="lg">
        <form onSubmit={handleSaveUser} className="space-y-6">
           {error && (
             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
               {error}
             </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
              <Input label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required />
              <Input type="email" label="Email" name="email" value={formData.email} onChange={handleInputChange} required />
              <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
              <Select
                label="Role"
                name="roleId"
                value={formData.roleId}
                onChange={(e) => {
                  const rId = e.target.value;
                  const roleObj = roles?.find(r => r._id === rId);
                  setFormData(prev => ({ ...prev, roleId: rId, role: roleObj?.name || '' }));
                }}
                required
                options={(roles as TenantRole[] | undefined)?.map((r: TenantRole) => ({ value: r._id, label: r.name })) || []}
              />
              <Select
                label="Department"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                required
                options={(departments as Department[] | undefined)?.map((d: Department) => ({ value: d._id, label: d.name })) || []}
              />
           </div>
           <ModalFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{editingUserId ? "Update" : "Create"}</Button>
           </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
