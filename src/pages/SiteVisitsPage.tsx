import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { supabase } from '../lib/supabase';
import { SiteVisit } from '../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SiteVisitRequestForm } from '../components/site-visits/SiteVisitRequestForm';
import { SiteVisitApprovalModal } from '../components/site-visits/SiteVisitApprovalModal';
import { DriverTripModal } from '../components/site-visits/DriverTripModal';
import { Calendar, Plus, MapPin, Clock, Trash2, Pencil, AlertCircle, Car, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { Tooltip } from '../components/ui/Tooltip';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function SiteVisitsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Selection
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  // Filtering
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const canViewAll = ['super_admin', 'admin', 'director'].includes(profile?.role || '');
  const canManage = ['super_admin', 'admin'].includes(profile?.role || '');
  const isDriver = profile?.role === 'driver';
  const isSales = profile?.role === 'sales_executive' || profile?.role === 'team_leader';

  useEffect(() => {
    loadVisits();
  }, [filterStatus]); // Reload when filter changes? Or just filter client side? Let's filter client side for smaller lists, but fetch all. 
  // Actually simpler to just load once and filter in render, or reload on specific actions.

  const loadVisits = async () => {
    setLoading(true);
    let query = supabase
      .from('site_visits')
      .select(`
        *,
        driver:driver_id (full_name),
        requester:requested_by (full_name)
      `)
      .order('visit_date', { ascending: false });

    // Filter last 30 days for non-admins (and non-directors)
    if (!canViewAll) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('visit_date', thirtyDaysAgo.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading visits:', error);
    } else {
      setVisits(data as any || []);
    }
    setLoading(false);
  };

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedVisits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedVisits(newSet);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm('Are you sure you want to delete this site visit request?', {
      variant: 'danger',
      confirmText: 'Yes, Delete',
      title: 'Delete Request'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('site_visits').delete().eq('id', id);
      if (error) throw error;
      loadVisits();
      await dialog.alert('Site visit request deleted.', { variant: 'success', title: 'Deleted' });
    } catch (error) {
      console.error('Error deleting site visit:', error);
      await dialog.alert('Failed to delete site visit.', { variant: 'danger', title: 'Error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'completed': return 'success';
      case 'declined': return 'danger';
      case 'trip_started': return 'info';
      case 'pending_clarification': return 'warning';
      default: return 'warning'; // pending
    }
  };

  const filteredVisits = visits.filter(v => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0A1C37] dark:text-white mb-2">Site Visits</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {canViewAll ? 'Manage and approve site visit requests' : isDriver ? 'Your assigned trips' : 'Schedule and track your site visits'}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Filter for everyone */}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40 h-[42px] dark:text-gray-200"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'declined', label: 'Declined' },
              { value: 'trip_started', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              ...(isSales ? [{ value: 'pending_clarification', label: 'Needs Clarification' }] : [])
            ]}
          />

          {(isSales && !canViewAll) && (
            <Button
              variant="primary"
              onClick={() => { setSelectedVisit(null); setIsRequestModalOpen(true); }}
              className="h-[42px] whitespace-nowrap"
            >
              <Plus size={18} className="mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <CardTitle>{canViewAll ? 'All Requests' : isDriver ? 'My Trips' : 'My Requests'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner size="lg" className="min-h-[400px]" />
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car className="mx-auto text-gray-300 mb-3" size={48} />
              <p>No site visits found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVisits.map(visit => {
                const isExpanded = expandedVisits.has(visit.id);
                // For non-admins, always show expanded content (or standard card view)
                // For admins, toggle based on state
                const showDetails = !canViewAll || isExpanded;

                return (
                  <div key={visit.id} className="border rounded-lg hover:shadow-md transition-all bg-white dark:bg-white/5 dark:border-white/10 group overflow-hidden">
                    {/* Header Section */}
                    <div
                      className={`p-4 flex flex-col md:flex-row justify-between items-start gap-4 ${canViewAll ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}
                      onClick={canViewAll ? () => toggleExpand(visit.id) : undefined}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {canViewAll && (
                          <div className="mt-1 text-gray-400">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#0A1C37] dark:text-white text-lg">{visit.customer_name}</h3>
                            <Badge variant={getStatusColor(visit.status)}>
                              {visit.status.replace('_', ' ')}
                            </Badge>
                            {canViewAll && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 ml-auto md:ml-2 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                <Clock size={12} />
                                {new Date(visit.visit_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <User size={14} /> Created by: {(visit as any).requester?.full_name || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Driver Actions */}
                        {isDriver && (visit.status === 'approved' || visit.status === 'trip_started') && (
                          <Button variant="primary" size="sm" onClick={() => { setSelectedVisit(visit); setIsDriverModalOpen(true); }}>
                            <Car size={16} className="mr-2" />
                            {visit.status === 'approved' ? 'Start Trip' : 'Complete Trip'}
                          </Button>
                        )}

                        {/* Admin Actions */}
                        {canManage && (
                          <>
                            {(visit.status === 'pending' || visit.status === 'pending_clarification') && (
                              <Button variant="primary" size="sm" onClick={() => { setSelectedVisit(visit); setIsApprovalModalOpen(true); }}>
                                Review
                              </Button>
                            )}
                            {visit.status === 'approved' && (
                              <Tooltip content="Edit Details">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedVisit(visit); setIsRequestModalOpen(true); }} className="text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                                  <Pencil size={16} />
                                </Button>
                              </Tooltip>
                            )}
                          </>
                        )}

                        {/* Sales Exec Actions */}
                        {isSales && (
                          <>
                            {(visit.status === 'pending' || visit.status === 'pending_clarification') && (
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedVisit(visit); setIsRequestModalOpen(true); }} className="text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                                <Pencil size={16} />
                                {visit.status === 'pending_clarification' && <span className="ml-1 text-xs text-orange-600 font-bold">Fix</span>}
                              </Button>
                            )}
                            {visit.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(visit.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Details Body */}
                    {showDetails && (
                      <div className={`p-4 pt-0 ${canViewAll ? 'bg-gray-50/50 dark:bg-white/5 border-t dark:border-white/10 p-4' : ''} animate-fadeIn`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-md border border-gray-100/50 dark:border-white/10">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500 dark:text-blue-400" />
                            <div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">Pickup</p>
                              <p className="font-medium text-gray-900 dark:text-white">{visit.pickup_location || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-500 dark:text-blue-400" />
                            <div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">Time</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(visit.visit_date).toLocaleDateString()} at {visit.visit_time}
                              </p>
                            </div>
                          </div>
                          {(canViewAll || isDriver || visit.driver_id) && (
                            <div className="flex items-center gap-2">
                              <Car size={16} className="text-blue-500 dark:text-blue-400" />
                              <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Driver</p>
                                <p className="font-medium text-gray-900 dark:text-white">{(visit as any).driver?.full_name || 'Unassigned'}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status Messages */}
                        {visit.rejection_reason && visit.status === 'declined' && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm rounded border border-red-100 dark:border-red-500/20 flex gap-2">
                            <AlertCircle size={16} className="mt-0.5" />
                            <div>
                              <span className="font-bold">Declined:</span> {visit.rejection_reason}
                            </div>
                          </div>
                        )}
                        {visit.clarification_note && visit.status === 'pending_clarification' && (
                          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm rounded border border-orange-100 dark:border-orange-500/20 flex gap-2">
                            <AlertCircle size={16} className="mt-0.5" />
                            <div>
                              <span className="font-bold">Clarification Needed:</span> {visit.clarification_note}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SiteVisitRequestForm
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={loadVisits}
        editingVisit={selectedVisit}
      />

      <SiteVisitApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSuccess={loadVisits}
        visit={selectedVisit}
      />

      <DriverTripModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSuccess={loadVisits}
        visit={selectedVisit}
      />

    </div>
  );
}

