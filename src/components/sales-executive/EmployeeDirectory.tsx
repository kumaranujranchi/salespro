import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from "../../lib/reactive";
import { api, Doc, Id } from '../../lib/api-endpoints';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { 
    Search, Download, Network, LayoutGrid, Briefcase, Plus, Minus, 
    RotateCcw, Phone, MessageSquare, Mail, X, Users, Sparkles
} from 'lucide-react';
import { buildOrgTree } from '../../utils/orgTree';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';

interface TreeNodeData {
    id: string;
    name?: string;
    full_name?: string | null;
    role?: string | null;
    role_id?: string | null;
    email?: string | null;
    image_url?: string | null;
    type?: 'department' | 'employee';
    children?: TreeNodeData[];
}

export function EmployeeDirectory() {
    const { profile } = useAuth();
    const tenantId = profile?.tenant_id as Id<"tenants">;

    // Backend queries
    const employeesData = useQuery(api.profiles.listUsersByTenant, 
        tenantId ? { tenant_id: tenantId, is_active: true } : "skip"
    );
    const rolesData = useQuery(api.roles.list, 
        tenantId ? { tenant_id: tenantId } : "skip"
    );
    const departmentsData = useQuery(api.departments.list, 
        tenantId ? { tenant_id: tenantId } : "skip"
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
    // Default to mobile-friendly grid/list view on phones (<768px), tree view on desktop
    const [viewType, setViewType] = useState<'grid' | 'tree'>(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return 'grid';
        }
        return 'tree';
    });

    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleZoom = (delta: number) => {
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 1.5));
    };

    const resetZoom = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    // Pan (Drag-to-pointer) logic
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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

    // Touch Support for Mobile/Tablets
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

    const employees = useMemo(() => {
        return (employeesData || []).filter((e: Doc<"profiles">) => e.role !== 'super_admin');
    }, [employeesData]);

    const roles = rolesData || [];
    const departments = departmentsData || [];
    const loading = !employeesData || !rolesData || !departmentsData;

    // Filter employees by Search and Department
    const filteredEmployees = useMemo(() => {
        return employees.filter((emp: Doc<"profiles">) => {
            const matchesSearch = !searchTerm.trim() || 
                (emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (emp.phone && emp.phone.includes(searchTerm)) ||
                (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesDept = selectedDeptId === 'all' || emp.department_id === selectedDeptId;

            return matchesSearch && matchesDept;
        });
    }, [employees, searchTerm, selectedDeptId]);

    const getRoleBadgeVariant = (role: string) => {
        if (role === 'super_admin') return 'danger';
        if (role === 'admin' || role === 'director') return 'warning';
        if (role === 'team_leader' || role === 'sales_manager') return 'info';
        if (role === 'sales_executive' || role === 'sales') return 'success';
        if (role === 'driver') return 'default';
        return 'secondary';
    };

    const deptTree = useMemo(() => {
        if (viewType !== 'tree') return [];
        
        const deptsWithEmployees = departments.filter(dept => 
            employees.some(emp => emp.department_id === dept._id)
        );

        if (deptsWithEmployees.length === 0 && employees.length > 0) {
            return buildOrgTree(employees).map(node => ({ ...node, type: 'employee' as const })) as unknown as TreeNodeData[];
        }

        return deptsWithEmployees.map(dept => {
            const deptEmployees = employees.filter(emp => emp.department_id === dept._id);
            return {
                id: dept._id,
                name: dept.name,
                type: 'department' as const,
                children: buildOrgTree(deptEmployees) as unknown as TreeNodeData[]
            } as TreeNodeData;
        });
    }, [employees, departments, viewType]);

    const TreeNode = ({ node }: { node: TreeNodeData }) => {
        const isDept = node.type === 'department';
        const hasChildren = node.children && node.children.length > 0;
        
        return (
            <li>
                <div className={`org-node-card ${hasChildren ? 'has-children' : ''} ${isDept ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10' : ''}`}>
                    <div className="flex flex-col items-center">
                        {isDept ? (
                            <div className="flex flex-col items-center py-2 px-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                        <Briefcase size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-80">
                                        Division
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white text-center leading-tight uppercase tracking-wider">
                                    {node.name || 'Unassigned'}
                                </h3>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-3">
                                    <UserAvatar
                                        src={node.image_url}
                                        name={node.full_name}
                                        size="xl"
                                        className="w-14 h-14 border-2 border-white dark:border-slate-800 shadow-sm"
                                    />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white text-center leading-tight mb-1">{node.full_name || 'Team Member'}</h3>
                                <div className="mb-2">
                                    <Badge variant={getRoleBadgeVariant(node.role || 'default')} className="px-2 py-0 h-5 text-[10px] uppercase font-semibold">
                                        {roles.find(r => r.id === node.role_id)?.name || (node.role || '').replace('_', ' ')}
                                    </Badge>
                                </div>
                                
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 text-center truncate max-w-[150px]">
                                    {node.email}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {hasChildren && (
                    <ul>
                        {node.children!.map((child: TreeNodeData) => (
                            <TreeNode key={child.id} node={child} />
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    const exportCSV = () => {
        const headers = ['Full Name', 'Role', 'Email', 'Phone', 'Department', 'Employee ID'];
        const csvData = filteredEmployees.map(emp => {
            const deptName = departments.find(d => d._id === emp.department_id)?.name || '';
            const roleName = roles.find(r => r.id === emp.role_id)?.name || (emp.role || '').replace('_', ' ');
            return [
                emp.full_name,
                roleName,
                emp.email,
                emp.phone || '',
                deptName,
                emp.employee_id || ''
            ];
        });

        const csvContent = [headers, ...csvData].map(e => e.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `team_directory_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-4">
            {/* Native Mobile / Desktop Header Controls */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                {/* Search Input Bar */}
                <div className="relative w-full">
                    <Input
                        placeholder="Search team by name, phone, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={16} className="text-slate-400" />}
                        rightIcon={searchTerm ? (
                            <button 
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                            >
                                <X size={14} />
                            </button>
                        ) : undefined}
                        className="h-10 text-xs rounded-xl dark:bg-white/5 dark:text-white dark:border-white/10"
                    />
                </div>

                {/* Horizontal Department Filter Chips */}
                {departments.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
                        <button
                            type="button"
                            onClick={() => setSelectedDeptId('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedDeptId === 'all'
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            All ({employees.length})
                        </button>
                        {departments.map((dept) => {
                            const count = employees.filter(e => e.department_id === dept._id).length;
                            return (
                                <button
                                    key={dept._id}
                                    type="button"
                                    onClick={() => setSelectedDeptId(dept._id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                                        selectedDeptId === dept._id
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <Briefcase size={12} className="opacity-70" />
                                    <span>{dept.name} ({count})</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Symmetric 50% / 50% Action Controls */}
                <div className="flex items-center gap-2 w-full pt-1 border-t border-slate-100 dark:border-white/5">
                    {/* Segmented View Switcher: Equal Half */}
                    <div className="flex-1 inline-flex items-center h-9 rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setViewType('grid')}
                            className={`flex-1 h-full px-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-1.5 ${
                                viewType === 'grid'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <LayoutGrid size={13} />
                            <span>List View</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewType('tree')}
                            className={`flex-1 h-full px-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-1.5 ${
                                viewType === 'tree'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Network size={13} />
                            <span>Org Tree</span>
                        </button>
                    </div>

                    {/* Export CSV: Equal Half */}
                    <button
                        type="button"
                        onClick={exportCSV}
                        className="flex-1 h-9 px-3 text-xs font-semibold rounded-xl inline-flex items-center justify-center border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 text-gray-700 dark:text-gray-200 shadow-xs active:scale-95 transition-all gap-1.5 whitespace-nowrap"
                    >
                        <Download size={14} className="shrink-0" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading directory...</div>
            ) : viewType === 'tree' ? (
                <div className="space-y-2">
                    {/* Mobile helper tip */}
                    <div className="sm:hidden bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-xl text-[11px] font-medium flex items-center gap-2 border border-blue-100 dark:border-blue-900/30">
                        <Sparkles size={13} className="shrink-0" />
                        <span>Swipe or drag across the tree to view divisions and staff reporting.</span>
                    </div>

                    <div className="org-tree-container rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs relative">
                        <div className="org-zoom-controls">
                            <button
                                type="button"
                                onClick={() => handleZoom(0.1)}
                                className="bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/20 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                title="Zoom In"
                            >
                                <Plus size={16} className="text-slate-900 dark:text-white" strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleZoom(-0.1)}
                                className="bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/20 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                title="Zoom Out"
                            >
                                <Minus size={16} className="text-slate-900 dark:text-white" strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={resetZoom}
                                className="bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/20 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                title="Reset Zoom"
                            >
                                <RotateCcw size={16} className="text-slate-900 dark:text-white" strokeWidth={2.5} />
                            </button>
                        </div>
                        <div 
                            className={`tree-scroll-pane ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
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
                                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                    transformOrigin: 'center top'
                                }}
                            >
                                <ul>
                                    {deptTree.map(node => (
                                        <TreeNode key={node.id} node={node} />
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Native Mobile Contact Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredEmployees.map((emp) => {
                        const deptName = departments.find(d => d._id === emp.department_id)?.name;
                        const roleName = roles.find(r => r.id === emp.role_id)?.name || (emp.role || '').replace('_', ' ');
                        const cleanPhone = (emp.phone || '').replace(/[^0-9]/g, '');

                        return (
                            <Card 
                                key={emp._id || emp.id} 
                                className="rounded-2xl border-slate-200/80 dark:border-white/10 hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-slate-900 shadow-xs"
                            >
                                <CardContent className="p-3.5 sm:p-4 space-y-3">
                                    {/* Member Header */}
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <UserAvatar
                                                src={emp.image_url}
                                                name={emp.full_name}
                                                size="lg"
                                                className="w-12 h-12 rounded-xl border border-slate-100 dark:border-white/10 shadow-2xs"
                                            />
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Active"></span>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                    {emp.full_name || 'Team Member'}
                                                </h3>
                                                {emp.employee_id && (
                                                    <span className="shrink-0 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                                                        #{emp.employee_id}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <Badge variant={getRoleBadgeVariant(emp.role || 'default')} className="text-[10px] font-semibold px-2 py-0 uppercase">
                                                    {roleName}
                                                </Badge>
                                                {deptName && (
                                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Briefcase size={10} className="opacity-70" />
                                                        {deptName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-slate-50/70 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                        {emp.email && (
                                            <div className="flex items-center gap-2 truncate">
                                                <Mail size={13} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{emp.email}</span>
                                            </div>
                                        )}
                                        {emp.phone && (
                                            <div className="flex items-center gap-2 truncate font-mono text-[11px]">
                                                <Phone size={13} className="text-slate-400 shrink-0" />
                                                <span>{emp.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Native One-Tap Action Buttons (Symmetric & Equally Divided) */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                        {emp.phone ? (
                                            <>
                                                <a
                                                    href={`tel:${emp.phone}`}
                                                    className="flex-1 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                                                    title="Call"
                                                >
                                                    <Phone size={13} />
                                                    <span>Call</span>
                                                </a>
                                                <a
                                                    href={`https://wa.me/${cleanPhone}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 h-8 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                                                    title="WhatsApp"
                                                >
                                                    <MessageSquare size={13} />
                                                    <span>WhatsApp</span>
                                                </a>
                                            </>
                                        ) : null}

                                        {emp.email ? (
                                            <a
                                                href={`mailto:${emp.email}`}
                                                className={`${emp.phone ? 'flex-1' : 'w-full'} h-8 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95`}
                                                title="Email"
                                            >
                                                <Mail size={13} />
                                                <span>Email</span>
                                            </a>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!loading && filteredEmployees.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
                    <Users className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No team members found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query or department filter</p>
                </div>
            )}
        </div>
    );
}
