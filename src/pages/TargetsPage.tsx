import { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TargetFormModal } from '../components/targets/TargetFormModal';
import { Plus, Pencil, Trash2, Target as TargetIcon, Lock } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { isSameMonth, parseISO, startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { toast } from 'sonner';

export function TargetsPage() {
  const { profile, tenant } = useAuth();
  const dialog = useDialog();
  
  const targetModel = tenant?.settings?.general?.target_model || 'area';
  const [activeMetric, setActiveMetric] = useState<'area' | 'revenue' | 'units'>('revenue');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);

  const isExecutive = profile?.role === 'sales_executive';
  const canManage = ['super_admin', 'admin', 'director', 'team_leader'].includes(profile?.role || '');

  // Convex Queries
  const targets = useQuery(api.targets.listTargets, profile?.tenant_id ? { 
    tenant_id: profile.tenant_id as Id<"tenants">,
    user_id: selectedUserId ? selectedUserId as Id<"profiles"> : undefined,
    year: selectedYear
  } : "skip");

  const sales = useQuery(api.sales.listSales, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    executive_id: selectedUserId ? selectedUserId as Id<"profiles"> : undefined
  } : "skip");

  const staff = useQuery(api.profiles.listUsersByTenant, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    is_active: true
  } : "skip");

  // Mutations
  const deleteTarget = useMutation(api.targets.deleteTarget);

  const handleDelete = async (id: Id<"sales_targets">) => {
    if (!await dialog.confirm('Delete this target?')) return;
    try {
      await deleteTarget({ id });
      toast.success("Target deleted");
    } catch (err) {
      toast.error("Failed to delete target");
    }
  };

  const chartData = useMemo(() => {
    if (!targets || !sales) return [];
    
    const months = eachMonthOfInterval({ 
      start: startOfYear(new Date(parseInt(selectedYear), 0, 1)), 
      end: endOfYear(new Date(parseInt(selectedYear), 0, 1)) 
    });

    return months.map(monthDate => {
      const mStr = format(monthDate, 'MMM');
      const mMatch = (d: string) => isSameMonth(parseISO(d), monthDate);
      
      const target = targets.find(t => mMatch(t.start_date));
      const monthSales = sales.filter(s => mMatch(s.sale_date));

      return {
        month: mStr,
        target: target ? (activeMetric === 'revenue' ? target.target_amount : activeMetric === 'units' ? target.target_units : target.target_sqft) : 0,
        achievement: activeMetric === 'revenue' 
          ? monthSales.reduce((sum, s) => sum + s.total_revenue, 0)
          : activeMetric === 'units' ? monthSales.length : monthSales.reduce((sum, s) => sum + s.area_sqft, 0)
      };
    });
  }, [targets, sales, activeMetric, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Target Management</h1>
          <p className="text-gray-500">Track performance against set goals</p>
        </div>
        {canManage && <Button onClick={() => { setEditingTarget(null); setIsModalOpen(true); }}><Plus size={18} className="mr-2"/> Assign Target</Button>}
      </div>

      <Card>
        <CardContent className="py-4 flex gap-4">
           {!isExecutive ? (
             <Select
               label="Member"
               value={selectedUserId}
               onChange={e => setSelectedUserId(e.target.value)}
               options={staff?.map(s => ({ label: s.full_name, value: s._id })) || []}
               className="w-64"
             />
           ) : <div className="p-2 bg-gray-50 rounded border text-sm">Viewing Your Targets</div>}
           <Select
             label="Year"
             value={selectedYear}
             onChange={e => setSelectedYear(e.target.value)}
             options={[2024, 2025, 2026].map(y => ({ label: y.toString(), value: y.toString() }))}
             className="w-32"
           />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 min-h-[400px]">
            <CardHeader><CardTitle>Performance Chart</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
               {(!targets || !sales) ? <LoadingSpinner/> : (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="month" />
                       <YAxis />
                       <Tooltip />
                       <Legend />
                       <Bar dataKey="target" name="Target" fill="#94a3b8" />
                       <Bar dataKey="achievement" name="Achieved" fill="#00E576" />
                    </BarChart>
                 </ResponsiveContainer>
               )}
            </CardContent>
         </Card>
         <Card>
            <CardHeader><CardTitle>Annual Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-500">Total Target</p>
                    <p className="text-2xl font-bold">{chartData.reduce((s, c) => s + c.target, 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-500">Total Achieved</p>
                    <p className="text-2xl font-bold">{chartData.reduce((s, c) => s + c.achievement, 0).toLocaleString()}</p>
                </div>
            </CardContent>
         </Card>
      </div>

      <TargetFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {}} editingTarget={editingTarget} />
    </div>
  );
}
