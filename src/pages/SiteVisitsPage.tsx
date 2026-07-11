import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SiteVisitRequestForm } from '../components/site-visits/SiteVisitRequestForm';
import { SiteVisitApprovalModal } from '../components/site-visits/SiteVisitApprovalModal';
import { DriverTripModal } from '../components/site-visits/DriverTripModal';
import { Calendar, Plus, MapPin, Clock, Trash2, Car, User, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function SiteVisitsPage() {
  const { profile } = useAuth();
  const dialog = useDialog();

  // Selection
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  // Filtering
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const canViewAll = ['super_admin', 'admin', 'director'].includes(normalizedRole);
  const canManage = ['super_admin', 'admin'].includes(normalizedRole);
  const isDriver = normalizedRole === 'driver';
  const isSales = normalizedRole === 'sales_executive' || normalizedRole === 'team_leader';

  // State for Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Convex Queries
  const { results: visits, status, loadMore } = usePaginatedQuery(
    api.site_visits.listSiteVisits, 
    profile?.id ? {
      tenant_id: profile.tenant_id as Id<"tenants">,
      role: profile.role,
      userId: profile.id as Id<"profiles">,
      filterStatus
    } : "skip",
    { initialNumItems: 15 }
  );

  // Convex Mutations
  const deleteVisitMutation = useMutation(api.site_visits.deleteSiteVisit);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedVisits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedVisits(newSet);
  };

  const handleDelete = async (id: Id<"site_visits">) => {
    const confirmed = await dialog.confirm('Are you sure you want to delete this site visit request?', {
      variant: 'danger',
      confirmText: 'Yes, Delete',
      title: 'Delete Request'
    });

    if (!confirmed) return;

    try {
      await deleteVisitMutation({ id });
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
      default: return 'warning';
    }
  };

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
          {status === 'LoadingFirstPage' ? (
            <LoadingSpinner size="lg" className="min-h-[400px]" />
          ) : visits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car className="mx-auto text-gray-300 mb-3" size={48} />
              <p>No site visits found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map(visit => {
                const isExpanded = expandedVisits.has(visit._id);
                const showDetails = !canViewAll || isExpanded;

                return (
                  <div key={visit._id} className="border rounded-lg bg-white dark:bg-white/5 dark:border-white/10 overflow-hidden">
                    <div
                      className={`p-4 flex flex-col md:flex-row justify-between items-start gap-4 ${canViewAll ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}
                      onClick={canViewAll ? () => toggleExpand(visit._id) : undefined}
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
                            <Badge variant={getStatusColor(visit.status)}>{visit.status.replace('_', ' ')}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <User size={14} /> Created by: {visit.requester?.full_name || 'System'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                         {isDriver && (visit.status === 'approved' || visit.status === 'trip_started') && (
                          <Button variant="primary" size="sm" onClick={() => { setSelectedVisit(visit); setIsDriverModalOpen(true); }}>
                            {visit.status === 'approved' ? 'Start Trip' : 'Complete Trip'}
                          </Button>
                        )}
                        {canManage && (visit.status === 'pending') && (
                          <Button variant="primary" size="sm" onClick={() => { setSelectedVisit(visit); setIsApprovalModalOpen(true); }}>Review</Button>
                        )}
                        {isSales && visit.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(visit._id)} className="text-red-500"><Trash2 size={16}/></Button>
                        )}
                      </div>
                    </div>

                    {showDetails && (
                      <div className="p-4 pt-0 border-t dark:border-white/10 bg-gray-50/30 dark:bg-black/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                           <div className="flex items-center gap-2"><MapPin size={16}/><span className="font-medium">{visit.pickup_location}</span></div>
                           <div className="flex items-center gap-2"><Clock size={16}/><span className="font-medium">{visit.visit_date} at {visit.visit_time}</span></div>
                           <div className="flex items-center gap-2"><Car size={16}/><span>Driver: {visit.driver?.full_name || 'Unassigned'}</span></div>
                        </div>
                        {visit.notes && <p className="mt-3 text-sm text-gray-500 italic">Notes: {visit.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}

              {status === 'CanLoadMore' && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => loadMore(10)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Load More Site Visits
                  </Button>
                </div>
              )}

              {status === 'LoadingMore' && (
                <div className="flex justify-center pt-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SiteVisitRequestForm isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} editingVisit={selectedVisit} onSuccess={() => {}} />
      <SiteVisitApprovalModal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} visit={selectedVisit} onSuccess={() => {}} />
      <DriverTripModal isOpen={isDriverModalOpen} onClose={() => setIsDriverModalOpen(false)} visit={selectedVisit} onSuccess={() => {}} />
    </div>
  );
}
