import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Loader2, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  resolution_notes?: string;
}

export function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Get Current User Info (for tenant_id)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, full_name')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // 2. Insert Ticket
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert([{
          subject,
          description,
          priority,
          created_by: user.id,
          tenant_id: profile.tenant_id
        }])
        .select()
        .single();

      if (error) throw error;

      // 3. Send Confirmation Email via Netlify Function
      await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TICKET_CREATED',
          email: user.email,
          name: profile.full_name,
          data: {
            ticketNumber: ticket.ticket_number,
            subject: ticket.subject
          }
        })
      });

      // 4. Reset & Refresh
      setSubject('');
      setDescription('');
      setShowForm(false);
      fetchTickets();
      alert('Ticket raised successfully! Check your email for confirmation.');

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      alert('Failed to raise ticket: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support & Help Desk</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Raise Ticket
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">New Support Request</h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g., Cannot upload CSV file"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
              >
                <option value="low">Low - General Question</option>
                <option value="medium">Medium - Feature Issue</option>
                <option value="high">High - Something Broken</option>
                <option value="critical">Critical - System Down</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                placeholder="Please describe the issue in detail..."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Submitting...
                  </>
                ) : 'Submit Ticket'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tickets yet</h3>
          <p className="mt-1 text-sm text-gray-500">Have an issue? Raise a ticket above.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{ticket.ticket_number}</span>
                      <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400 truncate">{ticket.subject}</h3>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{ticket.description}</p>
                    <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Raised on {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {ticket.resolution_notes && (
                    <div className="ml-4 max-w-xs bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-300 border border-green-100 dark:border-green-900/30">
                      <strong>Resolution:</strong> {ticket.resolution_notes}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
