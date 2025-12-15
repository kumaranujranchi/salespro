import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, X, LifeBuoy, Building2, Clock } from 'lucide-react';

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, profiles:created_by(full_name, email), tenants(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        #{ticket.ticket_number}
                      </span>
                      <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                        {ticket.subject}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {ticket.tenants?.name || 'Unknown Company'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{ticket.description}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Raised by <strong>{ticket.profiles?.full_name || 'Unknown'}</strong> on {new Date(ticket.created_at).toLocaleString()}
                    </p>

                    {ticket.resolution_notes && (
                      <div className="mt-3 bg-green-50 dark:bg-green-900/10 p-3 rounded text-sm text-green-800 dark:text-green-300 border border-green-100 dark:border-green-900/30">
                        <strong>Resolution:</strong> {ticket.resolution_notes}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex items-start">
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setResolveModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
