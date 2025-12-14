import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { logActivity } from '../lib/logger';
import { Profile, Department } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Users, UserPlus, Trash2, Pencil, Ban, CheckCircle, Lock } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function UsersPage() {
  const { user: currentUser, profile } = useAuth();
  const dialog = useDialog();
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const isReadOnly = profile?.role === 'director';

  // Password Reset State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: '',
    departmentId: '',
    reportingManagerId: '',
    password: '',
    confirmPassword: '',
    imageUrl: '',
    dob: '',
    marriageAnniversary: '',
    joiningDate: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([loadUsers(), loadDepartments()]);
  }, [statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*');

    if (statusFilter !== 'all') {
      query = query.eq('is_active', statusFilter === 'active');
    }

    const { data } = await query.order('full_name');
    if (data) setUsers(data);
    setLoading(false);
  };

  const loadDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').eq('is_active', true).order('name');
    if (data) setDepartments(data);
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'super_admin') return 'danger';
    if (role === 'admin') return 'warning';
    if (role === 'director') return 'default'; // New Badge Variant for Director
    if (role === 'team_leader') return 'info';
    if (role === 'sales_executive') return 'success';
    if (role === 'crm_staff') return 'info';
    if (role === 'accountant') return 'warning';
    if (role === 'driver') return 'default';
    if (role === 'receptionist') return 'success';
    return 'default';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      employeeId: '',
      role: '',
      departmentId: '',
      reportingManagerId: '',
      password: '',
      confirmPassword: '',
      imageUrl: '',
      dob: '',
      marriageAnniversary: '',
      joiningDate: ''
    });
    setEditingUserId(null);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditUser = (user: Profile) => {
    if (isReadOnly) return;
    setEditingUserId(user.id);
    setFormData({
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || '',
      employeeId: user.employee_id,
      role: user.role,
      departmentId: user.department_id || '',
      reportingManagerId: user.reporting_manager_id || '',
      password: '', // Password not editable directly here
      confirmPassword: '',
      imageUrl: user.image_url || '',
      dob: user.dob || '',
      marriageAnniversary: user.marriage_anniversary || '',
      joiningDate: user.joining_date || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenResetPassword = (userId: string) => {
    if (isReadOnly) return;
    setResetPasswordUserId(userId);
    setTemporaryPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId || isReadOnly) return;
    setIsSubmitting(true);
    setError('');

    try {
      // We need to use the service role key or a specialized function to update ANOTHER user's password usually.
      // However, standard supabase auth doesn't allow admin to update another user's password via Client SDK easily without sending an email.
      // BUT, since we have 'admin' rights and RLS, we can technically only update 'profiles' data.
      // Updating AUTH password requires admin API (Service Role) typically.
      // If we don't have Edge Functions, we can't securely update another user's password via Client SDK 'updateUser' because that updates the CURRENT user.
      // We must use 'admin.updateUserById' which is only available server-side.

      // WORKAROUND Logic for this environment constraint:
      // We can't strictly "Reset Password" of another user securely client-side without their email.
      // We CAN trigger a password reset email: `supabase.auth.resetPasswordForEmail(email)`.
      // The prompt asks to "Generate temporary passwords". This implies setting it directly.
      // This is typically done via a Backend function.
      // If I cannot change the password directly, I will implement the UI and logic to Set the Flag, 
      // and ideally we would call an Edge Function. 
      // Since I can't deploy Edge Function here easily, I will implement the UI and update the `force_password_change` flag in database.
      // The actual Auth password change might fail without a backend. 
      // I will add a comment explaining this limitation or try to use `tempSupabase` if the user provided a SERVICE_ROLE_KEY? They didn't.

      // I'll update the `force_password_change` flag. And I'll attempt to update password if possible (it won't be from client for another user).

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ force_password_change: true })
        .eq('id', resetPasswordUserId);

      if (profileError) throw profileError;

      // Log it
      await logActivity('PASSWORD_RESET', `Password reset initiated for user ${resetPasswordUserId}`);

      await dialog.alert('User flagged for forced password change. (Note: Actual password reset requires backend Admin API)', {
        variant: 'success',
        title: 'Reset Initiated'
      });

      setIsResetPasswordModalOpen(false);
      setResetPasswordUserId(null);
      setTemporaryPassword('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError('');
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone: formData.phone || null,
            role: formData.role as any,
            department_id: formData.departmentId || null,
            reporting_manager_id: formData.reportingManagerId || null,
            image_url: formData.imageUrl || null,
            dob: formData.dob || null,
            marriage_anniversary: formData.marriageAnniversary || null,
            joining_date: formData.joiningDate || null
          })
          .eq('id', editingUserId);

        if (updateError) throw updateError;

        await logActivity('USER_UPDATED', `User profile updated: ${formData.fullName}`);

        await dialog.alert('User updated successfully!', { variant: 'success', title: 'Success' });
      } else {
        // Create new user
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // 1. Pre-validation: Check if user exists in PROFILES (Duplicate check)
        const { data: existingProfiles, error: checkError } = await supabase
          .from('profiles')
          .select('email, employee_id, full_name')
          .or(`email.eq.${formData.email},employee_id.eq.${formData.employeeId}`);

        if (checkError) throw checkError;

        if (existingProfiles && existingProfiles.length > 0) {
          const match = existingProfiles.find(p => p.email === formData.email)
            || existingProfiles.find(p => p.employee_id === formData.employeeId);

          if (match) {
            if (match.email === formData.email) throw new Error('A user profile with this email already exists.');
            if (match.employee_id === formData.employeeId) throw new Error(`Employee ID ${formData.employeeId} is already assigned to ${match.full_name || 'another user'}.`);
          }
        }

        // Create a temporary client to avoid signing out the current user
        const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            }
          }
        );

        // 2. Create Auth User (Trigger will handle Profile creation)
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              employee_id: formData.employeeId,
              role: formData.role,
              department_id: formData.departmentId,
              reporting_manager_id: formData.reportingManagerId,
              imageUrl: formData.imageUrl, // Matches trigger JSON mapping
              phone: formData.phone,
              dob: formData.dob,
              marriage_anniversary: formData.marriageAnniversary,
              joining_date: formData.joiningDate
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user account');

        // Wait a short moment for the background trigger to complete (optional)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Explicitly Create/Update Profile Record 
        // We use upsert to ensure the profile exists. This acts as a fallback if the 
        // database trigger does not exist (e.g. migration not run), and is safe 
        // if the trigger DID run (it just updates the same data).
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          employee_id: formData.employeeId,
          role: formData.role,
          department_id: formData.departmentId || null,
          reporting_manager_id: formData.reportingManagerId || null,
          image_url: formData.imageUrl || null,
          dob: formData.dob || null,
          marriage_anniversary: formData.marriageAnniversary || null,
          joining_date: formData.joiningDate || null,
          is_active: true,
          force_password_change: true
        });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          // If upsert fails, it's a critical error where Auth exists but Profile might not.
          throw new Error('User created in Auth but failed to save Profile: ' + profileError.message);
        }

        await logActivity('USER_CREATED', `New user created: ${formData.fullName} (${formData.role})`);

        await dialog.alert('User added successfully!', { variant: 'success', title: 'Success' });
      }

      // Success cleanup
      setIsModalOpen(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      let message = err.message || 'An error occurred while saving the user';

      // Detect "User already registered" Auth Error which implies an Orphan (since we passed the Profile check above)
      if (message.toLowerCase().includes('user already registered') || message.toLowerCase().includes('already been registered')) {
        message = `Unable to create account: The email '${formData.email}' is already registered in the authentication system, but no user profile was found. This indicates an orphaned account. Please contact support.`;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: Profile) => {
    if (isReadOnly) return;
    const action = user.is_active ? 'deactivate' : 'reactivate';
    const confirmed = await dialog.confirm(
      `Are you sure you want to ${action} ${user.full_name}? ${action === 'deactivate' ? 'They will no longer be able to log in.' : 'They will regain access to the system.'}`,
      {
        variant: action === 'deactivate' ? 'danger' : 'success',
        confirmText: action === 'deactivate' ? 'Deactivate' : 'Reactivate',
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`
      }
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      // Log the action
      await logActivity(`USER_${action.toUpperCase()}D`, `User ${user.full_name} was ${action}d`);

      loadUsers();
      await dialog.alert(`User ${action}d successfully.`, { variant: 'success', title: 'Success' });
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      await dialog.alert(`Failed to ${action} user.`, { variant: 'danger', title: 'Error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    const confirmed = await dialog.confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone and should only be used for erroneous entries.', {
      variant: 'danger',
      confirmText: 'Delete Permanently',
      title: 'Delete User'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      loadUsers();
      await dialog.alert('User deleted.', { variant: 'success', title: 'Deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      await dialog.alert('Failed to delete user.', { variant: 'danger', title: 'Error' });
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
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-40 h-[42px]"
            options={[
              { value: 'active', label: 'Active Users' },
              { value: 'inactive', label: 'Inactive Users' },
              { value: 'all', label: 'All Users' },
            ]}
          />
          {!isReadOnly && (
            <Button
              variant="primary"
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="h-[42px] whitespace-nowrap"
            >
              <UserPlus size={18} className="mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users size={20} />
            <CardTitle>Users List</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner size="lg" className="min-h-[400px]" />
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={!user.is_active ? 'bg-gray-50' : ''}>
                    <TableCell className="font-mono text-xs">{user.employee_id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.image_url && <img src={user.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
                        <span className={!user.is_active ? 'text-gray-500' : ''}>{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.is_active ? 'success' : 'default'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.force_password_change && (
                          <Badge variant="warning" className="text-[10px] px-1 py-0 h-5">Reset</Badge>
                        )}
                      </div>
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip content="Reset Password">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenResetPassword(user.id)}
                              className="text-gray-600 hover:text-[#1673FF] hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
                            >
                              <Lock size={16} />
                            </Button>
                          </Tooltip>

                          <Tooltip content={user.is_active ? "Deactivate User" : "Reactivate User"}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              className={user.is_active ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-500/10" : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-500/10"}
                            >
                              {user.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                            </Button>
                          </Tooltip>

                          <Tooltip content="Edit Details">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10"
                            >
                              <Pencil size={16} />
                            </Button>
                          </Tooltip>

                          <Tooltip content="Delete Permanently">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </Tooltip>
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUserId ? "Edit User" : "Add New User"}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder="e.g. John Doe"
            />
            <Input
              label="Employee ID"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
              placeholder="e.g. EMP001"
              disabled={!!editingUserId}
            />
            <Input
              type="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="john@example.com"
              disabled={!!editingUserId}
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 98765 43210"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
              <Input
                type="date"
                label="Date of Birth"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full"
              />
              <Input
                type="date"
                label="Marriage Anniversary"
                name="marriageAnniversary"
                value={formData.marriageAnniversary}
                onChange={handleInputChange}
                className="w-full"
              />
              <Input
                type="date"
                label="Date of Joining"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              options={[
                { value: 'admin', label: 'Admin (Access & Controls)' },
                { value: 'director', label: 'Director (Read-Only Access)' },
                { value: 'sales_executive', label: 'Sales Executive' },
                { value: 'accountant', label: 'Accountant' },
                { value: 'crm_staff', label: 'CRM (Customer Relationship Manager)' },
                { value: 'team_leader', label: 'Team Leader – Sales' },
                { value: 'driver', label: 'Driver' },
                { value: 'receptionist', label: 'Receptionist' },
              ]}
            />
            <Select
              label="Department"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              required
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
            <Select
              label="Reporting Manager"
              name="reportingManagerId"
              value={formData.reportingManagerId}
              onChange={handleInputChange}
              options={users.filter(u => u.id !== editingUserId).map(u => ({ value: u.id, label: u.full_name }))}
            />
            <Input
              label="Profile Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://..."
            />

            {!editingUserId && (
              <>
                <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100 flex items-start gap-2">
                  <Lock size={16} className="mt-0.5 shrink-0" />
                  <p>New users will be required to change their password upon first login.</p>
                </div>
                <Input
                  type="password"
                  label="Initial Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="********"
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="********"
                />
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

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
              {editingUserId ? (
                <>
                  <span className="hidden sm:inline">Update User</span>
                  <span className="sm:hidden">Update</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Create User</span>
                  <span className="sm:hidden">Create</span>
                </>
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset User Password"
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Resetting the password will require the user to change it upon their next login.
            </p>
          </div>

          <Input
            label="Temporary Password"
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            placeholder="Enter temporary password"
          // In a real app we might not set it here directly without backend, but we capture intent.
          // For now, this input is symbolic if we can't force update via client.
          // I will disable it or just treat it as "Admin sets this, communicates OOB".
          />
          <p className="text-xs text-gray-500 italic">
            Note: Due to system security restrictions, this action only flags the account for reset. Please manually communicate the temporary password if you have backend access to set it, or use the email reset flow.
          </p>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Confirm Reset</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

