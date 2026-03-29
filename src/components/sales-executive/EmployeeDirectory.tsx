import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Download, Eye, Network, LayoutGrid, User as UserIcon, Briefcase, Plus, Minus, RotateCcw } from 'lucide-react';
import { buildOrgTree } from '../../utils/orgTree';
import { Badge } from '../ui/Badge';
import { ActionMenu } from '../ui/ActionMenu';
export function EmployeeDirectory() {
    const { profile } = useAuth();
    const tenantId = profile?.tenant_id as Id<"tenants">;

    // Convex Queries
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
    const [viewType, setViewType] = useState<'grid' | 'tree'>('tree');
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
        // Only trigger drag if clicking the background area, not a button or action menu
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

    const employees = (employeesData || []).filter((e: Doc<"profiles">) => e.role !== 'super_admin');
    const roles = rolesData || [];
    const departments = departmentsData || [];
    const loading = !employeesData || !rolesData || !departmentsData;

    const filteredEmployees = employees.filter((emp: Doc<"profiles">) => {
        const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    const getRoleBadgeVariant = (role: string) => {
        if (role === 'super_admin') return 'danger';
        if (role === 'admin') return 'warning';
        if (role === 'director') return 'default';
        if (role === 'team_leader') return 'info';
        if (role === 'sales_executive') return 'success';
        return 'secondary';
    };

    const deptTree = useMemo(() => {
        if (viewType !== 'tree') return [];
        
        // Only show departments that have at least one employee in our current employee set
        const deptsWithEmployees = departments.filter(dept => 
            employees.some(emp => emp.department_id === dept._id)
        );

        if (deptsWithEmployees.length === 0 && employees.length > 0) {
            // Fallback: If no departments match but we have employees, show standard tree
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
                                    {node.image_url ? (
                                        <img src={node.image_url} alt="" className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400">
                                            {(node.full_name || 'U').charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white text-center leading-tight mb-1">{node.full_name || 'Anonymous'}</h3>
                                <div className="mb-2">
                                    <Badge variant={getRoleBadgeVariant(node.role || 'default')} className="px-2 py-0 h-5 text-[10px] uppercase">
                                        {roles.find(r => r.id === node.role_id)?.name || (node.role || '').replace('_', ' ')}
                                    </Badge>
                                </div>
                                
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 text-center">
                                    {node.email}
                                </div>

                                <div className="flex items-center gap-1">
                                    <ActionMenu
                                        align="left"
                                        actions={[
                                            {
                                                label: 'View Details',
                                                icon: Eye,
                                                onClick: () => {} 
                                            }
                                        ]}
                                    />
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
        const csvData = filteredEmployees.map(emp => [
            emp.full_name,
            emp.role,
            emp.email,
            emp.phone || '',
            emp.department_id || '',
            emp.employee_id
        ]);

        const csvContent = [headers, ...csvData].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'employee_directory.csv';
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/10 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-slate-100 dark:border-white/10">
                        <button
                            onClick={() => setViewType('tree')}
                            className={`p-1.5 rounded-md transition-all ${viewType === 'tree' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Tree View"
                        >
                            <Network size={18} />
                        </button>
                        <button
                            onClick={() => setViewType('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewType === 'grid' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <div className="flex-1 md:w-64">
                        <Input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            rightIcon={<Search size={18} />}
                            className="dark:bg-white/5 dark:text-white dark:border-white/10"
                        />
                    </div>
                </div>
                <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2 dark:text-white dark:border-white/10 dark:hover:bg-white/10 w-full md:w-auto justify-center">
                    <Download size={18} /> Export CSV
                </Button>
            </div>

            <>
            {loading ? (
                <p className="col-span-3 text-center py-10 text-gray-500 dark:text-gray-400">Loading directory...</p>
            ) : viewType === 'tree' ? (
                <div className="org-tree-container">
                    <div className="org-zoom-controls">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleZoom(0.1)}
                            className="bg-white dark:bg-slate-800 shadow-xl border-2 border-slate-200 dark:border-white/20 p-2.5 h-auto rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                            title="Zoom In"
                        >
                            <Plus size={18} className="text-slate-900 dark:text-white" strokeWidth={3} />
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleZoom(-0.1)}
                            className="bg-white dark:bg-slate-800 shadow-xl border-2 border-slate-200 dark:border-white/20 p-2.5 h-auto rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                            title="Zoom Out"
                        >
                            <Minus size={18} className="text-slate-900 dark:text-white" strokeWidth={3} />
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={resetZoom}
                            className="bg-white dark:bg-slate-800 shadow-xl border-2 border-slate-200 dark:border-white/20 p-2.5 h-auto rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                            title="Reset Zoom"
                        >
                            <RotateCcw size={18} className="text-slate-900 dark:text-white" strokeWidth={3} />
                        </Button>
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
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredEmployees.map((emp) => (
                        <Card key={emp.id} className="hover:shadow-md transition-shadow overflow-hidden dark:bg-surface-dark dark:border-white/10">
                            <CardContent className="p-4 md:p-6 flex items-center gap-4">
                                <div className="flex-shrink-0 h-16 w-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-white/10 shadow-sm">
                                    {emp.image_url ? (
                                        <img
                                            src={emp.image_url}
                                            alt={emp.full_name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <UserIcon size={32} className={`text-gray-400 dark:text-gray-500 ${emp.image_url ? 'hidden' : ''}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate" title={emp.full_name}>{emp.full_name}</h3>
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium capitalize truncate">{emp.role.replace('_', ' ')}</p>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                                        <p className="truncate" title={emp.email}>{emp.email}</p>
                                        <p className="truncate">{emp.phone}</p>
                                        <p className="text-xs bg-gray-100 dark:bg-white/10 inline-block px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 mt-1">ID: {emp.employee_id}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            </>

            {!loading && filteredEmployees.length === 0 && (
                <div className="text-center py-10 text-gray-500">No employees found matching your search.</div>
            )}
        </div>
    );
}
