import { useState } from 'react';
import { useQuery, useMutation } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Profile, TenantRole, Department } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Users, UserPlus, Pencil, Network, UserX, UserCheck, LayoutGrid, List, KeyRound, Sparkles, Copy, Check, Eye, EyeOff, Lock, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function validatePhoneNumber(phone: string): string | null {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return 'Phone number is required';
  }

  // Remove non-digit characters
  const digits = trimmed.replace(/\D/g, '');

  // Strip leading country code +91 or 0
  let normalized = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    normalized = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    normalized = digits.slice(1);
  }

  if (normalized.length < 10) {
    return `Phone number must be 10 digits (currently ${normalized.length})`;
  }

  if (normalized.length > 10) {
    return `Phone number cannot exceed 10 digits (currently ${normalized.length})`;
  }

  if (!/^[6-9]/.test(normalized)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }

  if (/^(\d)\1{9}$/.test(normalized)) {
    return 'Please enter a valid mobile number (repeated digits not allowed)';
  }

  return null;
}

export function UsersPage() {
  const { tenant, profile } = useAuth();
  const toast = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"profiles"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [viewType, setViewType] = useState<'card' | 'table' | 'tree'>('table');
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
  const [phoneError, setPhoneError] = useState('');

  const currentTenantId = tenant?._id || tenant?.id || profile?.tenant_id;

  // Backend queries
  const users = useQuery(api.profiles.listUsersByTenant, 
    currentTenantId ? { 
      tenant_id: currentTenantId as any,
      is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
    } : "skip"
  );
  
  const departments = useQuery(api.departments.list, currentTenantId ? { tenant_id: currentTenantId as any } : "skip");
  const roles = useQuery(api.roles.list, currentTenantId ? { tenant_id: currentTenantId as any } : "skip");

  // Backend mutations
  const createUserProfileMutation = useMutation(api.profiles.createUserProfile);
  const updateProfileMutation = useMutation(api.profiles.updateProfile);
  const toggleProfileStatusMutation = useMutation(api.profiles.toggleProfileStatus);
  const deleteProfileMutation = useMutation(api.profiles.deleteProfile);
  const resetUserPasswordMutation = useMutation(api.tenants.resetUserPassword);

  const isFreePlan = tenant?.plan_tier === 'free';
  const totalUsersCount = (users as any[]) ? (users as any[]).length : 0;
  const isUserLimitReached = isFreePlan && totalUsersCount >= 5;

  // Reset password states for tenant admins
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const canManagePasswords = !isReadOnly && (
    profile?.role === 'platform_admin' ||
    ['super_admin', 'admin', 'director'].includes(profile?.role || '')
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow digits, spaces, hyphens, and leading +
    val = val.replace(/[^\d+\s-]/g, '');
    if (val.includes('+')) {
      val = (val.startsWith('+') ? '+' : '') + val.replace(/\+/g, '');
    }
    if (val.length > 15) {
      val = val.slice(0, 15);
    }
    setFormData(prev => ({ ...prev, phone: val }));

    if (phoneError) {
      const err = validatePhoneNumber(val);
      setPhoneError(err || '');
      if (!err && error) setError('');
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone.trim()) {
      const err = validatePhoneNumber(formData.phone);
      setPhoneError(err || '');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '', email: '', phone: '', employeeId: '', role: '', roleId: '',
      departmentId: '', reportingManagerId: '', password: '', confirmPassword: '',
      imageUrl: '', dob: '', marriageAnniversary: '', joiningDate: ''
    });
    setEditingUserId(null);
    setPhoneError('');
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditUser = (user: any) => {
    if (isReadOnly) return;
    setEditingUserId(user._id || user.id);
    setPhoneError('');
    setError('');
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
    const targetTenantId = currentTenantId;
    if (isReadOnly || !targetTenantId) {
      setError('Missing tenant identification');
      return;
    }
    setError('');

    // Validate phone number
    const phoneErr = validatePhoneNumber(formData.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      setError(phoneErr);
      toast.error(phoneErr);
      return;
    }

    const cleanDigits = formData.phone.replace(/\D/g, '');
    const normalizedPhone = cleanDigits.length === 12 && cleanDigits.startsWith('91')
      ? cleanDigits.slice(2)
      : (cleanDigits.length === 11 && cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits);

    setIsSubmitting(true);

    try {
      if (editingUserId) {
        await updateProfileMutation({
          id: editingUserId,
          full_name: formData.fullName,
          phone: normalizedPhone,
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
        if (isUserLimitReached) {
          throw new Error('Free Plan limit reached (Maximum 5 users). Please delete an existing user or upgrade to Pro Plan for unlimited users.');
        }
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
        
        await createUserProfileMutation({
          userId: formData.email, // Use email as Simulated Auth ID
          tenant_id: targetTenantId as Id<"tenants">,
          full_name: formData.fullName,
          email: formData.email,
          phone: normalizedPhone,
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
          force_password_change: false,
          password: formData.password
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

  const handleToggleStatus = async (user: Profile) => {
    try {
      await toggleProfileStatusMutation({
        id: user._id as Id<"profiles">,
        is_active: !user.is_active
      });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (user: any) => {
    const userId = user._id || user.id;
    const currentUserId = profile?._id || profile?.id;
    if (userId === currentUserId) {
      toast.error("You cannot delete your own profile.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${user.full_name}"? This action cannot be undone.`)) {
      try {
        await deleteProfileMutation({ id: userId });
        toast.success(`User "${user.full_name}" deleted successfully!`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user.");
      }
    }
  };

  const handleOpenResetPassword = (user: any) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetError('');
    setShowPassword(false);
    setCopiedPassword(false);
    setResetModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const rawName = (selectedUserForReset?.full_name?.split(' ')[0] || 'User')
      .replace(/[^a-zA-Z]/g, '');
    const capitalized = (rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()) || 'User';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const gen = `${capitalized}@${randomDigits}`;
    setNewPassword(gen);
    setConfirmNewPassword(gen);
    setResetError('');
    setShowPassword(true);
  };

  const handleCopyGeneratedPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    toast.success('Password copied to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    setResetError('');

    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }
    if (trimmed !== confirmNewPassword.trim()) {
      setResetError('Passwords do not match');
      return;
    }

    setIsResetting(true);
    try {
      await resetUserPasswordMutation({
        userId: selectedUserForReset._id || selectedUserForReset.id || selectedUserForReset.email,
        newPassword: trimmed,
      });
      toast.success(`Password for ${selectedUserForReset.full_name || selectedUserForReset.email} reset successfully!`);
      setResetModalOpen(false);
      setSelectedUserForReset(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const msg = err?.message || 'Failed to reset password';
      setResetError(msg);
      toast.error(msg);
    } finally {
      setIsResetting(false);
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
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 mr-2 shadow-sm">
            <button onClick={() => setViewType('card')} className={`p-1.5 rounded-md transition-all ${viewType === 'card' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewType('table')} className={`p-1.5 rounded-md transition-all ${viewType === 'table' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
            <button onClick={() => setViewType('tree')} className={`p-1.5 rounded-md transition-all ${viewType === 'tree' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Network size={18} /></button>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-40 h-[42px]"
            options={[{ value: 'active', label: 'Active Users' }, { value: 'inactive', label: 'Inactive Users' }, { value: 'all', label: 'All Users' }]}
          />
          {!isReadOnly && (
            <Button 
              variant={isUserLimitReached ? "outline" : "primary"} 
              onClick={() => { 
                if (isUserLimitReached) {
                  toast.error("Free Plan limit reached (Maximum 5 users). Please delete an existing user or upgrade to Pro Plan for unlimited users.");
                  return;
                }
                resetForm(); 
                setIsModalOpen(true); 
              }} 
              className={`h-[42px] whitespace-nowrap ${isUserLimitReached ? 'border-amber-400 text-amber-600 dark:text-amber-400' : ''}`}
            >
              {isUserLimitReached ? <Lock size={16} className="mr-2" /> : <UserPlus size={18} className="mr-2" />}
              Add User {isFreePlan && `(${totalUsersCount}/5)`}
            </Button>
          )}
        </div>
      </div>

      {!users ? (
        <LoadingSpinner size="lg" className="min-h-[400px]" />
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No users found.</div>
      ) : viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(users as any[]).map((user: any) => (
            <Card key={user._id} className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl transition-all group flex flex-col border-b-4 border-b-transparent hover:border-b-blue-500">
              <CardHeader className="bg-slate-50 dark:bg-white/5 pb-4">
                <div className="flex items-start justify-between">
                  {user.image_url ? (
                    <img src={user.image_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-lg shadow-sm border-2 border-white">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <ActionMenu actions={[
                      { label: 'Edit', icon: Pencil, onClick: () => handleEditUser(user) },
                      ...(canManagePasswords ? [
                        { label: 'Reset Password', icon: KeyRound, onClick: () => handleOpenResetPassword(user) }
                      ] : []),
                      { 
                        label: user.is_active ? 'Deactivate' : 'Activate', 
                        icon: user.is_active ? UserX : UserCheck, 
                        onClick: () => handleToggleStatus(user) 
                      },
                      {
                        label: 'Delete User',
                        icon: Trash2,
                        variant: 'danger',
                        onClick: () => handleDeleteUser(user)
                      }
                    ]} />
                  </div>
                </div>
                <div className="mt-4">
                  <CardTitle className="text-xl font-bold truncate">{user.full_name}</CardTitle>
                  <CardDescription className="text-xs font-mono font-medium text-slate-400 mt-0.5">Emp ID: {user.employee_id}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-6 flex-grow space-y-4">
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Role / Dept</span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="outline">{(roles as TenantRole[] | undefined)?.find((r: TenantRole) => r._id === user.role_id)?.name || user.role}</Badge>
                    <Badge variant="secondary">{(departments as Department[] | undefined)?.find((d: Department) => d._id === user.department_id)?.name || 'No Dept'}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Contact Details</span>
                  <div className="truncate text-xs">Email: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.email}</span></div>
                  <div className="truncate text-xs">Phone: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.phone || '-'}</span></div>
                </div>
              </CardContent>
              <CardContent className="pt-2 pb-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                <Badge variant={user.is_active ? 'success' : 'default'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewType === 'tree' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network size={20} />
              <CardTitle>Organization Chart</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="org-tree-container">
               {/* Simplified Tree view for now */}
               <div className="text-center p-4 text-gray-500">Tree view active with {users.length} users.</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Users size={20} /><CardTitle>Users List</CardTitle></div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as any[]).map((user: any) => (
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
                       <ActionMenu actions={[
                         { label: 'Edit', icon: Pencil, onClick: () => handleEditUser(user) },
                         ...(canManagePasswords ? [
                           { label: 'Reset Password', icon: KeyRound, onClick: () => handleOpenResetPassword(user) }
                         ] : []),
                         { 
                           label: user.is_active ? 'Deactivate' : 'Activate', 
                           icon: user.is_active ? UserX : UserCheck, 
                           onClick: () => handleToggleStatus(user) 
                         },
                         {
                           label: 'Delete User',
                           icon: Trash2,
                           variant: 'danger',
                           onClick: () => handleDeleteUser(user)
                         }
                       ]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
              <Input 
                type="tel"
                label="Phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handlePhoneChange} 
                onBlur={handlePhoneBlur}
                error={phoneError}
                placeholder="e.g. 9876543210"
                helperText={!phoneError ? "10-digit mobile number" : undefined}
                required 
              />
              <Select
                label="Role"
                name="roleId"
                value={formData.roleId || formData.role}
                onChange={(e) => {
                  const rId = e.target.value;
                  const roleObj = (roles as any[])?.find(r => r._id === rId);
                  setFormData(prev => ({ 
                    ...prev, 
                    roleId: roleObj ? rId : '', 
                    role: roleObj ? roleObj.name : rId 
                  }));
                }}
                required
                options={
                  (roles && roles.length > 0)
                    ? roles.map((r: any) => ({ value: r._id, label: r.name }))
                    : [
                        { value: 'sales_executive', label: 'Sales Executive' },
                        { value: 'team_leader', label: 'Team Leader' },
                        { value: 'sales_manager', label: 'Sales Manager' },
                        { value: 'admin', label: 'Admin' },
                        { value: 'accountant', label: 'Accountant' },
                        { value: 'receptionist', label: 'Receptionist' },
                        { value: 'driver', label: 'Driver' },
                      ]
                }
              />
              <Select
                label="Department"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'None / General' },
                  ...((departments as any[])?.map(d => ({ value: d._id, label: d.name })) || [])
                ]}
              />
              <Select
                label="Reporting Manager"
                name="reportingManagerId"
                value={formData.reportingManagerId}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'None' },
                  ...((users as Profile[] | undefined) || [])
                    .filter(u => u._id !== editingUserId && u.is_active)
                    .map(u => ({ value: u._id, label: `${u.full_name} (${u.role})` }))
                ]}
              />
              {!editingUserId && (
                <>
                  <Input type="password" label="Password" name="password" value={formData.password} onChange={handleInputChange} required />
                  <Input type="password" label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
                </>
              )}
           </div>
           <ModalFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{editingUserId ? "Update" : "Create"}</Button>
           </ModalFooter>
        </form>
      </Modal>

      {/* Reset Password Modal for Tenant Admins */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => !isResetting && setResetModalOpen(false)}
        title="Reset User Password"
        size="md"
      >
        <form onSubmit={handleConfirmResetPassword} className="space-y-5">
          {selectedUserForReset && (
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400">
                  {selectedUserForReset.full_name ? selectedUserForReset.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    {selectedUserForReset.full_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedUserForReset.email} {selectedUserForReset.employee_id ? `• ${selectedUserForReset.employee_id}` : ''}
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                {(roles as TenantRole[] | undefined)?.find((r: TenantRole) => r._id === selectedUserForReset.role_id)?.name || selectedUserForReset.role}
              </Badge>
            </div>
          )}

          {resetError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
              {resetError}
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              New Password Credentials
            </span>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Sparkles size={14} />
              Generate Password
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
                className="w-full h-11 px-3.5 pr-20 bg-white dark:bg-[#0E1A15] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyGeneratedPassword}
                    title="Copy password"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {copiedPassword ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={6}
              className="w-full h-11 px-3.5 bg-white dark:bg-[#0E1A15] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share this new password with the user so they can sign in immediately.
          </p>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetModalOpen(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isResetting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Update Password
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
