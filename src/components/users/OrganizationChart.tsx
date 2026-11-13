import React, { useState, useMemo } from 'react';
import { Profile, TenantRole, Department } from '../../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import { ActionMenu } from '../ui/ActionMenu';
import { Input } from '../ui/Input';
import { buildOrgTree, OrgNode } from '../../utils/orgTree';
import { 
  Network, Plus, Minus, RotateCcw, Pencil, KeyRound, 
  UserX, UserCheck, Search, Briefcase, Users, Building, 
  Sparkles, Info, Eye
} from 'lucide-react';

interface OrganizationChartProps {
  users: Profile[];
  roles: TenantRole[];
  departments: Department[];
  tenantName?: string;
  onEditUser?: (user: Profile) => void;
  onResetPassword?: (user: Profile) => void;
  onToggleStatus?: (user: Profile) => void;
  onDeleteUser?: (user: Profile) => void;
  onAddUser?: () => void;
}

export function OrganizationChart({
  users,
  roles,
  departments,
  tenantName,
  onEditUser,
  onResetPassword,
  onToggleStatus,
  onDeleteUser,
  onAddUser
}: OrganizationChartProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [hierarchyMode, setHierarchyMode] = useState<'reporting' | 'department'>('reporting');

  // Zoom controls
  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.5), 1.6));
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.action-menu')) return;
    setIsDragging(true);
    setStartPos({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch support for Mobile/Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.action-menu')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setStartPos({
      x: touch.clientX - offset.x,
      y: touch.clientY - offset.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - startPos.x,
      y: touch.clientY - startPos.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Helper for role badge variant
  const getRoleBadgeVariant = (role: string) => {
    const norm = (role || '').toLowerCase().replace(/[\s_-]+/g, '_');
    if (norm === 'super_admin' || norm === 'platform_admin') return 'danger';
    if (norm === 'admin') return 'warning';
    if (norm === 'director') return 'default';
    if (norm === 'team_leader') return 'info';
    if (norm === 'sales_executive') return 'success';
    return 'secondary';
  };

  const getRoleName = (user: Profile) => {
    const roleId = user.role_id;
    const match = (roles || []).find((r: any) => (r._id === roleId || r.id === roleId));
    return match?.name || (user.role || '').replace(/_/g, ' ');
  };

  const getDeptName = (user: Profile) => {
    const deptId = user.department_id;
    const match = (departments || []).find((d: any) => (d._id === deptId || d.id === deptId));
    return match?.name || null;
  };

  // Build tree based on Reporting Manager hierarchy
  const reportingTree = useMemo(() => {
    if (!users || users.length === 0) return [];
    return buildOrgTree(users);
  }, [users]);

  // Build tree based on Department grouping
  const departmentTree = useMemo(() => {
    if (!users || users.length === 0) return [];

    const deptsMap = new Map<string, { dept: Department; members: Profile[] }>();
    const unassigned: Profile[] = [];

    (departments || []).forEach((d: any) => {
      deptsMap.set(String(d._id || d.id), { dept: d, members: [] });
    });

    users.forEach(u => {
      const dId = u.department_id ? String(u.department_id) : '';
      if (dId && deptsMap.has(dId)) {
        deptsMap.get(dId)!.members.push(u);
      } else {
        unassigned.push(u);
      }
    });

    const groups: Array<{ id: string; name: string; members: Profile[] }> = [];
    deptsMap.forEach((val, id) => {
      if (val.members.length > 0) {
        groups.push({ id, name: val.dept.name, members: val.members });
      }
    });

    if (unassigned.length > 0) {
      groups.push({ id: 'unassigned', name: 'General / Unassigned', members: unassigned });
    }

    return groups;
  }, [users, departments]);

  const hasReportingHierarchy = useMemo(() => {
    return (users || []).some(u => Boolean(u.reporting_manager_id));
  }, [users]);

  // Tree Node Component for individual employee card
  const EmployeeNodeCard = ({ user }: { user: Profile }) => {
    const roleName = getRoleName(user);
    const deptName = getDeptName(user);
    const isSearchMatch = searchTerm && (
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employee_id && user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const actions = [
      ...(onEditUser ? [{ label: 'Edit Member', icon: Pencil, onClick: () => onEditUser(user) }] : []),
      ...(onResetPassword ? [{ label: 'Reset Password', icon: KeyRound, onClick: () => onResetPassword(user) }] : []),
      ...(onToggleStatus ? [{ 
        label: user.is_active ? 'Deactivate' : 'Activate', 
        icon: user.is_active ? UserX : UserCheck, 
        onClick: () => onToggleStatus(user) 
      }] : []),
      ...(onDeleteUser ? [{ label: 'Delete User', icon: UserX, onClick: () => onDeleteUser(user), danger: true }] : [])
    ];

    return (
      <div 
        className={`org-node-card min-w-[210px] max-w-[240px] text-center bg-white dark:bg-[#1e293b] p-3.5 rounded-2xl shadow-sm border transition-all ${
          isSearchMatch ? 'ring-4 ring-emerald-500/30 border-emerald-500' : 'border-slate-200/90 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
        } ${!user.is_active ? 'opacity-60 bg-slate-50 dark:bg-white/[0.02]' : ''}`}
      >
        <div className="flex flex-col items-center">
          {/* Avatar with Status indicator */}
          <div className="relative mb-2.5">
            <UserAvatar
              src={user.image_url}
              name={user.full_name}
              size="lg"
              className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
            />
            <div 
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              title={user.is_active ? 'Active User' : 'Inactive User'}
            />
          </div>

          {/* Name & Role */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1" title={user.full_name}>
            {user.full_name}
          </h3>

          <div className="mt-1 mb-1.5 flex flex-wrap items-center justify-center gap-1">
            <Badge variant={getRoleBadgeVariant(user.role)} className="px-2 py-0 text-[10px] uppercase font-bold tracking-wider">
              {roleName}
            </Badge>
            {deptName && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {deptName}
              </span>
            )}
          </div>

          {/* Email & Phone */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 w-full truncate">
            <div className="truncate" title={user.email}>{user.email}</div>
            {user.phone && <div className="text-[10px] text-slate-400">{user.phone}</div>}
            {user.employee_id && (
              <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                ID: {user.employee_id}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 w-full flex items-center justify-between">
            <span className={`text-[10px] font-semibold ${user.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
            {actions.length > 0 && (
              <ActionMenu align="right" actions={actions} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Recursive Tree Node renderer for Reporting hierarchy
  const RenderReportingNode = ({ node }: { node: OrgNode }) => {
    const hasChildren = node.children && node.children.length > 0;
    return (
      <li className={hasChildren ? 'has-children' : ''}>
        <div className={`flex flex-col items-center ${hasChildren ? 'has-children' : ''}`}>
          <EmployeeNodeCard user={node} />
        </div>
        {hasChildren && (
          <ul>
            {node.children!.map((child) => (
              <RenderReportingNode key={String(child._id || child.id)} node={child} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
      <CardHeader className="border-b border-slate-100 dark:border-white/10 py-3.5 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Network size={20} />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Organization Hierarchy Chart
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual team structure and reporting relationships ({users.length} members)
              </p>
            </div>
          </div>

          {/* Top Controls: Hierarchy Mode & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="w-full sm:w-48">
              <Input
                placeholder="Find member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                rightIcon={<Search size={15} className="text-slate-400" />}
                className="h-8 text-xs dark:bg-white/5"
              />
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setHierarchyMode('reporting')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  hierarchyMode === 'reporting'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View by Reporting Manager"
              >
                <Users size={13} />
                <span>Reporting</span>
              </button>
              <button
                type="button"
                onClick={() => setHierarchyMode('department')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  hierarchyMode === 'department'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View by Department"
              >
                <Building size={13} />
                <span>Department</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informative Hint Banner when no reporting manager is assigned yet */}
        {!hasReportingHierarchy && hierarchyMode === 'reporting' && users.length > 1 && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 text-xs text-blue-700 dark:text-blue-300">
            <Info size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              <span>Currently showing team members as peer branches. </span>
              <span className="font-semibold">To create manager & subordinate branches</span>, click the three dots (⋮) on any member, choose <span className="underline font-bold">Edit Member</span>, and select their <strong>Reporting Manager</strong>.
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {users.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
              <Users size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Team Members Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first employee or team member to start generating your organization chart.
            </p>
            {onAddUser && (
              <Button size="sm" onClick={onAddUser} className="!bg-emerald-600 hover:!bg-emerald-700 !text-white gap-1.5">
                <Plus size={15} /> Add Member
              </Button>
            )}
          </div>
        ) : (
          <div className="org-tree-container relative min-h-[460px] max-h-[75vh]">
            {/* Floating Zoom Controls */}
            <div className="org-zoom-controls">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleZoom(0.15)}
                className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-white/10 p-2 h-auto rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Zoom In"
              >
                <Plus size={16} className="text-slate-800 dark:text-white" strokeWidth={2.5} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleZoom(-0.15)}
                className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-white/10 p-2 h-auto rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Zoom Out"
              >
                <Minus size={16} className="text-slate-800 dark:text-white" strokeWidth={2.5} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetZoom}
                className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-white/10 p-2 h-auto rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Reset Zoom"
              >
                <RotateCcw size={15} className="text-slate-800 dark:text-white" strokeWidth={2.5} />
              </Button>
            </div>

            {/* Draggable & Zoomable Scroll Canvas */}
            <div
              className={`tree-scroll-pane select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="org-chart-tree"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  transformOrigin: 'center top'
                }}
              >
                {hierarchyMode === 'reporting' ? (
                  /* Reporting Line Tree */
                  <ul>
                    {reportingTree.map((rootNode) => (
                      <RenderReportingNode key={String(rootNode._id || rootNode.id)} node={rootNode} />
                    ))}
                  </ul>
                ) : (
                  /* Departmental Division Tree */
                  <ul>
                    {departmentTree.map((deptGroup) => (
                      <li key={deptGroup.id} className="has-children">
                        <div className="org-node-card min-w-[200px] bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-white/10 mb-2">
                          <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                            <Briefcase size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Department</span>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                            {deptGroup.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {deptGroup.members.length} {deptGroup.members.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        <ul>
                          {deptGroup.members.map((member) => (
                            <li key={String(member._id || member.id)}>
                              <EmployeeNodeCard user={member} />
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
