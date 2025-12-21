import { useState } from 'react';
import { Award, ShieldCheck, Flag, CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface IncentivePlanSummaryProps {
  tenant: any;
}

export function IncentivePlanSummary({ tenant }: IncentivePlanSummaryProps) {
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // Safely get plan from tenant settings
  const plan = tenant?.settings?.incentive_plan;

  // Fallback data for safety (Matching user's image rules)
  const defaultTiers = [
    { min: 0, max: 2999, rate: 1, label: 'Slab 1' },
    { min: 3000, max: 5000, rate: 2, label: 'Slab 2' },
    { min: 5001, max: 7000, rate: 3, label: 'Slab 3' },
    { min: 7100, max: null, rate: 4, label: 'Slab 4' }
  ];

  const defaultConditions = [
    "Bookings are eligible only after the agreement is finalized.",
    "Payouts follow a Quarterly Cycle (e.g., Q1 Jan-Mar paid in April).",
    "Cancellations adjust the incentive amount in the next cycle."
  ];

  const defaultMilestones = [
    { pct: 30, desc: 'of customer payment received', label: 'Milestone 1' },
    { pct: 50, desc: 'of customer payment received', label: 'Milestone 2' },
    { pct: 75, desc: 'of customer payment received', label: 'Milestone 3' },
    { pct: 100, desc: 'once Land Registry is completed', label: 'Final Release' }
  ];

  const getActivePlanSummary = () => {
    if (!plan || plan.type === 'manual') return 'Manual Only';
    
    const tiersCount = Array.isArray(plan.rules?.tiers) ? plan.rules.tiers.length : defaultTiers.length;
    return `Slab-Based (${tiersCount} Tiers)`;
  };

  // If no automated plan is configured, don't show the summary component
  if (!plan || plan.type === 'manual') return null;

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 border-amber-200/50 dark:border-white/10 overflow-hidden mb-6">
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Active Incentive Plan: {getActivePlanSummary()}</h3>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 truncate max-w-[200px] sm:max-w-none">
                Rule-based automated calculations are active for your company
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPlanDetails(!showPlanDetails)}
            className="p-2 hover:bg-amber-100 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
          >
            {showPlanDetails ? <ChevronUp className="text-amber-500" /> : <ChevronDown className="text-amber-500" /> }
          </button>
        </div>

        {showPlanDetails && (
          <div className="p-4 pt-0 border-t border-amber-200/30 dark:border-white/10 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              {/* Column 1: Configured Rules (Slabs/Projects) */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-amber-900/40 dark:text-amber-200/40 uppercase tracking-widest flex items-center gap-2">
                  <Award size={14} className="text-amber-500" />
                  Incentive Structure
                </h4>
                <div className="space-y-3">
                  <div className="border border-amber-200/30 dark:border-white/5 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-black/10">
                     <table className="w-full text-[11px]">
                       <thead className="bg-amber-100/50 dark:bg-white/5 text-amber-900/60 dark:text-amber-200/40 font-bold uppercase">
                         <tr>
                           <th className="px-3 py-2 text-left">Slab (Sq Ft)</th>
                           <th className="px-3 py-2 text-right">Rate</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-amber-100 dark:divide-white/5">
                         {(Array.isArray(plan?.rules?.tiers) ? plan.rules.tiers : defaultTiers).map((t: any, i: number) => (
                           <tr key={i}>
                             <td className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">
                                {Number(t?.min || 0).toLocaleString()} - {t?.max ? Number(t.max).toLocaleString() : '∞'}
                             </td>
                             <td className="px-3 py-2.5 text-right font-bold text-amber-600">
                                {t?.rate || 0}%
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
                </div>
              </div>

              {/* Column 2: Rules & Conditions */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-blue-900/40 dark:text-blue-200/40 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-500" />
                  Rules & Conditions
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-blue-100 dark:border-white/5 space-y-3">
                    {(Array.isArray(plan?.rules?.conditions) ? plan.rules.conditions : defaultConditions).map((cond: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                         <p className="text-[11px] text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ 
                           __html: String(cond || '').replace(/agreement|Quarterly Cycle|Cancellations/g, "<b>$&</b>") 
                         }} />
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { q: 'Q1', m: 'Jan-Mar', p: 'Apr' },
                      { q: 'Q2', m: 'Apr-Jun', p: 'Jul' },
                      { q: 'Q3', m: 'Jul-Sep', p: 'Oct' },
                      { q: 'Q4', m: 'Oct-Dec', p: 'Jan' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 border border-blue-100/30 dark:border-white/5 rounded-lg bg-blue-50/50 dark:bg-black/10">
                        <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{item.q}: {item.m}</p>
                        <p className="text-[10px] text-gray-400 italic">Paid in {item.p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Payout Milestones */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-green-900/40 dark:text-green-200/40 uppercase tracking-widest flex items-center gap-2">
                  <Flag size={14} className="text-green-500" />
                  Payout Milestones
                </h4>
                <div className="space-y-3">
                  {(Array.isArray(plan?.rules?.milestones) ? plan.rules.milestones : defaultMilestones).map((m: any, idx: number, arr: any[]) => (
                    <div key={idx} className="relative pl-6 pb-4 last:pb-0">
                      {idx !== arr.length - 1 && <div className="absolute left-[7px] top-[14px] bottom-0 w-[1px] bg-green-100 dark:bg-green-900/30" />}
                      
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                        {m.pct === 100 ? <CheckCircle size={10} className="text-white" /> : <div className="w-1 h-1 rounded-full bg-green-500" />}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Release {m.pct}% Incentive</p>
                        <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">{m.label || `Milestone ${idx+1}`}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
