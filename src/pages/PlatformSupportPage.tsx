import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, X, LifeBuoy, Building2, ChevronDown, AlertCircle } from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  created_by: string;
  tenant_id: string;
  resolution_notes?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  tenants?: {
    name: string;
  };
}

interface Notification {
  type: 'success' | 'error';
  title: string;
  message: string;
}

export function PlatformSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching tickets...');

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          created_by_profile:profiles!created_by(full_name, email),
          tenant:tenants(name)
        `)
        .order('created_at', { ascending: false });

      console.log('Fetch result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} tickets`);

      // Map the data to match our interface
      const mappedTickets = data?.map(ticket => ({
        ...ticket,
        profiles: ticket.created_by_profile,
        tenants: ticket.tenant
      })) || [];

      setTickets(mappedTickets);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      // Show error to user
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket || !resolutionNote) return;

    try {
      // 1. Update DB
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNote
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // 2. Send Email
      const emailResponse = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TICKET_RESOLVED',
          email: selectedTicket.profiles?.email,
          name: selectedTicket.profiles?.full_name,
          data: {
            ticketNumber: selectedTicket.ticket_number,
            resolution: resolutionNote
          }
        })
      });

      if (!emailResponse.ok) {
        throw new Error('Ticket resolved in database, but failed to send notification email.');
      }

      setResolveModalOpen(false);
      setResolutionNote('');
      setSelectedTicket(null);
      fetchTickets(); // Refresh list

      setNotification({
        type: 'success',
        title: 'Ticket Resolved!',
        message: 'The ticket has been marked as resolved and the user has been notified via email.'
      });
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        title: 'Resolution Failed',
        message: err.message || 'An error occurred while resolving the ticket.'
      });
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and resolve customer support requests
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Total: </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{tickets.length}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Open: </span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {tickets.filter(t => t.status === 'open').length}
            </span>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <LifeBuoy className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No support tickets</h3>
          <p className="text-sm text-gray-500 mt-1">All caught up! No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all shadow-sm">
              {/* Header - Always Visible */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50"
                onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Icon/Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ticket.status === 'open' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {ticket.status === 'open' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-500">#{ticket.ticket_number}</span>
                      <span className="text-xs text-gray-400">• {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">
                      {ticket.subject}
                    </h3>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-gray-400 ml-2 shrink-0 transition-transform ${expandedTicketId === ticket.id ? 'rotate-180' : ''}`} />
              </div>

              {/* Expanded Body */}
              {expandedTicketId === ticket.id && (
                <div className="px-4 pb-4 pt-0 text-sm animate-fadeIn">
                  <div className="pt-3 border-t border-slate-100 dark:border-gray-700 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-md text-xs">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Raised by: <strong>{ticket.profiles?.full_name}</strong></span>
                      <span className="flex items-center gap-1"><Building2 size={12} /> {ticket.tenants?.name}</span>
                    </div>

                    {ticket.resolution_notes && (
                      <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-900/30">
                        <p className="text-xs font-bold text-green-800 dark:text-green-300 mb-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Resolution
                        </p>
                        <p className="text-xs text-green-900 dark:text-green-200">{ticket.resolution_notes}</p>
                      </div>
                    )}

                    {ticket.status === 'open' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setResolveModalOpen(true); }}
                        className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-colors"
                      >
                        Resolve Ticket
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 dark:text-white">
              Resolve Ticket #{selectedTicket.ticket_number}
            </h3>
            <textarea
              className="w-full border rounded-lg p-3 mb-4 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="Enter resolution notes..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setResolveModalOpen(false);
                  setResolutionNote('');
                  setSelectedTicket(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveTicket}
                disabled={!resolutionNote.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark Resolved & Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn border border-gray-200 dark:border-gray-700">
            {/* Header with gradient background */}
            <div className={`relative p-6 text-center overflow-hidden ${notification.type === 'success'
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="relative z-10 flex flex-col items-center">
                {/* Icon with animation */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 bg-white/20 ring-white/10 backdrop-blur-md">
                  {notification.type === 'success' ? (
                    <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white animate-pulse" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{notification.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed max-w-sm">
                  {notification.message}
                </p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setNotification(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Footer with action button */}
            <div className="p-6 bg-white dark:bg-[#1e1e2d]">
              <button
                onClick={() => setNotification(null)}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${notification.type === 'success'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/30'
                  }`}
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
