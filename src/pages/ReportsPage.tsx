import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { 
  FileText, Download, Filter, Calendar as CalendarIcon, 
  TrendingUp, Users, Award, MapPin, PhoneCall 
} from 'lucide-react';

export function ReportsPage() {
  const { profile } = useAuth();
  
  // Default date range: current month to today
  const defaultDates = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    return {
      start: formatDate(firstDay),
      end: formatDate(today)
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'leads' | 'sales' | 'visits' | 'executives'>('leads');
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [sourceFilter, setSourceFilter] = useState('All Sources');

  const reportData = useQuery(api.reports.getReportsData, profile?.tenant_id ? {
    tenant_id: profile.tenant_id as Id<"tenants">,
    profileId: profile.id as Id<"profiles">,
    startDate,
    endDate,
    sourceFilter
  } : "skip");

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!reportData) return;
    
    let dataToExport: any[] = [];
    let headers: string[] = [];
    let filename = `${activeTab}_report`;
    
    if (activeTab === 'leads') {
      headers = ['Lead ID', 'Customer Name', 'Mobile', 'Source', 'Status', 'Date', 'Project', 'Assigned Executive'];
      dataToExport = (reportData.leadsReport?.detailedRegister || []).map(l => [
        l.leadId, l.customerName, l.mobile, l.source, l.status, l.date, l.projectName, l.executiveName
      ]);
    } else if (activeTab === 'sales') {
      headers = ['Customer Name', 'Project', 'Unit Number', 'Area (SqFt)', 'Total Revenue', 'Booking Amount', 'Date', 'Executive'];
      dataToExport = (reportData.salesReport?.detailedRegister || []).map(s => [
        s.customerName, s.projectName, s.unitNumber, s.areaSqft, s.totalRevenue, s.bookingAmount, s.date, s.executiveName
      ]);
    } else if (activeTab === 'visits') {
      headers = ['Customer Name', 'Mobile', 'Project', 'Executive', 'Visit Date', 'Status'];
      dataToExport = (reportData.siteVisitsReport?.detailedRegister || []).map(v => [
        v.customerName, v.mobile, v.projectName, v.executiveName, v.visitDate, v.status
      ]);
    } else if (activeTab === 'executives') {
      headers = ['Executive Name', 'Role', 'Total Assigned', 'Converted', 'Conversion %', 'Site Visits Done', 'Total Revenue'];
      dataToExport = (reportData.executivePerformanceReport?.detailedRegister || []).map(e => [
        e.executiveName, e.role, e.totalAssigned, e.converted, e.conversionRate.toFixed(2) + '%', e.siteVisitsDone, e.totalRevenue
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0D1B2A] dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400" /> CRM Analytics Reports
          </h1>
          <p className="text-gray-500 mt-1">Export, track, and download metrics across lead channels, bookings, and executive achievements.</p>
        </div>
        <div>
          <Button 
            onClick={handleExportCSV} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-sm font-semibold transition-all duration-200"
            disabled={!reportData}
          >
            <Download size={18} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5 gap-1.5 w-fit">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'leads'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-gray-100 dark:border-slate-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <PhoneCall size={16} className={activeTab === 'leads' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
          Leads Report
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'sales'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-gray-100 dark:border-slate-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <TrendingUp size={16} className={activeTab === 'sales' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
          Sales & Revenue
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'visits'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-gray-100 dark:border-slate-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <MapPin size={16} className={activeTab === 'visits' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
          Site Visits
        </button>
        <button
          onClick={() => setActiveTab('executives')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'executives'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-gray-100 dark:border-slate-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Award size={16} className={activeTab === 'executives' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
          Executive Performance
        </button>
      </div>

      {/* Filters Card */}
      <Card className="rounded-2xl border border-gray-100 dark:border-white/5">
        <CardContent className="p-5 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm">
            <Filter size={18} /> Report Filters:
          </div>
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {activeTab === 'leads' && (
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All Sources">All Sources</option>
                  <option value="Meta">Meta</option>
                  <option value="99acres">99acres</option>
                  <option value="MagicBrick">MagicBrick</option>
                  <option value="Housing">Housing</option>
                  <option value="Google">Google</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Spinner */}
      {!reportData ? (
        <Card className="rounded-2xl min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeTab === 'leads' && (
              <>
                <KPICardItem title="Total Leads Imported" value={reportData.leadsReport?.totalLeadsImported} icon={Users} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
                <KPICardItem title="Converted Leads" value={reportData.leadsReport?.convertedLeads} icon={TrendingUp} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
                <KPICardItem title="Site Visits Scheduled" value={reportData.leadsReport?.siteVisitsScheduled} icon={MapPin} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" />
              </>
            )}
            {activeTab === 'sales' && (
              <>
                <KPICardItem title="Total Sales Value" value={`₹${reportData.salesReport?.totalSalesValue.toLocaleString()}`} icon={TrendingUp} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
                <KPICardItem title="Total Bookings" value={reportData.salesReport?.totalBookings} icon={Users} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
                <KPICardItem title="Avg. Revenue Per Sale" value={`₹${Math.round(reportData.salesReport?.averageRevenue).toLocaleString()}`} icon={Award} color="text-purple-600 bg-purple-50 dark:bg-purple-500/10" />
              </>
            )}
            {activeTab === 'visits' && (
              <>
                <KPICardItem title="Total Site Visits" value={reportData.siteVisitsReport?.totalVisits} icon={MapPin} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
                <KPICardItem title="Visits Scheduled" value={reportData.siteVisitsReport?.scheduled} icon={CalendarIcon} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" />
                <KPICardItem title="Visits Done" value={reportData.siteVisitsReport?.done} icon={Users} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
              </>
            )}
            {activeTab === 'executives' && (
              <>
                <KPICardItem title="Total Executives" value={reportData.executivePerformanceReport?.totalExecutives} icon={Users} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
                <KPICardItem title="Best Performer" value={reportData.executivePerformanceReport?.bestPerformer} icon={Award} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" />
                <KPICardItem title="Total Leads Assigned" value={reportData.executivePerformanceReport?.totalLeadsAssigned} icon={PhoneCall} color="text-purple-600 bg-purple-50 dark:bg-purple-500/10" />
              </>
            )}
          </div>

          {/* Detailed Register Table */}
          <Card className="rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-white/5">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-white">Detailed Register</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {activeTab === 'leads' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Lead ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="pr-6">Assigned Executive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.leadsReport?.detailedRegister || []).length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No leads found in this period</TableCell></TableRow>
                    ) : (
                      (reportData.leadsReport?.detailedRegister || []).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-mono text-xs pl-6">{lead.leadId}</TableCell>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{lead.customerName}</TableCell>
                          <TableCell>{lead.mobile}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-700/30">{lead.source}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.status === 'Converted' ? 'success' : 'info'}>{lead.status}</Badge>
                          </TableCell>
                          <TableCell>{lead.date}</TableCell>
                          <TableCell className="font-medium">{lead.projectName}</TableCell>
                          <TableCell className="pr-6">{lead.executiveName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'sales' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Customer Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Area (SqFt)</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Booking Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="pr-6">Executive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.salesReport?.detailedRegister || []).length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No sales recorded in this period</TableCell></TableRow>
                    ) : (
                      (reportData.salesReport?.detailedRegister || []).map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200 pl-6">{sale.customerName}</TableCell>
                          <TableCell className="font-medium">{sale.projectName}</TableCell>
                          <TableCell>{sale.unitNumber}</TableCell>
                          <TableCell>{sale.areaSqft.toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">₹{sale.totalRevenue.toLocaleString()}</TableCell>
                          <TableCell>₹{sale.bookingAmount.toLocaleString()}</TableCell>
                          <TableCell>{sale.date}</TableCell>
                          <TableCell className="pr-6">{sale.executiveName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'visits' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Customer Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Executive</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.siteVisitsReport?.detailedRegister || []).length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No site visits scheduled in this period</TableCell></TableRow>
                    ) : (
                      (reportData.siteVisitsReport?.detailedRegister || []).map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200 pl-6">{visit.customerName}</TableCell>
                          <TableCell>{visit.mobile}</TableCell>
                          <TableCell className="font-medium">{visit.projectName}</TableCell>
                          <TableCell>{visit.executiveName}</TableCell>
                          <TableCell>{visit.visitDate}</TableCell>
                          <TableCell className="pr-6">
                            <Badge variant={['trip_completed', 'completed', 'done', 'approved'].includes(visit.status.toLowerCase()) ? 'success' : 'warning'}>
                              {visit.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'executives' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Executive Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Total Assigned</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Site Visits Done</TableHead>
                      <TableHead className="pr-6">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.executivePerformanceReport?.detailedRegister || []).length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No executive records found</TableCell></TableRow>
                    ) : (
                      (reportData.executivePerformanceReport?.detailedRegister || []).map((exec, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200 pl-6">{exec.executiveName}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{exec.role}</TableCell>
                          <TableCell>{exec.totalAssigned}</TableCell>
                          <TableCell className="font-semibold">{exec.converted}</TableCell>
                          <TableCell className="font-medium text-indigo-600 dark:text-indigo-400">{exec.conversionRate.toFixed(2)}%</TableCell>
                          <TableCell>{exec.siteVisitsDone}</TableCell>
                          <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 pr-6">₹{exec.totalRevenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// KPI Item Component
function KPICardItem({ title, value, icon: Icon, color }: { title: string, value: any, icon: any, color: string }) {
  return (
    <Card className="rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex items-center p-5 gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${color}`}>
        <Icon size={24} />
      </div>
      <div className="space-y-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</div>
      </div>
    </Card>
  );
}
