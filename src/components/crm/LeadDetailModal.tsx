import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import {
  LeadWithRelations, LeadFollowup, FollowupType, CustomerResponse, LeadStatus, CallStatus
} from '../../types/database';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Phone, Mail, MapPin, Calendar, User,
  MessageSquare, Video, Send, AlertCircle, CheckCircle, XCircle,
  Clock
} from 'lucide-react';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithRelations;
}

export function LeadDetailModal({ isOpen, onClose, lead }: LeadDetailModalProps) {
  const { profile } = useAuth();
  const dialog = useDialog();

  const [followups, setFollowups] = useState<LeadFollowup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);

  // Follow-up Form State
  const [followupData, setFollowupData] = useState({
    followup_type: 'Call' as FollowupType,
    followup_date: new Date().toISOString().slice(0, 16),
    discussion_summary: '',
    customer_response: '' as CustomerResponse | '',
    call_status: 'Connected' as CallStatus,
    new_status: lead.lead_status,
    next_followup_date: '',
    lost_reason: ''
  });
  // Status State (for immediate UI updates)
  const [currentStatus, setCurrentStatus] = useState(lead.lead_status);

  useEffect(() => {
    setCurrentStatus(lead.lead_status);
  }, [lead.lead_status]);

  useEffect(() => {
    loadFollowups();
  }, [lead.id]);

  const loadFollowups = async () => {
    const { data, error } = await supabase
      .from('lead_followups')
      .select('*')
      .eq('lead_id', lead.id)
      .order('followup_date', { ascending: false });

    if (error) {
      console.error('Error loading followups:', error);
    } else {
      setFollowups(data || []);
    }
  };

  const handleAddFollowup = async () => {
    if (!profile) return;

    // Validation
    if (followupData.discussion_summary.trim().length < 20) {
      await dialog.alert('Discussion summary must be at least 20 characters', {
        variant: 'danger',
        title: 'Validation Error'
      });
      return;
    }

    if (!followupData.customer_response) {
      await dialog.alert('Please select customer response', {
        variant: 'danger',
        title: 'Validation Error'
      });
      return;
    }

    // Check if status changed - REMOVED to allow notes without status change
    const previousStatus = followups.length > 0 ? followups[0].new_status : currentStatus;
    /*
    if (followupData.new_status === previousStatus) {
      await dialog.alert('Status must be different from previous status', {
        variant: 'danger',
        title: 'Validation Error'
      });
      return;
    }
    */

    // Require next follow-up date unless converted/disqualified/lost
    if (!['Converted', 'Disqualified', 'Lost'].includes(followupData.new_status) && !followupData.next_followup_date) {
      await dialog.alert('Next follow-up date is required', {
        variant: 'danger',
        title: 'Validation Error'
      });
      return;
    }

    // Require Project for Conversion
    if (followupData.new_status === 'Converted' && !lead.project_id) {
      await dialog.alert('Cannot convert to sale without a selected Project. Please edit lead details to assign a project first.', {
        variant: 'danger',
        title: 'Validation Error'
      });
      return;
    }

    // Require Lost Reason
    if (followupData.new_status === 'Lost' && !followupData.lost_reason) {
      await dialog.alert('Please select a reason for marking the lead as Lost', {
        variant: 'danger',
        title: 'Validation Error'
      });
      return;
    }

    setLoading(true);
    try {
      // Insert follow-up
      const { error: followupError } = await supabase.from('lead_followups').insert({
        tenant_id: profile.tenant_id,
        lead_id: lead.id,
        followup_type: followupData.followup_type,
        followup_date: new Date(followupData.followup_date).toISOString(),
        discussion_summary: followupData.discussion_summary,
        customer_response: followupData.customer_response as CustomerResponse,
        call_status: followupData.followup_type === 'Call' ? followupData.call_status : undefined,
        previous_status: previousStatus,
        new_status: followupData.new_status,
        next_followup_date: followupData.new_status === 'Lost' ? new Date().toISOString() : (followupData.next_followup_date || null),
        created_by: profile.id,
        metadata: followupData.lost_reason ? { lost_reason: followupData.lost_reason } : {}
      });

      if (followupError) throw followupError;

      // Update lead status
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          lead_status: followupData.new_status,
          updated_by: profile.id,
          metadata: followupData.new_status === 'Lost'
            ? { ...lead.metadata, lost_reason: followupData.lost_reason }
            : lead.metadata
        })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      // Update local state
      setCurrentStatus(followupData.new_status);

      // Handle Conversion Logic (Create Sale & Customer) via RPC
      if (followupData.new_status === 'Converted' && previousStatus !== 'Converted') {
        const { error: conversionError } = await supabase.rpc('convert_lead_to_sale', {
          p_lead_id: lead.id,
          p_user_id: profile.id
        });

        if (conversionError) throw conversionError;
      }

      await dialog.alert(
        followupData.new_status === 'Converted'
          ? 'Lead Converted! Sale record created successfully.'
          : 'Follow-up added successfully!',
        { variant: 'success', title: 'Success' }
      );

      // Reset form
      setFollowupData({
        followup_type: 'Call',
        followup_date: new Date().toISOString().slice(0, 16),
        discussion_summary: '',
        customer_response: '',
        call_status: 'Connected',
        new_status: followupData.new_status,
        next_followup_date: '',
        lost_reason: ''
      });

      setShowFollowupForm(false);
      loadFollowups();
    } catch (error: any) {
      console.error('Error adding follow-up:', error);
      await dialog.alert(error.message || 'Failed to add follow-up', {
        variant: 'danger',
        title: 'Error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFollowupIcon = (type: FollowupType) => {
    const icons = {
      Call: Phone,
      WhatsApp: MessageSquare,
      Visit: Video,
      Email: Send
    };
    return icons[type] || Phone;
  };

  const getResponseIcon = (response: CustomerResponse) => {
    const icons = {
      Positive: CheckCircle,
      Neutral: AlertCircle,
      Negative: XCircle
    };
    return icons[response];
  };

  const getResponseColor = (response: CustomerResponse) => {
    const colors = {
      Positive: 'text-green-600',
      Neutral: 'text-yellow-600',
      Negative: 'text-red-600'
    };
    return colors[response];
  };



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lead Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Fixed Summary Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 pb-3 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col gap-3">
            {/* Top Row: Info & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <User className="text-blue-600 dark:text-blue-300" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {lead.customer_name}
                  </h2>
                  <div className="text-xs font-mono text-gray-500">
                    {lead.lead_id}
                  </div>
                </div>
              </div>
              <Badge variant="info" className="shrink-0">{currentStatus}</Badge>
            </div>

            {/* Middle Row: Contact & Meta - Horizontal Scrollable if needed, or Wrapped */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
              <a href={`tel:${lead.mobile}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                <Phone size={14} /> {lead.mobile}
              </a>
              {lead.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} /> {lead.city}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${lead.lead_score === 'Hot' ? 'bg-red-500' : lead.lead_score === 'Warm' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                {lead.lead_score}
              </div>
              <div className="flex items-center gap-1.5">
                <User size={14} /> {lead.sales_executive?.full_name?.split(' ')[0] || 'Unassigned'}
              </div>
              <div className="flex items-center gap-1.5" title="Lead Source">
                <Send size={14} className="rotate-45" /> {lead.lead_source}
              </div>
              <div className="flex items-center gap-1.5" title="Created Date">
                <Calendar size={14} /> {new Date(lead.lead_date).toLocaleDateString()}
              </div>
            </div>

            {/* Quick Action Buttons - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                className="justify-center"
                onClick={() => window.open(`tel:${lead.mobile}`, '_self')}
              >
                <Phone size={16} className="mr-2" />
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-center"
                onClick={() => window.open(`https://wa.me/${lead.mobile}`, '_blank')}
              >
                <MessageSquare size={16} className="mr-2" />
                WhatsApp
              </Button>

              {lead.email ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={() => window.open(`mailto:${lead.email}`, '_self')}
                >
                  <Mail size={16} className="mr-2" />
                  Email
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="justify-center opacity-50">
                  <Mail size={16} className="mr-2" /> No Email
                </Button>
              )}

              {currentStatus !== 'Converted' ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="justify-center"
                  onClick={() => setShowFollowupForm(!showFollowupForm)}
                >
                  <Calendar size={16} className="mr-2" />
                  Follow-up
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="justify-center">
                  <CheckCircle size={16} className="mr-2" /> Converted
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requirement Details */}
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                <span className="font-medium text-gray-900 dark:text-white">{lead.budget_range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                <span className="font-medium text-gray-900 dark:text-white">{lead.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Project:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {lead.project?.name || 'Not Specified'}
                </span>
              </div>
            </div>

            {lead.preferred_locations && lead.preferred_locations.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preferred Locations:</div>
                <div className="flex flex-wrap gap-1">
                  {lead.preferred_locations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-900 dark:text-blue-200"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Internal Notes</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {lead.internal_notes || 'No notes available'}
            </p>
          </div>
        </div>

        {/* Follow-up Form */}
        {showFollowupForm && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add New Follow-up</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Follow-up Type
                </label>
                <select
                  value={followupData.followup_type}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, followup_type: e.target.value as FollowupType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Visit">Visit</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Follow-up Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={followupData.followup_date}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, followup_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>



            {followupData.followup_type === 'Call' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Call Status
                </label>
                <select
                  value={followupData.call_status}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, call_status: e.target.value as CallStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="Connected">Connected</option>
                  <option value="Ringing">Ringing</option>
                  <option value="Disconnected">Disconnected</option>
                  <option value="Busy">Busy</option>
                  <option value="Not Responding">Not Responding</option>
                  <option value="Asked to call later">Asked to call later</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discussion Summary (min 20 characters)
              </label>
              <textarea
                value={followupData.discussion_summary}
                onChange={(e) => setFollowupData(prev => ({ ...prev, discussion_summary: e.target.value }))}
                rows={3}
                placeholder="Enter detailed discussion summary..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
              <div className="text-xs text-gray-500 mt-1">
                {followupData.discussion_summary.length} / 20 minimum
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Response
                </label>
                <select
                  value={followupData.customer_response}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, customer_response: e.target.value as CustomerResponse }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="">Select Response</option>
                  <option value="Positive">✅ Positive</option>
                  <option value="Neutral">⚠️ Neutral</option>
                  <option value="Negative">❌ Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lead Status
                </label>
                <select
                  value={followupData.new_status}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, new_status: e.target.value as LeadStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                  <option value="Site Visit Done">Site Visit Done</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Disqualified">Disqualified</option>
                  <option value="Lost">Lost</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followupData.next_followup_date}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, next_followup_date: e.target.value }))}
                  disabled={['Converted', 'Disqualified', 'Lost'].includes(followupData.new_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            {followupData.new_status === 'Lost' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lost Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={followupData.lost_reason}
                  onChange={(e) => setFollowupData(prev => ({ ...prev, lost_reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="">Select Reason</option>
                  <option value="lost-to-competition">Lost to Competition</option>
                  <option value="call-not-connected">Call Not Connected</option>
                  <option value="The rate is too high">The rate is too high</option>
                  <option value="The customer did not like the location">The customer did not like the location</option>
                  <option value="already-purchased">Already Purchased</option>
                  <option value="The customer wants land closer to the city">The customer wants land closer to the city</option>
                  <option value="not-interested">Not Interested</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFollowupForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddFollowup}
                isLoading={loading}
              >
                Save Follow-up
              </Button>
            </div>
          </div>
        )}

        {/* Follow-up Timeline */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Follow-up Timeline ({followups.length})
          </h3>

          {followups.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No follow-ups recorded yet
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {followups.map((followup) => {
                const Icon = getFollowupIcon(followup.followup_type);
                const ResponseIcon = getResponseIcon(followup.customer_response!);
                const isEditable = followup.is_editable &&
                  new Date(followup.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

                return (
                  <div
                    key={followup.id}
                    className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900"></div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {followup.followup_type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {followup.previous_status} → {followup.new_status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={14} />
                          {new Date(followup.followup_date).toLocaleString()}
                        </div>
                      </div>

                      {followup.followup_type === 'Call' && followup.call_status && (
                        <div className="mb-2">
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600">
                            Call Status: {followup.call_status}
                          </Badge>
                        </div>
                      )}

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {followup.discussion_summary}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ResponseIcon
                            size={16}
                            className={getResponseColor(followup.customer_response!)}
                          />
                          <span className={getResponseColor(followup.customer_response!)}>
                            {followup.customer_response}
                          </span>
                        </div>

                        {followup.next_followup_date && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Calendar size={14} />
                            Next: {new Date(followup.next_followup_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {!isEditable && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          🔒 Locked (Older than 24 hours)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal >
  );
}
