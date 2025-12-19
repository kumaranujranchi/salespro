import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Plus, Save, X, User, Edit2, Trash2, Filter, AlertCircle } from 'lucide-react';

interface Incentive {
  id: string;
  sales_executive_id: string;
  calculation_month: string;
  calculation_year: number;
  total_incentive_amount: number;
  created_at?: string;
  profiles?: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export function IncentiveManagement() {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modals State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [formData, setFormData] = useState({
    sales_executive_id: '',
    calculation_month: new Date().toLocaleString('default', { month: 'long' }),
    calculation_year: new Date().getFullYear(),
    total_incentive_amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch incentives with user details
      const { data: incentivesData, error: incentivesError } = await supabase
        .from('incentives')
        .select(`
          *,
          profiles:sales_executive_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (incentivesError) throw incentivesError;
      setIncentives(incentivesData || []);

      // Fetch all potential sales executives (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.sales_executive_id || !formData.total_incentive_amount) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    try {
      const amount = parseFloat(formData.total_incentive_amount);
      if (isNaN(amount)) throw new Error('Invalid amount');

      const recordData = {
        sales_executive_id: formData.sales_executive_id,
        calculation_month: formData.calculation_month,
        calculation_year: formData.calculation_year,
        total_incentive_amount: amount,
      };

      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('incentives')
          .update(recordData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new record
        const newRecord = {
          ...recordData,
          sale_id: crypto.randomUUID(), // Generate valid UUID
          installment_1_amount: amount,
          installment_1_paid: false,
          is_locked: false
        };

        const { error } = await supabase
          .from('incentives')
          .insert([newRecord]);

        if (error) throw error;
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving incentive:', error);
      setErrorMessage(error.message || error.error_description || 'Unknown error');
    }
  };

  const handleEdit = (inc: Incentive) => {
    setFormData({
      sales_executive_id: inc.sales_executive_id,
      calculation_month: inc.calculation_month,
      calculation_year: inc.calculation_year,
      total_incentive_amount: inc.total_incentive_amount.toString()
    });
    setEditingId(inc.id);
    setIsAdding(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const calculateDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('incentives')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting incentive:', error);
      setErrorMessage('Failed to delete incentive');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      sales_executive_id: '',
      calculation_month: new Date().toLocaleString('default', { month: 'long' }),
      calculation_year: new Date().getFullYear(),
      total_incentive_amount: ''
    });
  };

  // Filter Logic
  const filteredIncentives = incentives.filter(inc => {
    const matchesUser = filterUser ? inc.sales_executive_id === filterUser : true;
    const matchesMonth = filterMonth ? inc.calculation_month === filterMonth : true;
    const matchesYear = filterYear ? inc.calculation_year.toString() === filterYear : true;
    return matchesUser && matchesMonth && matchesYear;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-gray-500 mb-1 sm:mb-0">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="p-2 text-xs sm:text-sm rounded-md border bg-gray-50 dark:bg-black/20 dark:border-white/10 dark:text-white w-full sm:min-w-[150px]"
            >
              <option value="" className="dark:bg-[#121e18]">All Users</option>
              {profiles.map(p => <option key={p.id} value={p.id} className="dark:bg-[#121e18]">{p.full_name}</option>)}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="p-2 text-xs sm:text-sm rounded-md border bg-gray-50 dark:bg-black/20 dark:border-white/10 dark:text-white w-full"
            >
              <option value="" className="dark:bg-[#121e18]">All Months</option>
              {months.map(m => <option key={m} value={m} className="dark:bg-[#121e18]">{m}</option>)}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="p-2 text-xs sm:text-sm rounded-md border bg-gray-50 dark:bg-black/20 dark:border-white/10 dark:text-white w-full"
            >
              <option value="" className="dark:bg-[#121e18]">All Years</option>
              {years.map(y => <option key={y} value={y} className="dark:bg-[#121e18]">{y}</option>)}
            </select>
          </div>

          {(filterUser || filterMonth || filterYear) && (
            <button
              onClick={() => { setFilterUser(''); setFilterMonth(''); setFilterYear(''); }}
              className="p-2 text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 self-end sm:self-auto"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        <button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg whitespace-nowrap"
        >
          <Plus size={20} />
          Add Manual Incentive
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card className="bg-slate-50 dark:bg-[#121e18] border border-[#00E576]/30 shadow-lg shadow-[#00E576]/5">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">{editingId ? 'Edit Incentive' : 'Add New Incentive'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Sales Executive</label>
                <select
                  className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                  value={formData.sales_executive_id}
                  onChange={(e) => setFormData({ ...formData, sales_executive_id: e.target.value })}
                >
                  <option value="" className="dark:bg-[#121e18]">Select User</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-[#121e18]">{p.full_name} ({p.role})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Month</label>
                  <select
                    className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                    value={formData.calculation_month}
                    onChange={(e) => setFormData({ ...formData, calculation_month: e.target.value })}
                  >
                    {months.map(m => <option key={m} value={m} className="dark:bg-[#121e18]">{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Year</label>
                  <select
                    className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                    value={formData.calculation_year}
                    onChange={(e) => setFormData({ ...formData, calculation_year: Number(e.target.value) })}
                  >
                    {years.map(y => <option key={y} value={y} className="dark:bg-[#121e18]">{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount (₹)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded-md border bg-white dark:bg-black/20 dark:border-white/10 dark:text-white"
                  placeholder="0.00"
                  value={formData.total_incentive_amount}
                  onChange={(e) => setFormData({ ...formData, total_incentive_amount: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#00E576] hover:bg-[#00C853] text-[#0A1C37] p-2 rounded-md font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={18} /> {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white p-2 rounded-md hover:bg-gray-300 dark:hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incentives Table */}
      <Card className="dark:bg-surface-dark dark:border-white/10">
        <CardHeader>
          <CardTitle className="dark:text-white">All Incentives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 uppercase">
                <tr>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3 text-right">Incentive Amount</th>
                  <th className="px-4 py-3 text-right">Date Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                ) : filteredIncentives.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">No records found.</td></tr>
                ) : (
                  filteredIncentives.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        {inc.profiles?.full_name || 'Unknown User'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inc.calculation_month}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inc.calculation_year}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#00E576]">
                        {formatCurrency(inc.total_incentive_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        {new Date(inc.created_at || '').toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(inc)}
                            className="p-1.5 text-[#00E576] hover:bg-[#00E576]/10 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(inc.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="bg-[#00E576]/10 border border-[#00E576]/20 rounded-lg p-4 flex items-start gap-3">
        <div className="mt-1">
          <AlertCircle size={20} className="text-[#00E576]" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Automation Available</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            This page is currently for manual incentive management. Automated incentive calculations are available in our customized plans.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Incentive"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this incentive? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={calculateDelete}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              Delete Incentive
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Error"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-6 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
