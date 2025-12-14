import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Sale, Profile } from '../types/database';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TargetFormModal } from '../components/targets/TargetFormModal';
import { useDialog } from '../contexts/DialogContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Pencil, Trash2, Target as TargetIcon, Lock } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { isSameMonth, parseISO, startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateTeamPerformance } from '../utils/targetCalculations';

export function TargetsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const [targets, setTargets] = useState<(Target & { profile: Profile })[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Roles
  const isExecutive = profile?.role === 'sales_executive';
  const canManage = ['super_admin', 'admin', 'sales_head', 'team_leader', 'director'].includes(profile?.role || '');
  const canAssign = ['super_admin', 'admin', 'sales_head'].includes(profile?.role || '');
  const isReadOnly = profile?.role === 'director';

  // Filters
  const [viewBy, setViewBy] = useState<'individual' | 'team'>('individual');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (profile) {
      if (isExecutive) {
        setSelectedUserId(profile.id);
        setViewBy('individual');
      }
      // Auto-select manager for Team Leaders
      if (profile.role === 'team_leader') {
        setManagerFilter(profile.id);
      }
      loadData();
    }
  }, [profile]);

  // Management Section States
  const [managerFilter, setManagerFilter] = useState('');
  const [execFilter, setExecFilter] = useState('');
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [managementData, setManagementData] = useState<(Target & { profile: Profile })[]>([]);

  const loadAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .select('*, profile:user_id(*)')
        .eq('user_id', execFilter)
        .eq('period_type', 'monthly')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setManagementData(data as (Target & { profile: Profile })[] || []);
      setAssignmentsLoaded(true);
    } catch (err) {
      console.error("Error loading assignments:", err);
      dialog.alert("Failed to load targets. Please try again.");
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [execFilter, dialog]);

  const loadData = useCallback(async () => {
    // Load Targets (Monthly Only)
    const { data: targetsData, error: targetError } = await supabase
      .from('sales_targets')
      .select('*, profile:user_id(*)')
      .eq('period_type', 'monthly')
      .order('start_date', { ascending: false });

    if (targetError) {
      console.error("Error loading targets:", targetError);
    }

    // Load Sales
    const { data: salesData } = await supabase
      .from('sales')
      .select('*');

    // Load Profiles for Dropdown
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['sales_executive', 'team_leader'])
      .eq('is_active', true);

    if (targetsData) setTargets(targetsData as (Target & { profile: Profile })[]);
    if (salesData) setSales(salesData);
    if (profilesData) setProfiles(profilesData);

    // Set default selected user if not set (and not executive)
    if (!isExecutive && profilesData && profilesData.length > 0 && !selectedUserId) {
      setSelectedUserId(profilesData[0].id);
    }
  }, [isExecutive, selectedUserId]); // Removed profilesData dependency to avoid loops, though strictly it should be handled

  useEffect(() => {
    if (profile) {
      if (isExecutive) {
        setSelectedUserId(profile.id);
        setViewBy('individual');
      }
      // Auto-select manager for Team Leaders
      if (profile.role === 'team_leader') {
        setManagerFilter(profile.id);
      }
      loadData();
    }
  }, [profile, isExecutive, loadData]);

  const handleDelete = async (id: string) => {
    if (!await dialog.confirm('Delete this target assignment?')) return;
    const { error } = await supabase.from('sales_targets').delete().eq('id', id);
    if (error) {
      await dialog.alert('Failed to delete.');
    } else {
      loadData();
    }
  };

  // Calculate Chart Data based on selected user/mode
  const calculationResults = useMemo(() => {
    if (!selectedUserId) return [];

    const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    let teamMembers: Profile[] = [];
    if (viewBy === 'team') {
      teamMembers = profiles.filter(p => p.reporting_manager_id === selectedUserId);
    }

    // Import dynamically or assume it's imported at top (I will add import via another tool call or assume previous step did it? No I need to add import)
    // For now, implementing logic using the util structure
    // We need to map over months and call calculateTeamPerformance
    
    return months.map(monthDate => {
      const monthStr = format(monthDate, 'MMM');
      const monthFilter = (dateStr: string) => isSameMonth(parseISO(dateStr), monthDate);

      if (viewBy === 'team') {
        const result = calculateTeamPerformance(selectedUserId, teamMembers, targets, sales, monthFilter);
        return {
          month: monthStr,
          monthDate,
          ...result,
          shortfall: result.target - result.achievement > 0 ? result.target - result.achievement : 0,
          surplus: result.achievement - result.target >= 0 ? result.achievement - result.target : 0
        };
      } else {
        // Individual View Logic (Default)
        const userTarget = targets.find(t => t.user_id === selectedUserId && t.start_date && monthFilter(t.start_date));
        const targetSqft = Number(userTarget?.target_sqft) || 0;
        
        const userSales = sales.filter(s => s.sales_executive_id === selectedUserId && s.sale_date && monthFilter(s.sale_date));
        const achievedSqft = userSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);
        
        const diff = achievedSqft - targetSqft;

        return {
          month: monthStr,
          monthDate,
          target: targetSqft,
          achievement: achievedSqft,
          targetSqft, // Keep compat with chart
          achievedSqft, // Keep compat with chart
          leaderTarget: targetSqft,
          teamTarget: 0,
          leaderAchievement: achievedSqft,
          teamAchievement: 0,
          missingTargets: [],
          shortfall: diff < 0 ? Math.abs(diff) : 0,
          surplus: diff > 0 ? diff : 0
        };
      }
    });

  }, [selectedUserId, viewBy, selectedYear, targets, sales, profiles]);

  const chartData = useMemo(() => {
    return calculationResults.map(c => ({
      month: c.month,
      targetSqft: c.target,
      achievedSqft: c.achievement,
      shortfall: c.shortfall,
      surplus: c.surplus
    }));
  }, [calculationResults]);


  const annualSummary = useMemo(() => {
    const totalTarget = calculationResults.reduce((sum, d) => sum + d.target, 0);
    const totalAchieved = calculationResults.reduce((sum, d) => sum + d.achievement, 0);
    const diff = totalAchieved - totalTarget;

    // Aggregate missing targets across the year for unique list
    const allMissing = new Set<string>();
    calculationResults.forEach(r => r.missingTargets.forEach(m => allMissing.add(m)));
    const missingTargetsList = Array.from(allMissing);

    return {
      totalTarget,
      totalAchieved,
      status: diff >= 0 ? 'Surplus' : 'Shortfall',
      diffAbs: Math.abs(diff),
      colorClass: diff >= 0 ? 'text-green-600' : 'text-red-600',
      bgClass: diff >= 0 ? 'bg-green-100' : 'bg-red-100',
      missingTargetsList
    };
  }, [calculationResults]);

  // Breakdown Calculation for Team View (Annual)
  const breakdown = useMemo(() => {
    if (viewBy !== 'team' || !selectedUserId) return null;
    
    const tlTotal = calculationResults.reduce((sum, r) => sum + r.leaderTarget, 0);
    const teamTotal = calculationResults.reduce((sum, r) => sum + r.teamTarget, 0);

    return { tlTotal, teamTotal };
  }, [calculationResults, viewBy, selectedUserId]);

  const userOptions = useMemo(() => {
    if (viewBy === 'individual') {
      return profiles;
    } else {
      return profiles.filter(p => p.role === 'team_leader');
    }
  }, [profiles, viewBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Target Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track Sq Ft Targets Monthly</p>
        </div>
        {canAssign && (
          <div className="flex gap-2">
            <Button onClick={() => { setEditingTarget(null); setIsModalOpen(true); }}>
              <Plus size={18} className="mr-2" /> Assign Monthly Target
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 flex flex-wrap gap-4 items-center">
          {!isExecutive ? (
            <>
              <Select
                label="View"
                value={viewBy}
                onChange={(e: any) => {
                  setViewBy(e.target.value as any);
                  setSelectedUserId('');
                }}
                options={[
                  { label: 'Individual (Sales Executive)', value: 'individual' },
                  { label: 'Team (Team Leader)', value: 'team' }
                ]}
                className="w-48 text-slate-900 dark:text-white"
              />
              <Select
                label={viewBy === 'team' ? "Select Team Leader" : "Select Sales Executive"}
                value={selectedUserId}
                onChange={(e: any) => setSelectedUserId(e.target.value)}
                options={userOptions.map(p => ({ label: p.full_name, value: p.id }))}
                className="w-64 text-slate-900 dark:text-white"
              />
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
              <Lock size={14} />
              <span className="text-sm font-medium">Viewing Your Performance</span>
            </div>
          )}
          <Select
            label="Year"
            value={selectedYear}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedYear(e.target.value)}
            options={Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return { label: y.toString(), value: y.toString() };
            })}
            className="w-32"
          />
        </CardContent>
      </Card>

      {/* Visualization & Table */}
      {selectedUserId && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <div className="lg:col-span-1 h-full">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-lg">Annual Summary ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Target (Sq Ft)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{annualSummary.totalTarget.toLocaleString()}</p>
                    {breakdown && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1 pl-2 border-l-2 border-gray-200 dark:border-white/10">
                        <div className="flex justify-between">
                          <span>Personal:</span>
                          <span>{breakdown.tlTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Team Members:</span>
                          <span>{breakdown.teamTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Achieved (Sq Ft)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{annualSummary.totalAchieved.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-lg bg-opacity-20 ${annualSummary.diffAbs >= 0 && annualSummary.status === 'Surplus' ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
                    <p className={`text-sm font-medium mb-1 ${annualSummary.diffAbs >= 0 && annualSummary.status === 'Surplus' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{annualSummary.status}</p>
                    <p className={`text-3xl font-bold ${annualSummary.colorClass} dark:${annualSummary.status === 'Surplus' ? 'text-green-400' : 'text-red-400'}`}>
                      {annualSummary.diffAbs.toLocaleString()} Sq Ft
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Right Column: Chart & Warning */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Warning for Missing Targets */}
              {annualSummary?.missingTargetsList && annualSummary.missingTargetsList.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                  <div className="p-1 bg-amber-100 dark:bg-amber-500/20 rounded-full text-amber-600 dark:text-amber-400">
                    <TargetIcon size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Missing Target Assignments</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      The following team members have incomplete target assignments for this year, affecting the total calculations:
                      <span className="font-medium ml-1">{annualSummary.missingTargetsList.slice(0, 5).join(', ')} {annualSummary.missingTargetsList.length > 5 && `+${annualSummary.missingTargetsList.length - 5} more`}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <Card className="h-full min-h-[400px]">
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} Sq Ft`, '']}
                        labelStyle={{ color: '#111' }}
                      />
                      <Legend />
                      <Bar dataKey="targetSqft" name="Target" fill="#94a3b8" />
                      <Bar dataKey="achievedSqft" name="Achieved" fill="#00E576" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon size={20} /> Monthly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left">Month</th>
                      <th className="px-4 py-3 text-right">Target (Sq Ft)</th>
                      <th className="px-4 py-3 text-right">Achieved (Sq Ft)</th>
                      <th className="px-4 py-3 text-right">Difference</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {chartData.map((data, index) => {
                      const diff = data.achievedSqft - data.targetSqft;
                      const isSurplus = diff >= 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-3 font-medium text-[#0A1C37] dark:text-white">{data.month}</td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{data.targetSqft.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-[#1673FF] dark:text-blue-400 font-medium">{data.achievedSqft.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-medium ${isSurplus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isSurplus ? '+' : '-'}{Math.abs(diff).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${isSurplus ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'}`}>
                              {isSurplus ? 'On Track' : 'Shortfall'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Target Management Table (List of defined targets for reference) - ADMIN ONLY */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil size={20} /> Manage Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filter Section for Management */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/10">
              <Select
                label="Select Team Leader"
                value={managerFilter}
                onChange={(e: any) => {
                  setManagerFilter(e.target.value);
                  setExecFilter(''); // Reset exec when TL changes
                  setAssignmentsLoaded(false); // Reset data
                }}
                options={profiles
                  .filter(p => p.role === 'team_leader')
                  .filter(p => profile?.role !== 'team_leader' || p.id === profile?.id)
                  .map(p => ({ label: p.full_name, value: p.id }))
                }
                className="w-full md:w-64"
              />

              <Select
                label="Select Sales Executive"
                value={execFilter}
                onChange={(e: any) => {
                  setExecFilter(e.target.value);
                  setAssignmentsLoaded(false);
                }}
                options={profiles
                  .filter(p => p.role === 'sales_executive')
                  .filter(p => !managerFilter || p.reporting_manager_id === managerFilter)
                  .map(p => ({ label: p.full_name, value: p.id }))
                }
                className="w-full md:w-64"
                disabled={!managerFilter}
              />

              <div className="flex gap-2">
                <Button
                  onClick={loadAssignments}
                  disabled={!managerFilter || !execFilter || isLoadingAssignments}
                  className="mb-[2px]"
                >
                  {isLoadingAssignments ? 'Loading...' : 'Load Data'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManagerFilter('');
                    setExecFilter('');
                    setAssignmentsLoaded(false);
                    setManagementData([]);
                  }}
                  disabled={!managerFilter && !execFilter}
                  className="mb-[2px] bg-white dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Instructional Text or Data Table */}
            {!assignmentsLoaded ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50/50 dark:bg-white/5 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10">
                <TargetIcon size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a Team Leader and Sales Executive to view assignments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {managementData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No targets found for this selection.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-medium">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Month</th>
                        <th className="px-4 py-3 text-right">Target (Sq Ft)</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {managementData.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-3 font-medium text-[#0A1C37] dark:text-white">{t.profile?.full_name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {t.start_date ? format(parseISO(t.start_date), 'MMMM yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium dark:text-gray-200">{(t.target_sqft || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {!isReadOnly && (
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingTarget(t); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10"><Pencil size={16} /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10" onClick={() => handleDelete(t.id)}><Trash2 size={16} /></Button>
                            </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <TargetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        editingTarget={editingTarget}
      />
    </div>
  );
}
