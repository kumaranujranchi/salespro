import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
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
  const leads = useQuery(
    api.leads.listAllLeadsForTenant,
    tenantId ? { tenant_id: tenantId, profileId: profile?.id } : "skip"
  );

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
            <div className="md:col-span-9 flex justify-center items-center h-[350px]">
              {funnelData.every((d: any) => d.value === 0) ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data available for funnel
                </div>
              ) : (
                <div className="w-full max-w-[550px] h-full">
                  <svg viewBox="0 0 600 320" className="w-full h-full">
                    {/* Definitions for drop shadows */}
                    <defs>
                      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
                      </filter>
                    </defs>

                    {/* Stage 1: OPEN (Top Layer) */}
                    <g className="cursor-pointer group">
                      <polygon
                        points="60,20 340,20 300,85 100,85"
                        fill="#2196F3"
                        opacity="0.9"
                        filter="url(#shadow)"
                        className="transition-all duration-300 hover:opacity-100 hover:scale-[1.01]"
                      />
                      <title>{`OPEN: ${funnelData[0].value} leads`}</title>
                      {/* Connecting Line */}
                      <path d="M 320,52.5 L 380,52.5" stroke="#2196F3" strokeWidth="1.5" strokeDasharray="3,3" />
                      {/* Text Label */}
                      <text x="390" y="57" className="fill-slate-700 dark:fill-slate-200 text-sm font-semibold">
                        OPEN: <tspan className="fill-blue-600 dark:fill-blue-400 font-bold">{`${funnelData[0].value} (${((funnelData[0].value / (stats.total || 1)) * 100).toFixed(1)}%)`}</tspan>
                      </text>
                    </g>

                    {/* Stage 2: IN PROGRESS */}
                    <g className="cursor-pointer group">
                      <polygon
                        points="104,90 296,90 260,155 140,155"
                        fill="#3F51B5"
                        opacity="0.9"
                        filter="url(#shadow)"
                        className="transition-all duration-300 hover:opacity-100 hover:scale-[1.01]"
                      />
                      <title>{`IN PROGRESS: ${funnelData[1].value} leads`}</title>
                      <path d="M 278,122.5 L 380,122.5" stroke="#3F51B5" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="390" y="127" className="fill-slate-700 dark:fill-slate-200 text-sm font-semibold">
                        IN PROGRESS: <tspan className="fill-indigo-600 dark:fill-indigo-400 font-bold">{`${funnelData[1].value} (${((funnelData[1].value / (stats.total || 1)) * 100).toFixed(1)}%)`}</tspan>
                      </text>
                    </g>

                    {/* Stage 3: Site Visit Scheduled */}
                    <g className="cursor-pointer group">
                      <polygon
                        points="144,160 256,160 220,225 180,225"
                        fill="#00E676"
                        opacity="0.9"
                        filter="url(#shadow)"
                        className="transition-all duration-300 hover:opacity-100 hover:scale-[1.01]"
                      />
                      <title>{`Site Visit Scheduled: ${funnelData[2].value} leads`}</title>
                      <path d="M 238,192.5 L 380,192.5" stroke="#00E676" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="390" y="197" className="fill-slate-700 dark:fill-slate-200 text-sm font-semibold">
                        Site Visit Scheduled: <tspan className="fill-green-600 dark:fill-green-400 font-bold">{`${funnelData[2].value} (${((funnelData[2].value / (stats.total || 1)) * 100).toFixed(1)}%)`}</tspan>
                      </text>
                    </g>

                    {/* Stage 4: Site Visit Done */}
                    <g className="cursor-pointer group">
                      <polygon
                        points="184,230 216,230 200,295 200,295"
                        fill="#FF9800"
                        opacity="0.9"
                        filter="url(#shadow)"
                        className="transition-all duration-300 hover:opacity-100 hover:scale-[1.01]"
                      />
                      <title>{`Site Visit Done: ${funnelData[3].value} leads`}</title>
                      <path d="M 208,262.5 L 380,262.5" stroke="#FF9800" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="390" y="267" className="fill-slate-700 dark:fill-slate-200 text-sm font-semibold">
                        Site Visit Done: <tspan className="fill-orange-600 dark:fill-orange-400 font-bold">{`${funnelData[3].value} (${((funnelData[3].value / (stats.total || 1)) * 100).toFixed(1)}%)`}</tspan>
                      </text>
                    </g>
                  </svg>
                </div>
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
