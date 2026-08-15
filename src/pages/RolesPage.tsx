import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { TenantRole, RolePermissions } from '../types/database';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Lock,
  Eye,
  LayoutDashboard,
  Users as UsersIcon,
  Building,
  FileText,
  Clock,
  Award,
  TrendingUp,
  Megaphone,
  Contact,
  Briefcase,
  Zap,
  HelpCircle,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales & Trends', icon: TrendingUp },
  { id: 'crm', label: 'CRM / Leads', icon: UsersIcon },
  { id: 'inventory', label: 'Inventory / Projects', icon: Building },
  { id: 'site_visits', label: 'Site Visits', icon: Clock },
  { id: 'incentives', label: 'Incentives & Targets', icon: Award },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'directory', label: 'Directory / Contacts', icon: Contact },
  { id: 'users', label: 'User Management', icon: UsersIcon },
  { id: 'departments', label: 'Departments', icon: Briefcase },
  { id: 'roles', label: 'Role Management', icon: Shield },
  { id: 'subscription', label: 'Subscription & Billing', icon: Zap },
  { id: 'support', label: 'Help & Support', icon: HelpCircle },
];

const DASHBOARD_WIDGETS = [
  { id: 'kpi_cards', label: 'KPI Statistics Cards' },
  { id: 'project_performance', label: 'Project-wise Performance' },
  { id: 'leaderboard', label: 'Sales Leaderboard' },
  { id: 'upcoming_events', label: 'Birthdays & Events' },
  { id: 'recent_activity', label: 'Recent Activity Feed' },
];

const SALES_PERSPECTIVES: { id: 'none' | 'self' | 'team' | 'overall'; label: string; description: string }[] = [
  { id: 'none', label: 'No Sales Data', description: 'Hide all sales metrics' },
  { id: 'self', label: 'Self Sales Only', description: 'Show only user\'s own sales' },
  { id: 'team', label: 'Team Sales', description: 'Show sales of reporting team members' },
  { id: 'overall', label: 'Overall Sales', description: 'Show total company sales' },
];

export function RolesPage() {
  const { tenant, profile, loading } = useAuth();
  
  const rolesData = useQuery(api.roles.list, 
    tenant?._id ? { tenant_id: tenant._id as any } : "skip"
  );
  const roles = (rolesData || []) as any[];
  
  const createRole = useMutation(api.roles.create);
  const updateRole = useMutation(api.roles.update);
  const deleteRole = useMutation(api.roles.remove);

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewType, setViewType] = useState<'card' | 'list'>('card');
  const [selectedRole, setSelectedRole] = useState<TenantRole | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      menu: MENU_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'none' }), {}),
      dashboard: {
        ...DASHBOARD_WIDGETS.reduce((acc, item) => ({ ...acc, [item.id]: false }), {}),
        sales_view: 'none'
      } as RolePermissions['dashboard'],
    } as RolePermissions
  });

  const handleEditRole = (role: TenantRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions
    });
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: {
        menu: MENU_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'none' }), {}),
        dashboard: {
          ...DASHBOARD_WIDGETS.reduce((acc, item) => ({ ...acc, [item.id]: false }), {}),
          sales_view: 'none'
        },
      }
    });
    setIsEditorOpen(true);
  };

  async function handleSaveRole() {
    try {
      if (!tenant?._id || !formData.name) return;

      if (selectedRole) {
        await updateRole({
          id: selectedRole._id as Id<"tenant_roles">,
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
      } else {
        await createRole({
          tenant_id: tenant._id as any,
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
      }

      setIsEditorOpen(false);
    } catch (err) {
      console.error('Error saving role:', err);
      alert('Failed to save role. Check if name is unique.');
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole || selectedRole.is_system) return;
    try {
      await deleteRole({ id: selectedRole._id as Id<"tenant_roles"> });
      setDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting role:', err);
    }
  }

  // Wait for auth to fully resolve before showing access denied
  if (loading || profile === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Lock size={48} className="text-slate-400" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500">Only Super Admins can manage roles.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-emerald-600" /> Role Management
          </h1>
          <p className="text-slate-500 mt-1">Configure custom roles and granular permissions for your team.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setViewType('card')} className={`p-1.5 rounded-md transition-all ${viewType === 'card' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewType('list')} className={`p-1.5 rounded-md transition-all ${viewType === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
          </div>
          <Button
            onClick={handleCreateNew}
            variant="gradient"
            className="rounded-xl px-6 py-2.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="mr-2" size={18} /> Create New Role
          </Button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <Input
          className="pl-12 py-6 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
          placeholder="Search roles by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((role) => (
            <Card key={role._id} className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-emerald-500">
              <CardHeader className="bg-slate-50 dark:bg-white/5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl">
                    <Shield size={24} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                     <ActionMenu actions={[
                       { label: 'Edit', icon: Edit2, onClick: () => handleEditRole(role) },
                       ...(!role.is_system ? [{ 
                         label: 'Delete', 
                         icon: Trash2, 
                         variant: 'danger' as const, 
                         onClick: () => { setSelectedRole(role); setDeleteModalOpen(true); } 
                       }] : [])
                     ]} />
                   </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold truncate">{role.name}</CardTitle>
                    {role.is_system && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">System</span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">{role.description || 'No description provided.'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(role.permissions?.menu || {}).filter(([, val]) => val !== 'none').slice(0, 4).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                        {val === 'edit' ? <Check size={12} /> : <Eye size={12} />}
                        {MENU_ITEMS.find(m => m.id === key)?.label}
                      </div>
                    ))}
                    {Object.keys(role.permissions?.menu || {}).filter(k => (role.permissions?.menu || {})[k] !== 'none').length > 4 && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 text-xs font-medium">
                        +{Object.keys(role.permissions?.menu || {}).filter(k => (role.permissions?.menu || {})[k] !== 'none').length - 4} more
                      </div>
                    )}
                    {Object.keys(role.permissions?.menu || {}).filter(k => (role.permissions?.menu || {})[k] !== 'none').length === 0 && (
                      <span className="text-xs text-slate-400 italic">No permissions set</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-semibold pl-6">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.is_system && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">System</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{role.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(role.permissions?.menu || {}).filter(([, val]) => val !== 'none').slice(0, 3).map(([key, val]) => (
                          <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            {val === 'edit' ? 'Edit' : 'View'} : {MENU_ITEMS.find(m => m.id === key)?.label}
                          </span>
                        ))}
                        {Object.keys(role.permissions?.menu || {}).filter(k => (role.permissions?.menu || {})[k] !== 'none').length > 3 && (
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 text-xs font-medium">
                            +{Object.keys(role.permissions?.menu || {}).filter(k => (role.permissions?.menu || {})[k] !== 'none').length - 3} more
                          </span>
                        )}
                        {Object.keys(role.permissions?.menu || {}).filter(k => (role.permissions?.menu || {})[k] !== 'none').length === 0 && (
                          <span className="text-xs text-slate-400 italic">No permissions</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <ActionMenu actions={[
                        { label: 'Edit', icon: Edit2, onClick: () => handleEditRole(role) },
                        ...(!role.is_system ? [{ 
                          label: 'Delete', 
                          icon: Trash2, 
                          variant: 'danger' as const, 
                          onClick: () => { setSelectedRole(role); setDeleteModalOpen(true); } 
                        }] : [])
                      ]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Role Editor Overlay */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-surface-dark shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedRole ? 'Edit Role' : 'Create New Role'}</h2>
                <p className="text-sm text-slate-500">Define name and granular permissions.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)} className="rounded-full h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-white/10">
                <X size={24} />
              </Button>
            </div>

            <div className="p-8 space-y-10 pb-32">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                  <div className="h-6 w-1 bg-emerald-600 rounded-full" /> Basic Details
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Name</label>
                    <Input
                      placeholder="e.g. Regional Manager"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={selectedRole?.is_system}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="Briefly describe what this role can do"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Menu Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                  <div className="h-6 w-1 bg-emerald-600 rounded-full" /> Menu & Module Access
                </h3>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                  <div className="grid grid-cols-12 bg-slate-50 dark:bg-white/5 p-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <div className="col-span-5">Module Name</div>
                    <div className="col-span-7 flex justify-between px-4">
                      <span>No Access</span>
                      <span>Read Only</span>
                      <span>Full Edit</span>
                    </div>
                  </div>
                  {MENU_ITEMS.map((item) => {
                    const currentVal = formData.permissions.menu[item.id] || 'none';
                    return (
                      <div key={item.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <div className="col-span-5 flex items-center gap-3">
                          <item.icon size={18} className="text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        </div>
                        <div className="col-span-7 flex justify-between px-2 bg-slate-100/50 dark:bg-white/5 rounded-xl p-1">
                          {['none', 'read', 'edit'].map((level) => {
                            // Dashboard is view-only, no 'edit' level needed
                            if (item.id === 'dashboard' && level === 'edit') {
                              return <div key={level} className="w-8" />; // Empty spacer for alignment
                            }

                            return (
                              <button
                                key={level}
                                onClick={() => {
                                  // System unlock
                                  setFormData({
                                    ...formData,
                                    permissions: {
                                      ...formData.permissions,
                                      menu: { ...formData.permissions.menu, [item.id]: level as 'none' | 'read' | 'edit' }
                                    }
                                  });
                                }}
                                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${currentVal === level
                                  ? 'bg-emerald-600 text-white shadow-lg'
                                  : 'text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-white/10'
                                  }`}
                              >
                                {level === 'none' && <X size={16} />}
                                {level === 'read' && <Eye size={16} />}
                                {level === 'edit' && <Edit2 size={16} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sales Perspective */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                  <div className="h-6 w-1 bg-emerald-600 rounded-full" /> Sales Visibility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SALES_PERSPECTIVES.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          dashboard: { ...formData.permissions.dashboard, sales_view: opt.id }
                        }
                      })}
                      className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${formData.permissions.dashboard?.sales_view === opt.id
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 opacity-70'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${formData.permissions.dashboard?.sales_view === opt.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.permissions.dashboard?.sales_view === opt.id ? 'border-emerald-500' : 'border-slate-300'}`}>
                          {formData.permissions.dashboard?.sales_view === opt.id && <div className="h-2 w-2 bg-emerald-500 rounded-full" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 leading-tight">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard Visibility */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                  <div className="h-6 w-1 bg-emerald-600 rounded-full" /> Dashboard Content
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DASHBOARD_WIDGETS.map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          dashboard: { ...formData.permissions.dashboard, [widget.id]: !formData.permissions.dashboard[widget.id] }
                        }
                      })}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.permissions.dashboard[widget.id]
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 grayscale opacity-60'
                        }`}
                    >
                      <span className="text-sm font-bold">{widget.label}</span>
                      <div className={`h-6 w-10 rounded-full p-1 transition-colors ${formData.permissions.dashboard[widget.id] ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                        <div className={`h-4 w-4 bg-white rounded-full transition-transform ${formData.permissions.dashboard[widget.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 right-0 w-full max-w-2xl bg-white dark:bg-surface-dark p-6 border-t border-slate-200 dark:border-white/10 flex gap-4">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="flex-1 rounded-xl py-2.5">Cancel</Button>
              <Button
                onClick={handleSaveRole}
                variant="gradient"
                className="flex-1 rounded-xl py-2.5"
              >
                {selectedRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold">Delete Role?</h3>
              <p className="text-slate-500">This action cannot be undone. Users currently assigned to this role may lose access.</p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="flex-1 rounded-xl py-2.5">Cancel</Button>
                <Button onClick={handleDeleteRole} className="flex-1 rounded-xl py-2.5 bg-red-600 hover:bg-red-700 text-white">Delete</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
