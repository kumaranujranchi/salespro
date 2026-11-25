import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '../lib/reactive';
import { api, Id } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { TenantRole, RolePermissions, ModulePermissionConfig } from '../types/database';
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
  List,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Download,
  UserCheck,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface ActionDefinition {
  key: string;
  label: string;
  description: string;
  danger?: boolean;
}

interface GranularModuleDef {
  id: string;
  label: string;
  category: 'core' | 'finance' | 'admin';
  description: string;
  icon: any;
  actions: ActionDefinition[];
}

const GRANULAR_MODULES: GranularModuleDef[] = [
  {
    id: 'leads',
    label: 'Leads & CRM',
    category: 'core',
    description: 'Lead generation, customer contact data, caller updates & followups',
    icon: UsersIcon,
    actions: [
      { key: 'view', label: 'View Leads', description: 'Browse lead lists, view caller histories and followups' },
      { key: 'create', label: 'Create Leads', description: 'Add new leads and import bulk customer data' },
      { key: 'edit', label: 'Edit Contact Details', description: 'Change customer name, mobile, email, project, budget & assignment' },
      { key: 'delete', label: 'Delete Leads', description: 'Delete individual leads or perform bulk deletions', danger: true },
      { key: 'assign', label: 'Assign / Distribute', description: 'Assign leads to sales executives and reassign owners' },
      { key: 'export', label: 'Export Leads', description: 'Download customer lists and contact data to CSV/Excel' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Bookings',
    category: 'core',
    description: 'Unit bookings, buyer agreements, sales pipelines and revenues',
    icon: TrendingUp,
    actions: [
      { key: 'view', label: 'View Sales', description: 'Inspect booked units, buyer contracts and payment stages' },
      { key: 'create', label: 'Record Booking', description: 'Book new inventory units and log sales agreements' },
      { key: 'edit', label: 'Edit Booking Info', description: 'Modify unit pricing, buyer records and terms' },
      { key: 'delete', label: 'Cancel Booking', description: 'Void or remove sales booking records', danger: true },
      { key: 'export', label: 'Export Sales', description: 'Export sales ledger and commission records' },
    ],
  },
  {
    id: 'site_visits',
    label: 'Site Visits',
    category: 'core',
    description: 'Physical property tours, cab allocations and client visits',
    icon: Clock,
    actions: [
      { key: 'view', label: 'View Visits', description: 'Browse scheduled and past client site visits' },
      { key: 'create', label: 'Schedule Visit', description: 'Book a site visit for clients with driver details' },
      { key: 'edit', label: 'Update Visit Status', description: 'Mark visits completed, reschedule or reallocate drivers' },
      { key: 'delete', label: 'Cancel Visit', description: 'Cancel scheduled site visits', danger: true },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts & Payments',
    category: 'finance',
    description: 'Customer installment receipts, invoices and financial records',
    icon: CreditCard,
    actions: [
      { key: 'view', label: 'View Payments', description: 'Access financial ledgers, receipts and balances' },
      { key: 'create', label: 'Record Receipt', description: 'Add customer payment entries and generate receipts' },
      { key: 'edit', label: 'Edit Transactions', description: 'Modify voucher notes and correct transaction entries' },
      { key: 'delete', label: 'Delete Transactions', description: 'Void receipts and financial entries', danger: true },
      { key: 'export', label: 'Export Accounts', description: 'Download financial ledgers to Excel/CSV' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Projects',
    category: 'finance',
    description: 'Real estate projects, towers, floor units and availability',
    icon: Building,
    actions: [
      { key: 'view', label: 'View Units', description: 'Browse project inventory availability and unit matrices' },
      { key: 'create', label: 'Add Projects & Units', description: 'Configure new towers, projects and layouts' },
      { key: 'edit', label: 'Modify Pricing & Hold', description: 'Update unit prices, lock units or change statuses' },
      { key: 'delete', label: 'Delete Inventory', description: 'Remove units or projects from inventory', danger: true },
    ],
  },
  {
    id: 'incentives',
    label: 'Targets & Incentives',
    category: 'finance',
    description: 'Executive quotas, performance tiers and monthly commissions',
    icon: Award,
    actions: [
      { key: 'view', label: 'View Targets', description: 'Inspect monthly assigned targets and incentives' },
      { key: 'create', label: 'Assign Targets', description: 'Set monthly sales quotas for executives' },
      { key: 'edit', label: 'Approve Payouts', description: 'Calculate and approve incentive disbursements' },
      { key: 'delete', label: 'Delete Targets', description: 'Remove target goals', danger: true },
    ],
  },
  {
    id: 'reports',
    label: 'Analytics & Reports',
    category: 'admin',
    description: 'Executive KPI tracking, conversion ratios and executive reports',
    icon: FileText,
    actions: [
      { key: 'view', label: 'View Reports', description: 'Access analytical charts and performance summaries' },
      { key: 'export', label: 'Export Reports', description: 'Download analytical reports in CSV or PDF' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    category: 'admin',
    description: 'Organization staff profiles, credentials and account statuses',
    icon: UsersIcon,
    actions: [
      { key: 'view', label: 'View Staff', description: 'Browse organization member directory' },
      { key: 'create', label: 'Invite Staff', description: 'Add new staff members and send invite links' },
      { key: 'edit', label: 'Edit Staff Accounts', description: 'Update profile details, assign roles and departments' },
      { key: 'delete', label: 'Deactivate Staff', description: 'Suspend or remove user accounts', danger: true },
    ],
  },
  {
    id: 'departments',
    label: 'Departments',
    category: 'admin',
    description: 'Business units and hierarchical department organization',
    icon: Briefcase,
    actions: [
      { key: 'view', label: 'View Departments', description: 'Inspect organizational business departments' },
      { key: 'create', label: 'Create Department', description: 'Create new departmental divisions' },
      { key: 'edit', label: 'Edit Department', description: 'Rename or restructure departments and assign heads' },
      { key: 'delete', label: 'Delete Department', description: 'Delete unused department records', danger: true },
    ],
  },
  {
    id: 'roles',
    label: 'Role Management',
    category: 'admin',
    description: 'Security policies, granular permissions and access presets',
    icon: Shield,
    actions: [
      { key: 'view', label: 'View Roles', description: 'Inspect active organization roles and permission matrices' },
      { key: 'create', label: 'Create Roles', description: 'Create new custom roles and define permissions' },
      { key: 'edit', label: 'Edit Permissions', description: 'Modify permission matrix and update granted capabilities' },
      { key: 'delete', label: 'Delete Roles', description: 'Remove non-system custom roles', danger: true },
    ],
  },
];

const DASHBOARD_WIDGETS = [
  { id: 'kpi_cards', label: 'KPI Statistics Cards' },
  { id: 'project_performance', label: 'Project-wise Performance' },
  { id: 'leaderboard', label: 'Sales Leaderboard' },
  { id: 'upcoming_events', label: 'Birthdays & Events' },
  { id: 'recent_activity', label: 'Recent Activity Feed' },
];

const SALES_PERSPECTIVES: { id: 'none' | 'self' | 'team' | 'overall'; label: string; description: string }[] = [
  { id: 'none', label: 'No Sales Data', description: 'Hide all sales metrics and revenue' },
  { id: 'self', label: 'Self Sales Only', description: 'Show only user’s own bookings and revenue' },
  { id: 'team', label: 'Team Sales', description: 'Show sales of reporting team members' },
  { id: 'overall', label: 'Overall Sales', description: 'Show total company sales and volume' },
];

const LEAD_PERSPECTIVES: { id: 'self' | 'team' | 'overall'; label: string; description: string }[] = [
  { id: 'self', label: 'Assigned Leads Only (Self)', description: 'Strictly isolate: user only sees and calls leads assigned directly to them' },
  { id: 'team', label: 'Team / Department Leads', description: 'Show leads assigned to user and reporting team members' },
  { id: 'overall', label: 'All Company Leads (Global)', description: 'Full access to browse and manage all organization leads' },
];

// Helper to construct empty permissions
function createDefaultPermissions(): RolePermissions {
  const modules: Record<string, ModulePermissionConfig> = {};
  GRANULAR_MODULES.forEach(m => {
    const actMap: Record<string, boolean> = {};
    m.actions.forEach(a => {
      actMap[a.key] = false;
    });
    modules[m.id] = { view: false, ...actMap };
  });

  if (modules.leads) {
    modules.leads.perspective = 'overall';
  }
  if (modules.sales) {
    modules.sales.perspective = 'overall';
  }

  return {
    modules,
    leads_view: 'overall',
    menu: {
      dashboard: 'read',
      accounts: 'none',
      sales: 'none',
      crm: 'none',
      inventory: 'none',
      site_visits: 'none',
      incentives: 'none',
      reports: 'none',
      users: 'none',
      departments: 'none',
      roles: 'none',
    },
    dashboard: {
      kpi_cards: false,
      project_performance: false,
      leaderboard: false,
      upcoming_events: false,
      recent_activity: false,
      sales_view: 'none',
    },
  };
}

// Convert existing role data into standardized granular format
function normalizeRolePermissions(rawPerms: any): RolePermissions {
  const base = createDefaultPermissions();
  if (!rawPerms || typeof rawPerms !== 'object') return base;

  const leadPersp = rawPerms.modules?.leads?.perspective || rawPerms.leads_view || 'overall';
  const salesPersp = rawPerms.modules?.sales?.perspective || rawPerms.dashboard?.sales_view || 'none';

  const result: RolePermissions = {
    modules: { ...base.modules },
    leads_view: leadPersp,
    menu: { ...base.menu, ...(rawPerms.menu || {}) },
    dashboard: {
      ...base.dashboard,
      ...(rawPerms.dashboard || {}),
      sales_view: salesPersp,
    },
  };

  // If role already has granular modules, merge them
  if (rawPerms.modules && typeof rawPerms.modules === 'object') {
    Object.keys(rawPerms.modules).forEach(modKey => {
      if (result.modules) {
        result.modules[modKey] = {
          ...(result.modules[modKey] || { view: false }),
          ...rawPerms.modules[modKey],
        };
      }
    });
  } else if (rawPerms.menu) {
    // Legacy fallback: derive granular modules from menu
    Object.entries(rawPerms.menu).forEach(([menuKey, val]) => {
      const modKey = menuKey === 'crm' ? 'leads' : menuKey;
      if (result.modules && result.modules[modKey]) {
        if (val === 'edit') {
          result.modules[modKey].view = true;
          result.modules[modKey].create = true;
          result.modules[modKey].edit = true;
          result.modules[modKey].delete = false;
          result.modules[modKey].export = true;
          result.modules[modKey].assign = true;
        } else if (val === 'read') {
          result.modules[modKey].view = true;
          result.modules[modKey].create = false;
          result.modules[modKey].edit = false;
          result.modules[modKey].delete = false;
          result.modules[modKey].export = false;
          result.modules[modKey].assign = false;
        } else {
          result.modules[modKey].view = false;
          result.modules[modKey].create = false;
          result.modules[modKey].edit = false;
          result.modules[modKey].delete = false;
        }
      }
    });
  }

  if (result.modules?.leads) {
    result.modules.leads.perspective = leadPersp;
  }
  if (result.modules?.sales) {
    result.modules.sales.perspective = salesPersp;
  }

  return result;
}

// Derive legacy menu mapping to preserve backward compatibility across all existing endpoints
function deriveLegacyMenu(modules: Record<string, ModulePermissionConfig>): Record<string, 'none' | 'read' | 'edit'> {
  const menu: Record<string, 'none' | 'read' | 'edit'> = {
    dashboard: 'read',
  };

  const getMenuLevel = (modConfig?: ModulePermissionConfig): 'none' | 'read' | 'edit' => {
    if (!modConfig || !modConfig.view) return 'none';
    if (modConfig.edit || modConfig.create) return 'edit';
    return 'read';
  };

  menu.crm = getMenuLevel(modules.leads);
  menu.sales = getMenuLevel(modules.sales);
  menu.accounts = getMenuLevel(modules.accounts);
  menu.inventory = getMenuLevel(modules.inventory);
  menu.site_visits = getMenuLevel(modules.site_visits);
  menu.incentives = getMenuLevel(modules.incentives);
  menu.reports = modules.reports?.view ? 'read' : 'none';
  menu.users = getMenuLevel(modules.users);
  menu.departments = getMenuLevel(modules.departments);
  menu.roles = getMenuLevel(modules.roles);

  return menu;
}

export function RolesPage() {
  const { tenant, profile, loading } = useAuth();
  const currentTenantId = tenant?._id || tenant?.id || profile?.tenant_id;

  const rolesData = useQuery(
    api.roles.list,
    currentTenantId ? { tenant_id: currentTenantId as any } : 'skip'
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
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'core' | 'finance' | 'admin'>('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: createDefaultPermissions(),
  });

  const handleEditRole = (role: TenantRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: normalizeRolePermissions(role.permissions),
    });
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: createDefaultPermissions(),
    });
    setIsEditorOpen(true);
  };

  // Preset Applicator
  const applyPreset = (preset: 'admin' | 'caller' | 'manager' | 'accountant' | 'auditor') => {
    const nextPerms = createDefaultPermissions();

    if (preset === 'admin') {
      // Full Access across every single module
      GRANULAR_MODULES.forEach(m => {
        const actMap: Record<string, boolean> = { view: true };
        m.actions.forEach(a => {
          actMap[a.key] = true;
        });
        if (nextPerms.modules) nextPerms.modules[m.id] = actMap as any;
      });
      nextPerms.leads_view = 'overall';
      if (nextPerms.modules?.leads) nextPerms.modules.leads.perspective = 'overall';
      if (nextPerms.modules?.sales) nextPerms.modules.sales.perspective = 'overall';
      nextPerms.dashboard = {
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true,
        sales_view: 'overall',
      };
    } else if (preset === 'caller') {
      // Sales Executive (Caller): View and create leads, log followups; NO edit contact details, NO delete, NO assign, NO export
      if (nextPerms.modules) {
        nextPerms.modules.leads = {
          view: true,
          create: true,
          edit: false,
          delete: false,
          assign: false,
          export: false,
          perspective: 'self',
        };
        nextPerms.modules.sales = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          export: false,
          perspective: 'self',
        };
        nextPerms.modules.site_visits = {
          view: true,
          create: true,
          edit: false,
          delete: false,
        };
        nextPerms.modules.inventory = {
          view: true,
          create: false,
          edit: false,
          delete: false,
        };
        nextPerms.modules.incentives = {
          view: true,
          create: false,
          edit: false,
          delete: false,
        };
      }
      nextPerms.leads_view = 'self';
      nextPerms.dashboard = {
        kpi_cards: true,
        project_performance: false,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true,
        sales_view: 'self',
      };
    } else if (preset === 'manager') {
      // Sales Manager / Team Leader: Lead distribution, sales management, team perspective
      if (nextPerms.modules) {
        nextPerms.modules.leads = {
          view: true,
          create: true,
          edit: true,
          delete: false,
          assign: true,
          export: true,
          perspective: 'team',
        };
        nextPerms.modules.sales = {
          view: true,
          create: true,
          edit: true,
          delete: false,
          export: true,
          perspective: 'team',
        };
        nextPerms.modules.site_visits = {
          view: true,
          create: true,
          edit: true,
          delete: false,
        };
        nextPerms.modules.inventory = {
          view: true,
          create: false,
          edit: true,
          delete: false,
        };
        nextPerms.modules.incentives = {
          view: true,
          create: true,
          edit: true,
          delete: false,
        };
        nextPerms.modules.reports = {
          view: true,
          export: true,
        };
      }
      nextPerms.leads_view = 'team';
      nextPerms.dashboard = {
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true,
        sales_view: 'team',
      };
    } else if (preset === 'accountant') {
      // Accountant: Accounts, sales ledger, payments
      if (nextPerms.modules) {
        nextPerms.modules.accounts = {
          view: true,
          create: true,
          edit: true,
          delete: false,
          export: true,
        };
        nextPerms.modules.sales = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          export: true,
          perspective: 'overall',
        };
        nextPerms.modules.leads = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          assign: false,
          export: false,
          perspective: 'overall',
        };
        nextPerms.modules.inventory = {
          view: true,
          create: false,
          edit: false,
          delete: false,
        };
        nextPerms.modules.reports = {
          view: true,
          export: true,
        };
      }
      nextPerms.leads_view = 'overall';
      nextPerms.dashboard = {
        kpi_cards: true,
        project_performance: false,
        leaderboard: false,
        upcoming_events: true,
        recent_activity: false,
        sales_view: 'overall',
      };
    } else if (preset === 'auditor') {
      // Read-Only Auditor: View and export across modules, zero create/edit/delete
      GRANULAR_MODULES.forEach(m => {
        const actMap: Record<string, boolean> = { view: true };
        m.actions.forEach(a => {
          actMap[a.key] = a.key === 'export';
        });
        if (nextPerms.modules) nextPerms.modules[m.id] = actMap as any;
      });
      nextPerms.leads_view = 'overall';
      if (nextPerms.modules?.leads) nextPerms.modules.leads.perspective = 'overall';
      if (nextPerms.modules?.sales) nextPerms.modules.sales.perspective = 'overall';
      nextPerms.dashboard = {
        kpi_cards: true,
        project_performance: true,
        leaderboard: true,
        upcoming_events: true,
        recent_activity: true,
        sales_view: 'overall',
      };
    }

    setFormData(prev => ({
      ...prev,
      permissions: nextPerms,
    }));
  };

  // Toggle single action for a module
  const toggleAction = (moduleId: string, actionKey: string) => {
    setFormData(prev => {
      const currentMods = { ...(prev.permissions.modules || {}) };
      const currentMod = { ...(currentMods[moduleId] || { view: false }) };
      const currentVal = !!currentMod[actionKey];
      const nextVal = !currentVal;

      currentMod[actionKey] = nextVal;

      // If granting an action, ensure 'view' is also automatically turned on
      if (nextVal && actionKey !== 'view') {
        currentMod.view = true;
      }
      // If revoking 'view', automatically revoke all child actions
      if (!nextVal && actionKey === 'view') {
        Object.keys(currentMod).forEach(k => {
          if (k !== 'perspective') currentMod[k] = false;
        });
      }

      currentMods[moduleId] = currentMod;
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          modules: currentMods,
        },
      };
    });
  };

  // Toggle all actions for a specific module
  const toggleAllForModule = (moduleId: string, enable: boolean) => {
    setFormData(prev => {
      const currentMods = { ...(prev.permissions.modules || {}) };
      const modDef = GRANULAR_MODULES.find(m => m.id === moduleId);
      if (!modDef) return prev;

      const newModConfig: Record<string, boolean> = { view: enable };
      modDef.actions.forEach(a => {
        newModConfig[a.key] = enable;
      });

      currentMods[moduleId] = newModConfig as any;
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          modules: currentMods,
        },
      };
    });
  };

  async function handleSaveRole() {
    try {
      const targetTenantId = currentTenantId;
      if (!targetTenantId || !formData.name.trim()) {
        alert('Please provide a valid role name.');
        return;
      }

      const modules = formData.permissions.modules || {};
      const menu = deriveLegacyMenu(modules);
      const leadScope = modules.leads?.perspective || formData.permissions.leads_view || 'overall';
      const salesScope = modules.sales?.perspective || formData.permissions.dashboard?.sales_view || 'none';

      if (modules.leads) {
        modules.leads.perspective = leadScope;
      }
      if (modules.sales) {
        modules.sales.perspective = salesScope;
      }

      const finalPermissions: RolePermissions = {
        modules,
        menu,
        dashboard: {
          ...formData.permissions.dashboard,
          sales_view: salesScope,
        },
        leads_view: leadScope,
      };

      if (selectedRole) {
        await updateRole({
          id: selectedRole._id as Id<'tenant_roles'>,
          name: formData.name.trim(),
          description: formData.description.trim(),
          permissions: finalPermissions,
        });
      } else {
        await createRole({
          tenant_id: targetTenantId as any,
          name: formData.name.trim(),
          description: formData.description.trim(),
          permissions: finalPermissions,
        });
      }

      setIsEditorOpen(false);
    } catch (err: any) {
      console.error('Error saving role:', err);
      alert(err.message || 'Failed to save role. Please check if name is unique.');
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole || selectedRole.is_system) return;
    try {
      await deleteRole({ id: selectedRole._id as Id<'tenant_roles'> });
      setDeleteModalOpen(false);
    } catch (err: any) {
      console.error('Error deleting role:', err);
      alert(err.message || 'Failed to delete role.');
    }
  }

  // Filter modules based on category tab
  const filteredModules = useMemo(() => {
    if (activeCategoryTab === 'all') return GRANULAR_MODULES;
    return GRANULAR_MODULES.filter(m => m.category === activeCategoryTab);
  }, [activeCategoryTab]);

  // Wait for auth to fully resolve before showing access denied
  if (loading || profile === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const canManageRoles =
    profile?.role === 'super_admin' ||
    profile?.role === 'platform_admin' ||
    profile?.role === 'admin' ||
    String(profile?.role || '').toLowerCase().includes('admin');

  if (!canManageRoles) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
        <Lock size={48} className="text-slate-400" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500">Only Administrators can manage roles and permissions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-emerald-600" /> Role & Permission Management
          </h1>
          <p className="text-slate-500 mt-1">
            Configure custom roles with fine-grained View, Create, Edit, Delete, Assign, and Export privileges.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setViewType('card')}
              className={`p-1.5 rounded-md transition-all ${
                viewType === 'card'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewType === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
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

      {/* Search Bar */}
      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          size={20}
        />
        <Input
          className="pl-12 py-6 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
          placeholder="Search roles by title, keyword, or permissions..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Roles Display */}
      {viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles
            .filter(r => (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
            .map(role => {
              const perms = normalizeRolePermissions(role.permissions);
              const activeModCount = Object.values(perms.modules || {}).filter(m => m.view).length;

              return (
                <Card
                  key={role._id}
                  className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-emerald-500 flex flex-col justify-between"
                >
                  <CardHeader className="bg-slate-50 dark:bg-white/5 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl">
                        <Shield size={24} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <ActionMenu
                        actions={[
                          { label: 'Edit & Permissions', icon: Edit2, onClick: () => handleEditRole(role) },
                          ...(!role.is_system
                            ? [
                                {
                                  label: 'Delete Role',
                                  icon: Trash2,
                                  variant: 'danger' as const,
                                  onClick: () => {
                                    setSelectedRole(role);
                                    setDeleteModalOpen(true);
                                  },
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold truncate">{role.name}</CardTitle>
                        {role.is_system && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                            System
                          </span>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 mt-1">
                        {role.description || 'No description provided.'}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Module Capabilities
                        </p>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {activeModCount} of {GRANULAR_MODULES.length} Granted
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {GRANULAR_MODULES.filter(m => perms.modules?.[m.id]?.view)
                          .slice(0, 5)
                          .map(m => {
                            const cfg = perms.modules?.[m.id];
                            const isReadOnly = cfg?.view && !cfg?.edit && !cfg?.create && !cfg?.delete;
                            const hasFull = cfg?.view && cfg?.edit && cfg?.create;

                            return (
                              <span
                                key={m.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                  hasFull
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                    : isReadOnly
                                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                }`}
                              >
                                {isReadOnly ? <Eye size={11} /> : <Check size={11} />}
                                {m.label}: {isReadOnly ? 'Read-Only' : hasFull ? 'Manage' : 'Custom'}
                              </span>
                            );
                          })}
                        {activeModCount > 5 && (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 text-[11px] font-medium">
                            +{activeModCount - 5} more
                          </span>
                        )}
                        {activeModCount === 0 && (
                          <span className="text-xs text-slate-400 italic">No modules granted</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Leads Scope:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                          {perms.modules?.leads?.perspective || perms.leads_view || 'overall'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sales View:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                          {perms.dashboard?.sales_view || 'none'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card className="rounded-3xl border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active Privileges</TableHead>
                  <TableHead>Leads Scope</TableHead>
                  <TableHead>Sales Scope</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles
                  .filter(r => (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(role => {
                    const perms = normalizeRolePermissions(role.permissions);
                    const activeCount = Object.values(perms.modules || {}).filter(m => m.view).length;

                    return (
                      <TableRow key={role._id}>
                        <TableCell className="font-semibold pl-6">
                          <div className="flex items-center gap-2">
                            {role.name}
                            {role.is_system && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                                System
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{role.description || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                            <ShieldCheck size={13} /> {activeCount} Modules Granted
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                            {perms.modules?.leads?.perspective || perms.leads_view || 'overall'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                            {perms.dashboard?.sales_view || 'none'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <ActionMenu
                            actions={[
                              { label: 'Edit & Permissions', icon: Edit2, onClick: () => handleEditRole(role) },
                              ...(!role.is_system
                                ? [
                                    {
                                      label: 'Delete',
                                      icon: Trash2,
                                      variant: 'danger' as const,
                                      onClick: () => {
                                        setSelectedRole(role);
                                        setDeleteModalOpen(true);
                                      },
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Role Editor Modal / Slide-over */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-3xl h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" />
                  {selectedRole ? `Configure Role: ${selectedRole.name}` : 'Create New Security Role'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set granular View, Create, Edit, Delete, Export, and Assign rights per module.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-full h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={22} />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 md:p-8 space-y-8 flex-1 pb-32">
              {/* Basic Role Info */}
              <div className="space-y-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Sales Executive, Senior Manager..."
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={selectedRole?.is_system}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <Input
                      placeholder="Define the primary operational purpose of this role..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Quick Permission Presets
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Click to apply industry standard preset</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('admin')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                      Full Admin
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">All rights & delete</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('caller')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group ring-1 ring-emerald-500/20"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                      Caller / Executive
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Calls & followups only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('manager')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                      Team Leader
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Lead assign & team scope</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('accountant')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                      Accountant
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Accounts & receipts</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('auditor')}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                      Auditor / Viewer
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Read & export only</div>
                  </button>
                </div>
              </div>

              {/* Granular Module Privileges Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="h-5 w-1.5 bg-emerald-600 rounded-full" /> Granular Access Matrix
                    </h3>
                    <p className="text-xs text-slate-500">
                      Explicitly permit or restrict individual operational capabilities for each module.
                    </p>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs">
                    {(['all', 'core', 'finance', 'admin'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveCategoryTab(tab)}
                        className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                          activeCategoryTab === tab
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modules List */}
                <div className="space-y-4">
                  {filteredModules.map(module => {
                    const modPerms = formData.permissions.modules?.[module.id] || { view: false };
                    const isModuleActive = !!modPerms.view;
                    const grantedCount = module.actions.filter(a => !!modPerms[a.key]).length;

                    return (
                      <div
                        key={module.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isModuleActive
                            ? 'border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-slate-800/70 shadow-sm'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 opacity-80'
                        }`}
                      >
                        {/* Module Header Bar */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl ${
                                isModuleActive
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                              }`}
                            >
                              <module.icon size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {module.label}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    isModuleActive
                                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                  }`}
                                >
                                  {isModuleActive ? `${grantedCount}/${module.actions.length} Granted` : 'No Access'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
                            </div>
                          </div>

                          {/* Quick Toggle All */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleAllForModule(module.id, true)}
                              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30"
                            >
                              Grant All
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleAllForModule(module.id, false)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-red-500 px-2 py-1 rounded bg-slate-100 dark:bg-white/10"
                            >
                              Revoke All
                            </button>
                          </div>
                        </div>

                        {/* Granular Action Checkboxes */}
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {module.actions.map(action => {
                            const isGranted = !!modPerms[action.key];

                            return (
                              <button
                                key={action.key}
                                type="button"
                                onClick={() => toggleAction(module.id, action.key)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                                  isGranted
                                    ? action.danger
                                      ? 'border-red-300 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20'
                                      : 'border-emerald-300 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/20'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 hover:border-slate-300'
                                }`}
                              >
                                <div
                                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                    isGranted
                                      ? action.danger
                                        ? 'bg-red-600 border-red-600 text-white'
                                        : 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                                  }`}
                                >
                                  {isGranted && <Check size={13} strokeWidth={3} />}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={`text-xs font-bold ${
                                      isGranted
                                        ? action.danger
                                          ? 'text-red-700 dark:text-red-300'
                                          : 'text-emerald-800 dark:text-emerald-300'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {action.label}
                                  </div>
                                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                    {action.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lead Visibility Perspective */}
              <div className="space-y-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <UsersIcon size={16} className="text-emerald-600" /> Lead Visibility Scope (Data Access Level)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Controls whether users with this role see assigned leads only, reporting team leads, or all organization leads.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LEAD_PERSPECTIVES.map(opt => {
                    const currentScope = formData.permissions.modules?.leads?.perspective || formData.permissions.leads_view || 'overall';
                    const isSelected = currentScope === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const currentMods = { ...(formData.permissions.modules || {}) };
                          currentMods.leads = {
                            ...(currentMods.leads || { view: true }),
                            perspective: opt.id,
                          };
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              modules: currentMods,
                              leads_view: opt.id,
                            },
                          });
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-emerald-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight block">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sales Visibility Perspective */}
              <div className="space-y-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" /> Sales Visibility Scope
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Controls whether users with this role see their own sales, team sales, or company-wide numbers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {SALES_PERSPECTIVES.map(opt => {
                    const isSelected = formData.permissions.dashboard?.sales_view === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              dashboard: {
                                ...formData.permissions.dashboard,
                                sales_view: opt.id,
                              },
                            },
                          })
                        }
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-emerald-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight block">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dashboard Widgets */}
              <div className="space-y-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-emerald-600" /> Dashboard Widgets
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Toggle specific widgets visible on the home dashboard.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DASHBOARD_WIDGETS.map(widget => {
                    const isChecked = !!formData.permissions.dashboard?.[widget.id];

                    return (
                      <button
                        key={widget.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              dashboard: {
                                ...formData.permissions.dashboard,
                                [widget.id]: !isChecked,
                              },
                            },
                          })
                        }
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold">{widget.label}</span>
                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                            isChecked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-6 border-t border-slate-200 dark:border-white/10 flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsEditorOpen(false)}
                className="flex-1 rounded-xl py-2.5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRole}
                variant="gradient"
                className="flex-1 rounded-xl py-2.5 shadow-lg shadow-emerald-500/20"
              >
                {selectedRole ? 'Save Changes' : 'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold">Delete Role?</h3>
              <p className="text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRole?.name}</span>? Users assigned to this role will lose their custom privileges.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 rounded-xl py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteRole}
                  className="flex-1 rounded-xl py-2.5 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
