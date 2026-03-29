import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import {
  FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Colors from the reference image
const COLORS = {
  funnel: ['#2196F3', '#3F51B5', '#00E676', '#FF9800'], // Blue, Deep Blue, Green, Orange
  inProgress: ['#F44336', '#00BCD4', '#FFEB3B', '#CDDC39', '#9C27B0', '#0D47A1'], // Red, Cyan, Yellow, Lime, Purple, Dark Blue
  lost: ['#F44336', '#03A9F4', '#FFEB3B', '#9E9D24', '#7B1FA2', '#1A237E', '#263238'] // Red, Light Blue, Yellow, Olive, Purple, Indigo, Dark Grey
};

export function PipelinePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const tenantId = profile?.tenant_id as Id<"tenants">;

  // Convex Query
  const leads = useQuery(api.leads.listLeadsByTenant, tenantId ? { tenant_id: tenantId } : "skip");

  const { stats, funnelData, inProgressData, lostData } = useMemo(() => {
    if (!leads) return { stats: { total: 0, inProgress: 0, closed: 0 }, funnelData: [], inProgressData: [], lostData: [] };

    const currentLeads = leads;

    // 2. Process Statistics
    const total = currentLeads.length;
    const closed = currentLeads.filter((l: any) => l.lead_status === 'Converted').length;

    const inProgressStatuses = ['In Progress', 'Contacted', 'Qualified', 'Site Visit Scheduled', 'Site Visit Done'];
    const inProgressCount = currentLeads.filter((l: any) => inProgressStatuses.includes(l.lead_status)).length;

    const stats = {
      total: total,
      inProgress: inProgressCount,
      closed: closed
    };

    // 3. Funnel Data (Open -> In Progress -> Scheduled -> Done)
    const openLeads = currentLeads.filter((l: any) => l.lead_status === 'New').length;
    const funnelInProgress = currentLeads.filter((l: any) => ['In Progress', 'Contacted', 'Qualified'].includes(l.lead_status)).length;
    const svScheduled = currentLeads.filter((l: any) => l.lead_status === 'Site Visit Scheduled').length;
    const svDone = currentLeads.filter((l: any) => l.lead_status === 'Site Visit Done').length;

    const funnelData = [
      { name: 'OPEN', value: openLeads, fill: COLORS.funnel[0] },
      { name: 'IN PROGRESS', value: funnelInProgress, fill: COLORS.funnel[1] },
      { name: 'Site Visit Scheduled', value: svScheduled, fill: COLORS.funnel[2] },
      { name: 'Site Visit Done', value: svDone, fill: COLORS.funnel[3] },
    ];

    // 4. In-Progress Donut Data (Tags)
    const ipLeads = currentLeads.filter((l: any) => inProgressStatuses.includes(l.lead_status));

    let d_cold = 0;
    let d_pending = 0; // Overdue
    let d_warm = 0;
    let d_engaged = 0; // Hot
    let d_qualified = 0;
    let d_general = 0; // Fallback

    ipLeads.forEach((l: any) => {
      let matched = false;

      // Priority 1: Status Qualified
      if (l.lead_status === 'Qualified') {
        d_qualified++;
        matched = true;
      }

      // Priority 2: Overdue Follow-up
      if (!matched && l.overdue_followup) {
        d_pending++;
        matched = true;
      }

      // Priority 3: Score
      if (!matched) {
        if (l.lead_score === 'Hot') d_engaged++;
        else if (l.lead_score === 'Warm') d_warm++;
        else if (l.lead_score === 'Cold') d_cold++;
        else d_general++;
      }
    });

    const inProgressData = [
      { name: 'Cold', value: d_cold, color: COLORS.inProgress[0] },
      { name: 'Follow-Up Pending', value: d_pending, color: COLORS.inProgress[1] },
      { name: 'Warm', value: d_warm, color: COLORS.inProgress[2] },
      { name: 'Engaged Lead', value: d_engaged, color: COLORS.inProgress[3] },
      { name: 'Qualified Lead', value: d_qualified, color: COLORS.inProgress[5] },
      { name: 'General In-Progress', value: d_general, color: '#607D8B' },
    ].filter(d => d.value > 0);

    // 5. Lost Chart Data breakdown by Reason
    const lostLeadsList = currentLeads.filter((l: any) => ['Lost', 'Disqualified'].includes(l.lead_status));

    const lostReasonCounts: Record<string, number> = {};
    lostLeadsList.forEach((l: any) => {
      let reason = 'General';
      if (l.lead_status === 'Disqualified') reason = 'Disqualified';
      else if (l.metadata && (l.metadata as any).lost_reason) reason = (l.metadata as any).lost_reason;

      lostReasonCounts[reason] = (lostReasonCounts[reason] || 0) + 1;
    });

    const lostData = Object.entries(lostReasonCounts).map(([name, value], index) => ({
      name: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value,
      color: COLORS.lost[index % COLORS.lost.length]
    }));

    return { stats, funnelData, inProgressData, lostData };
  }, [leads]);

  if (leads === undefined) return <LoadingSpinner fullScreen />;

  const CustomLegend = ({ data }: { data: any[] }) => (
    <div className="mt-6 flex flex-col gap-2 w-full max-h-64 overflow-y-auto pr-2 custom-scrollbar">
      {data.map((entry, index) => (
        <div key={index} className="flex items-center justify-between text-xs md:text-sm p-1 hover:bg-slate-50 rounded">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="w-3 h-3 md:w-4 md:h-4 rounded-[2px] flex-shrink-0"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-gray-600 dark:text-gray-300 truncate" title={entry.name}>
              {entry.name}
            </span>
          </div>
          <span className="font-medium text-gray-500">({entry.value})</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent p-4 md:p-6 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-0 hover:bg-transparent"
          >
            <ArrowLeft size={24} className="text-slate-700 dark:text-white" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
              For Land Sales Pipeline
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Top Section: LEAD FUNNEL BY STAGES */}
      <Card className="shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden dark:bg-surface-dark">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-surface-dark">
          <h2 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">LEAD FUNNEL BY STAGES</h2>
        </div>
        <CardContent className="p-6 bg-white dark:bg-surface-dark">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: KPI Cards Stack */}
            <div className="md:col-span-3 flex flex-col gap-4 justify-center">
              {/* Total Leads */}
              <div className="border border-slate-300 dark:border-white/10 rounded p-4 text-center hover:shadow-md transition-all bg-white dark:bg-white/5">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">TOTAL LEADS</div>
                <div className="text-xl font-bold text-slate-700 dark:text-white">{stats.total}</div>
              </div>
              {/* Total In-Progress */}
              <div className="border border-slate-300 dark:border-white/10 rounded p-4 text-center hover:shadow-md transition-all bg-white dark:bg-white/5">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">TOTAL IN-PROGRESS</div>
                <div className="text-xl font-bold text-slate-700 dark:text-white">{stats.inProgress}</div>
              </div>
              {/* Total Closed */}
              <div className="border border-slate-300 dark:border-white/10 rounded p-4 text-center hover:shadow-md transition-all bg-white dark:bg-white/5">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">TOTAL CLOSED</div>
                <div className="text-xl font-bold text-slate-700 dark:text-white">{stats.closed}</div>
              </div>
            </div>

            {/* Right: Funnel Chart */}
            <div className="md:col-span-9 h-[300px]">
              {funnelData.every((d: any) => d.value === 0) ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data available for funnel
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart margin={{ top: 20, right: 150, bottom: 20, left: 20 }}>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                      width="40%"
                      stroke="#fff"
                    >
                      <LabelList
                        position="right"
                        dataKey="name"
                        content={(props: any) => {
                          const { x, y, width, index, fill } = props;
                          const item = funnelData[index];
                          const numericValue = item?.value || 0;
                          const name = item?.name || '';

                          const total = funnelData.reduce((acc, curr) => acc + curr.value, 0);
                          const percent = total > 0 ? ((numericValue / total) * 100).toFixed(2) : '0';

                          const startX = x + width;

                          return (
                            <g>
                              <line x1={startX} y1={y} x2={startX + 30} y2={y} stroke={fill} strokeWidth={1} />
                              <text x={startX + 35} y={y} dy={4} fill="#333" fontSize={12} fontWeight="bold">
                                {name} ({percent}%)
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Bottom Section: LEADS BY TAGS */}
      <Card className="shadow-sm border border-slate-200 dark:border-white/10 dark:bg-surface-dark">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-surface-dark">
          <h2 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">LEADS BY TAGS</h2>
        </div>
        <CardContent className="p-6 bg-white dark:bg-surface-dark">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Left Chart: IN-PROGRESS */}
            <div className="flex flex-col items-center">
              <div className="h-[250px] w-full relative">
                {inProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inProgressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {inProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No active in-progress tags
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase mb-4 mt-2">IN-PROGRESS</h3>
              <CustomLegend data={inProgressData} />
            </div>

            {/* Right Chart: LOST */}
            <div className="flex flex-col items-center">
              <div className="h-[250px] w-full relative">
                {lostData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={lostData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      >
                        {lostData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No lost leads data
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase mb-4 mt-2">LOST</h3>
              <CustomLegend data={lostData} />
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
