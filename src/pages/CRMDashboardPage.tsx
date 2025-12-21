import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { KPICard } from '../components/ui/KPICard';
import {
  Users, TrendingUp, Clock, MapPin, CheckCircle2,
  XCircle, PhoneCall, Globe, UserPlus, Phone, UserCheck, Calendar
} from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  openLeads: number;
  inProgress: number;
  siteVisitDone: number;
  onHold: number;
  converted: number;
  walkInLeads: number;
  adsLeads: number;
  referenceLeads: number;
  channelPartnerLeads: number;
  dailyStats: { assigned: number; called: number; contacted: number };
}

export function CRMDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    openLeads: 0,
    inProgress: 0,
    siteVisitDone: 0,
    onHold: 0,
    converted: 0,
    walkInLeads: 0,
    adsLeads: 0,
    referenceLeads: 0,
    channelPartnerLeads: 0,
    dailyStats: { assigned: 0, called: 0, contacted: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [leadTrends, setLeadTrends] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // 1. Resolve Team/User Context
      let targetIds: string[] = [];
      
      if (profile.role === 'sales_executive') {
        targetIds = [profile.id];
      } else if (profile.role === 'team_leader') {
         const { data: teamMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('reporting_manager_id', profile.id);
        targetIds = [profile.id, ...(teamMembers?.map(m => m.id) || [])];
      }
      // For admin/other, targetIds might be empty (implies all, or handled by filtering logic)
      // But CRMDashboard mainly relies on client filtering? No, lines 52+ used query filtering.
      // If targetIds is empty and role is admin, we might show all for tenant.
      
      // 2. Prepare Queries
      let mainQuery = supabase.from('leads').select('*', { count: 'exact' });
      mainQuery = mainQuery.eq('tenant_id', profile.tenant_id);

      if (targetIds.length > 0) {
        mainQuery = mainQuery.in('sales_executive_id', targetIds);
      }

      // Daily Stats Queries
      const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00';
      let dailyAssignedQuery = supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', todayStr).eq('tenant_id', profile.tenant_id);
      let dailyActivitiesQuery = supabase.from('lead_followups').select('lead_id, new_status, created_by').gte('created_at', todayStr);

      if (targetIds.length > 0) {
        dailyAssignedQuery = dailyAssignedQuery.in('sales_executive_id', targetIds);
        dailyActivitiesQuery = dailyActivitiesQuery.in('created_by', targetIds);
      }

      // 3. Execute Queries
      const [
        { data: allLeads, error: mainError },
        { count: dailyAssignedCount },
        { data: dailyActivities }
      ] = await Promise.all([
        mainQuery,
        dailyAssignedQuery,
        dailyActivitiesQuery
      ]);

      if (mainError) throw mainError;

      // 4. Process Data
      const leads = allLeads || [];
      
      const calledLeads = new Set(dailyActivities?.map((a: any) => a.lead_id));
      const contactedLeads = new Set(dailyActivities?.filter((a: any) => a.new_status === 'Contacted').map((a: any) => a.lead_id));

      setStats({
        totalLeads: leads.length,
        openLeads: leads.filter(l => l.lead_status === 'New').length,
        inProgress: leads.filter(l => ['Contacted', 'Qualified', 'Site Visit Scheduled'].includes(l.lead_status)).length,
        siteVisitDone: leads.filter(l => l.lead_status === 'Site Visit Done' || l.metadata?.site_visit_done === true).length,
        onHold: leads.filter(l => l.metadata?.on_hold === true).length,
        converted: leads.filter(l => l.lead_status === 'Converted').length,
        walkInLeads: leads.filter(l => l.lead_source === 'Walk-in').length,
        adsLeads: leads.filter(l => l.lead_source === 'Ads').length,
        referenceLeads: leads.filter(l => l.lead_source === 'Reference').length,
        channelPartnerLeads: leads.filter(l => l.lead_source === 'Channel Partner').length,
        dailyStats: {
            assigned: dailyAssignedCount || 0,
            called: calledLeads.size,
            contacted: contactedLeads.size
        }
      });

      // Calculate lead trends (last 7 days)
      const today = new Date();
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const count = leads.filter(l => {
          const leadDate = new Date(l.created_at).toISOString().split('T')[0];
          return leadDate === dateStr;
        }).length;

        trends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        });
      }
      setLeadTrends(trends);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1673FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">
          CRM Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
          Overview of your leads and pipeline
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Leads */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLeads}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Leads</div>
          </CardContent>
        </Card>

        {/* Open Leads */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.openLeads}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Open Leads</div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
          </CardContent>
        </Card>

        {/* Site Visit Done */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="text-green-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.siteVisitDone}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Site Visit Done</div>
          </CardContent>
        </Card>

        {/* On Hold */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="text-orange-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onHold}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">On Hold</div>
          </CardContent>
        </Card>

        {/* Converted */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.converted}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Converted</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Calendar */}
      <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="text-emerald-600" size={20} />
            Daily Activity Calendar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Leads Assigned Today"
              value={stats.dailyStats.assigned}
              icon={UserPlus}
              subtitle="New Opportunities"
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <KPICard
              title="Leads Called Today"
              value={stats.dailyStats.called}
              icon={Phone}
              subtitle="Active Engagement"
              iconBgColor="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <KPICard
              title="Contacted Today"
              value={stats.dailyStats.contacted}
              icon={UserCheck}
              subtitle="Successful Connections"
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>
      </div>

      {/* Lead Trends */}
      <Card className="dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10">
        <CardHeader className="dark:border-white/10">
          <CardTitle className="dark:text-white">Lead Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leadTrends.map((trend, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{trend.date}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-end pr-3 text-white text-sm font-semibold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      style={{ width: `${Math.max((trend.count / Math.max(...leadTrends.map(t => t.count))) * 100, 5)}%` }}
                    >
                      {trend.count > 0 && trend.count}
                    </div>
                  </div>
                </div>
                <div className="w-12 text-sm font-medium text-gray-900 dark:text-white">
                  {trend.count}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leads by Type */}
      <Card className="dark:bg-surface-dark dark:border-white/10 dark:ring-1 dark:ring-white/10">
        <CardHeader className="dark:border-white/10">
          <CardTitle className="dark:text-white">Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Walk-in Leads */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-transparent dark:to-transparent dark:bg-surface-dark rounded-lg border border-blue-200 dark:border-white/10 dark:ring-1 dark:ring-white/10 transition-all hover:dark:bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <Users className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Walk-in</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.walkInLeads}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalLeads > 0 ? Math.round((stats.walkInLeads / stats.totalLeads) * 100) : 0}% of total
              </div>
            </div>

            {/* Ads Leads */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-transparent dark:to-transparent dark:bg-surface-dark rounded-lg border border-purple-200 dark:border-white/10 dark:ring-1 dark:ring-white/10 transition-all hover:dark:bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                  <Globe className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Ads</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.adsLeads}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalLeads > 0 ? Math.round((stats.adsLeads / stats.totalLeads) * 100) : 0}% of total
              </div>
            </div>

            {/* Reference Leads */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-transparent dark:to-transparent dark:bg-surface-dark rounded-lg border border-green-200 dark:border-white/10 dark:ring-1 dark:ring-white/10 transition-all hover:dark:bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                  <PhoneCall className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Reference</span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.referenceLeads}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalLeads > 0 ? Math.round((stats.referenceLeads / stats.totalLeads) * 100) : 0}% of total
              </div>
            </div>

            {/* Channel Partner Leads */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-transparent dark:to-transparent dark:bg-surface-dark rounded-lg border border-orange-200 dark:border-white/10 dark:ring-1 dark:ring-white/10 transition-all hover:dark:bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                  <Users className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Channel Partner</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.channelPartnerLeads}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats.totalLeads > 0 ? Math.round((stats.channelPartnerLeads / stats.totalLeads) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0 shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
          <CardContent className="p-6 relative z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110"></div>
            <h3 className="text-xl font-bold mb-2">View All Contacts</h3>
            <p className="text-emerald-100 mb-4 text-sm">
              Access and manage all your leads in one place
            </p>
            <Link to="/leads">
              <Button variant="outline" className="bg-white text-emerald-700 hover:bg-emerald-50 border-0 font-semibold shadow-sm">
                Go to Contacts →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-600 to-teal-800 text-white border-0 shadow-lg shadow-teal-900/20 relative overflow-hidden group">
          <CardContent className="p-6 relative z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110"></div>
            <h3 className="text-xl font-bold mb-2">Sales Pipeline</h3>
            <p className="text-teal-100 mb-4 text-sm">
              Visualize your lead funnel and conversion rates
            </p>
            <Link to="/crm/pipeline">
              <Button variant="outline" className="bg-white text-teal-700 hover:bg-teal-50 border-0 font-semibold shadow-sm">
                View Pipeline →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
