import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useMutation, usePaginatedQuery } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { Button } from '../components/ui/Button';
import { SiteVisitRequestForm } from '../components/site-visits/SiteVisitRequestForm';
import { SiteVisitApprovalModal } from '../components/site-visits/SiteVisitApprovalModal';
import { DriverTripModal } from '../components/site-visits/DriverTripModal';
import { 
  Calendar, Plus, MapPin, Clock, Trash2, Car, User, 
  ChevronDown, ChevronUp, RefreshCw, Phone, Building, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { format, parseISO } from 'date-fns';

export function SiteVisitsPage() {
  const { profile, tenant } = useAuth();
  const dialog = useDialog();

  // Selection
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  // Filtering
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>('all');

  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const canViewAll = ['super_admin', 'admin', 'director'].includes(normalizedRole);
  const canManage = ['super_admin', 'admin'].includes(normalizedRole);
  const isDriver = normalizedRole === 'driver';
  const isSales = normalizedRole === 'sales_executive' || normalizedRole === 'team_leader';

  // Check tenant configuration for Global vs Private Site Visits visibility
  const isGlobalConfigured = tenant?.settings?.site_visits?.global_visibility !== false;

  // State for Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const targetTenantId = (profile?.tenant_id || (tenant as any)?._id || (tenant as any)?.id);

  // Backend queries
  const { results: visits, status, loadMore } = usePaginatedQuery(
    api.site_visits.listSiteVisits, 
    profile?.id ? {
      tenant_id: targetTenantId as Id<"tenants">,
      role: profile.role,
      userId: profile.id as Id<"profiles">,
      filterStatus,
      scope: isGlobalConfigured ? scopeFilter : 'my',
    } : "skip",
    { initialNumItems: 15 }
  );

  // Backend mutations
  const deleteVisitMutation = useMutation(api.site_visits.deleteSiteVisit);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedVisits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedVisits(newSet);
  };

  const handleDelete = async (id: Id<"site_visits">) => {
    const confirmed = await dialog.confirm('Are you sure you want to cancel this site visit request?', {
      variant: 'danger',
      confirmText: 'Yes, Cancel',
      title: 'Cancel Request'
    });

    if (!confirmed) return;

    try {
      await deleteVisitMutation({ id });
      await dialog.alert('Site visit request cancelled successfully.', { variant: 'success', title: 'Cancelled' });
    } catch (error) {
      console.error('Error deleting site visit:', error);
      await dialog.alert('Failed to cancel site visit.', { variant: 'danger', title: 'Error' });
    }
  };

  const formatVisitDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = parseISO(dateStr);
      let dateFormatted = dateStr;
      if (!isNaN(d.getTime())) {
        dateFormatted = format(d, 'EEE, dd MMM yyyy');
      }
      if (!timeStr) return dateFormatted;
      
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parts[1];
        if (!isNaN(h)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          return `${dateFormatted} • ${hour12}:${m} ${ampm}`;
        }
      }
      return `${dateFormatted} • ${timeStr}`;
    } catch {
      return `${dateStr} ${timeStr || ''}`;
    }
  };

  const getStatusBadge = (visitStatus: string) => {
    switch (visitStatus) {
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      case 'trip_started':
        return {
          label: 'In Progress',
          className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
        };
      case 'pending':
        return {
          label: 'Pending Approval',
          className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      case 'pending_clarification':
        return {
          label: 'Needs Clarification',
          className: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800'
        };
      case 'declined':
        return {
          label: 'Declined',
          className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
      default:
        return {
          label: (visitStatus || 'Unknown').replace(/_/g, ' '),
          className: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/10'
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        {/* Main Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-100/80 dark:from-emerald-950/50 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Site Visits</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {visits ? `${visits.length} Bookings` : 'Loading...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {canViewAll 
                  ? 'Manage, approve, and assign fleet for visit requests' 
                  : isDriver 
                  ? 'Your scheduled customer pickup & drop trips' 
                  : 'Schedule and track customer site inspections'}
              </p>
            </div>
          </div>

          {!isDriver && (
            <Button
              variant="gradient"
              onClick={() => { setSelectedVisit(null); setIsRequestModalOpen(true); }}
              className="self-stretch sm:self-auto justify-center h-10 px-4 text-xs font-semibold rounded-xl shadow-xs"
            >
              <Plus size={16} className="mr-1.5" />
              Schedule Visit
            </Button>
          )}
        </div>

        {/* Filters & Segmented Switcher Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Segmented Control for Global Company Schedule vs My Requests */}
          {isGlobalConfigured && !canViewAll && !isDriver ? (
            <div className="grid grid-cols-2 p-1 bg-slate-100/80 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 w-full sm:w-80">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Building size={14} className="shrink-0" />
                <span>Company Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('my')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                  scopeFilter === 'my'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <User size={14} className="shrink-0" />
                <span>My Requests</span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{canViewAll ? 'All Company Bookings' : isDriver ? 'Assigned Driver Trips' : 'My Visit Requests'}</span>
            </div>
          )}

          {/* Status Dropdown */}
          <div className="w-full sm:w-52">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs h-9 dark:text-gray-200 rounded-xl"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved & Scheduled' },
                { value: 'trip_started', label: 'In Progress / On Road' },
                { value: 'completed', label: 'Completed' },
                { value: 'declined', label: 'Declined' },
                ...(isSales ? [{ value: 'pending_clarification', label: 'Needs Clarification' }] : [])
              ]}
            />
          </div>
        </div>
      </div>

      {/* Visits List */}
      <div>
        {status === 'LoadingFirstPage' ? (
          <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <LoadingSpinner size="lg" />
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Car size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No Site Visits Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {filterStatus !== 'all' 
                  ? `There are no site visits matching the "${filterStatus}" filter.`
                  : scopeFilter === 'my'
                  ? "You haven't requested any site visits yet."
                  : 'No upcoming site visits scheduled for this company yet.'}
              </p>
            </div>
            {!isDriver && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => { setSelectedVisit(null); setIsRequestModalOpen(true); }}
                className="rounded-xl px-5 text-xs font-semibold shadow-xs"
              >
                <Plus size={16} className="mr-1.5" /> Schedule First Visit
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map(visit => {
              const isExpanded = expandedVisits.has(visit._id);
              const statusInfo = getStatusBadge(visit.status);
              const isMyRequest = visit.requested_by === profile?.id;
              const hasDriver = Boolean(visit.driver_name || visit.driver?.full_name);
              const driverPhone = visit.driver_phone || visit.driver?.phone;
              const customerPhone = visit.mobile || visit.lead_mobile;

              return (
                <div
                  key={visit._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 space-y-3">
                    {/* Top Row: Customer & Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-50 to-teal-100/80 dark:from-emerald-950/50 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm shrink-0 border border-emerald-500/20">
                          {(visit.customer_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {visit.customer_name}
                            </span>
                            {isMyRequest && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                                My Request
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            {customerPhone && (
                              <a
                                href={`tel:${customerPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <Phone size={11} />
                                <span>{customerPhone}</span>
                              </a>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <User size={11} />
                              <span>By: {isMyRequest ? 'You' : (visit.requested_by_name || 'Team Member')}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${statusInfo.className}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Route & Schedule Info Grid */}
                    <div className="bg-slate-50/80 dark:bg-white/5 rounded-xl p-2.5 sm:p-3 border border-slate-100 dark:border-white/5 space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Time */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                            <Clock size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Time</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {formatVisitDateTime(visit.visit_date, visit.visit_time)}
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                            <MapPin size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Pickup</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {visit.pickup_location || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Driver Row */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                            <Car size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Fleet & Driver</span>
                            <span className={`font-semibold block truncate ${hasDriver ? 'text-slate-800 dark:text-slate-200' : 'text-amber-600 dark:text-amber-400'}`}>
                              {hasDriver ? (visit.driver_name || visit.driver?.full_name) : 'Pending Driver Assignment'}
                            </span>
                          </div>
                        </div>

                        {driverPhone && (
                          <a
                            href={`tel:${driverPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 shrink-0 shadow-2xs"
                          >
                            <Phone size={11} />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Notes (if any) */}
                    {visit.notes && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl px-3 py-2">
                        <strong className="text-amber-800 dark:text-amber-300">Notes: </strong>
                        {visit.notes}
                      </div>
                    )}

                    {/* Rejection / Clarification notes */}
                    {visit.rejection_reason && (
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 rounded-xl px-3 py-2">
                        <strong>Declined: </strong>{visit.rejection_reason}
                      </div>
                    )}
                    {visit.clarification_note && (
                      <div className="text-[11px] text-orange-700 dark:text-orange-300 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/60 rounded-xl px-3 py-2">
                        <strong>Clarification: </strong>{visit.clarification_note}
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    {((canManage && visit.status === 'pending') || 
                      (isDriver && (visit.status === 'approved' || visit.status === 'trip_started')) ||
                      (isSales && visit.status === 'pending')) && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
                        {canManage && visit.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => { setSelectedVisit(visit); setIsApprovalModalOpen(true); }}
                            className="h-8 px-3.5 text-xs font-semibold rounded-xl"
                          >
                            Review & Assign
                          </Button>
                        )}
                        {isDriver && (visit.status === 'approved' || visit.status === 'trip_started') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => { setSelectedVisit(visit); setIsDriverModalOpen(true); }}
                            className="h-8 px-3.5 text-xs font-semibold rounded-xl"
                          >
                            {visit.status === 'approved' ? 'Start Trip' : 'Complete Trip'}
                          </Button>
                        )}
                        {isSales && visit.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(visit._id)}
                            className="h-8 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                          >
                            <Trash2 size={13} className="mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {status === 'CanLoadMore' && (
              <div className="flex justify-center pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => loadMore(10)}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold shadow-xs transition-colors"
                >
                  <RefreshCw size={14} className="text-emerald-600" />
                  <span>Load More Visits</span>
                </button>
              </div>
            )}

            {status === 'LoadingMore' && (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <SiteVisitRequestForm isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} editingVisit={selectedVisit} onSuccess={() => {}} />
      <SiteVisitApprovalModal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} visit={selectedVisit} onSuccess={() => {}} />
      <DriverTripModal isOpen={isDriverModalOpen} onClose={() => setIsDriverModalOpen(false)} visit={selectedVisit} onSuccess={() => {}} />
    </div>
  );
}
