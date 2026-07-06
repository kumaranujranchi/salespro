import { useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, Clock, MapPin, CheckCircle2,
  XCircle, PhoneCall, Globe, UserPlus, Phone, UserCheck, Calendar
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function CRMDashboardPage() {
  const { profile } = useAuth();
  
  const stats = useQuery(api.leads.getDashboardStats, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    executive_id: profile.role === 'sales_executive' ? profile.id as Id<"profiles"> : undefined
  } : "skip");

  if (!stats) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-gray-500">Overview of leads and conversion funnel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Leads" value={stats.totalLeads} icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
        <KPICard title="Open" value={stats.openLeads} icon={Clock} iconColor="text-yellow-600" iconBgColor="bg-yellow-100" />
        <KPICard title="In Progress" value={stats.inProgress} icon={TrendingUp} iconColor="text-purple-600" iconBgColor="bg-purple-100" />
        <KPICard title="Site Visit" value={stats.siteVisitDone} icon={MapPin} iconColor="text-green-600" iconBgColor="bg-green-100" />
        <KPICard title="Converted" value={stats.converted} icon={CheckCircle2} iconColor="text-emerald-600" iconBgColor="bg-emerald-100" />
        <KPICard title="Walk-in" value={stats.walkInLeads} icon={Users} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <SourceBar label="Referral" count={stats.referralLeads || 0} total={stats.totalLeads} color="bg-indigo-500" />
                  <SourceBar label="99acres" count={stats.acresLeads || 0} total={stats.totalLeads} color="bg-yellow-500" />
                  <SourceBar label="MagicBrick" count={stats.magicBrickLeads || 0} total={stats.totalLeads} color="bg-red-500" />
                  <SourceBar label="Housing" count={stats.housingLeads || 0} total={stats.totalLeads} color="bg-blue-500" />
                  <SourceBar label="Meta" count={stats.metaLeads || 0} total={stats.totalLeads} color="bg-pink-500" />
                  <SourceBar label="Google" count={stats.googleLeads || 0} total={stats.totalLeads} color="bg-emerald-500" />
                  <SourceBar label="Walk-in" count={stats.walkInLeads || 0} total={stats.totalLeads} color="bg-gray-500" />
               </div>
            </CardContent>
         </Card>
         
         <div className="space-y-4">
            <Link to="/leads" className="block">
               <Card className="bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  <CardContent className="p-6">
                     <h3 className="text-xl font-bold mb-1">Manage Leads</h3>
                     <p className="opacity-80 text-sm">View full lead list and follow-up history</p>
                  </CardContent>
               </Card>
            </Link>
            <Link to="/crm/pipeline" className="block">
               <Card className="bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                  <CardContent className="p-6">
                     <h3 className="text-xl font-bold mb-1">Sales Pipeline</h3>
                     <p className="opacity-80 text-sm">Visualize your conversion stages</p>
                  </CardContent>
               </Card>
            </Link>
         </div>
      </div>
    </div>
  );
}

function SourceBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
   const percentage = total > 0 ? (count / total) * 100 : 0;
   return (
      <div className="space-y-1">
         <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span className="font-bold">{count}</span>
         </div>
         <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
         </div>
      </div>
   );
}
