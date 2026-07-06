import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import {
  Lead, LeadSource, LeadStatus, BudgetRange, PurposeType,
  LeadScore, Project, Profile
} from '../../types/database';
import { Modal, ModalFooter } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

export function LeadFormModal({ isOpen, onClose, lead }: LeadFormModalProps) {
  const { profile } = useAuth();
  const dialog = useDialog();

  const [loading, setLoading] = useState(false);

  // Convex Queries
  const projects = useQuery(api.projects.listRunningProjects, 
    profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip"
  );
  const salesExecutives = useQuery(api.profiles.listActiveStaff,
    profile?.tenant_id ? { tenant_id: profile.tenant_id as Id<"tenants"> } : "skip"
  );

  // Convex Mutations
  const createLeadMutation = useMutation(api.leads.createLead);
  const updateLeadMutation = useMutation(api.leads.updateLead);

  // Form State
  const [formData, setFormData] = useState({
    lead_source: 'Walk-in' as LeadSource,
    project_id: '',
    sales_executive_id: profile?.id || '',
    customer_name: '',
    mobile: '',
    email: '',
    city: '',
    budget_range: '<50L' as BudgetRange,
    purpose: 'End Use' as PurposeType,
    preferred_locations: [] as string[],
    lead_status: 'New' as LeadStatus,
    lead_score: 'Warm' as LeadScore,
    internal_notes: '',
    lead_date: new Date().toISOString().slice(0, 16)
  });

  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        lead_source: lead.lead_source,
        project_id: lead.project_id || '',
        sales_executive_id: lead.sales_executive_id || profile?.id || '',
        customer_name: lead.customer_name,
        mobile: lead.mobile,
        email: lead.email || '',
        city: lead.city || '',
        budget_range: lead.budget_range || '<50L',
        purpose: lead.purpose || 'End Use',
        preferred_locations: lead.preferred_locations || [],
        lead_status: lead.lead_status,
        lead_score: lead.lead_score,
        internal_notes: lead.internal_notes || '',
        lead_date: lead.lead_date ? new Date(lead.lead_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
      });
    } else if (profile) {
      setFormData(prev => ({ ...prev, sales_executive_id: profile.id }));
    }
  }, [lead, profile]);

  const handleAddLocation = () => {
    if (locationInput.trim() && !formData.preferred_locations.includes(locationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_locations: [...prev.preferred_locations, locationInput.trim()]
      }));
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_locations: prev.preferred_locations.filter(l => l !== location)
    }));
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      dialog.alert('Customer name is required', { variant: 'danger', title: 'Validation Error' });
      return false;
    }

    if (!/^[0-9]{10}$/.test(formData.mobile)) {
      dialog.alert('Please enter a valid 10-digit mobile number', { variant: 'danger', title: 'Validation Error' });
      return false;
    }

    if (formData.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      dialog.alert('Please enter a valid email address', { variant: 'danger', title: 'Validation Error' });
      return false;
    }

    if (!formData.sales_executive_id) {
      dialog.alert('Please assign a sales executive', { variant: 'danger', title: 'Validation Error' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !validateForm()) return;

    setLoading(true);
    try {
      if (lead) {
        // Update existing lead
        await updateLeadMutation({
          id: lead.id as Id<"leads">,
          lead_source: formData.lead_source,
          project_id: (formData.project_id as Id<"projects">) || null,
          sales_executive_id: formData.sales_executive_id as Id<"profiles">,
          customer_name: formData.customer_name,
          mobile: formData.mobile,
          email: formData.email || null,
          city: formData.city || null,
          budget_range: formData.budget_range,
          purpose: formData.purpose,
          preferred_locations: formData.preferred_locations,
          lead_status: formData.lead_status,
          lead_score: formData.lead_score,
          internal_notes: formData.internal_notes || null,
          lead_date: new Date(formData.lead_date).toISOString(),
        });
        await dialog.alert('Lead updated successfully!', { variant: 'success', title: 'Success' });
      } else {
        // Create new lead
        // The mutation handles ID generation and duplicate checking
        await createLeadMutation({
          tenant_id: profile.tenant_id as Id<"tenants">,
          lead_source: formData.lead_source,
          project_id: (formData.project_id as Id<"projects">) || null,
          sales_executive_id: formData.sales_executive_id as Id<"profiles">,
          customer_name: formData.customer_name,
          mobile: formData.mobile,
          email: formData.email || null,
          city: formData.city || null,
          budget_range: formData.budget_range,
          purpose: formData.purpose,
          preferred_locations: formData.preferred_locations,
          lead_status: formData.lead_status,
          lead_score: formData.lead_score,
          internal_notes: formData.internal_notes || null,
          lead_date: new Date(formData.lead_date).toISOString(),
          created_by: profile.id as Id<"profiles">,
        });
        await dialog.alert('Lead created successfully!', { variant: 'success', title: 'Success' });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      await dialog.alert(error.message || 'Failed to save lead', { variant: 'danger', title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Edit Lead' : 'Create New Lead'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lead Source <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.lead_source}
              onChange={(e) => setFormData(prev => ({ ...prev, lead_source: e.target.value as LeadSource }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            >
              <option value="Referral">Referral</option>
              <option value="99acres">99acres</option>
              <option value="MagicBrick">MagicBrick</option>
              <option value="Housing">Housing</option>
              <option value="Meta">Meta</option>
              <option value="Google">Google</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="">Select Project</option>
              {(projects || []).map(project => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Lead Date"
            type="datetime-local"
            value={formData.lead_date}
            onChange={(e) => setFormData(prev => ({ ...prev, lead_date: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lead Status
            </label>
            <select
              value={formData.lead_status}
              onChange={(e) => setFormData(prev => ({ ...prev, lead_status: e.target.value as LeadStatus }))}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lead Score
            </label>
            <select
              value={formData.lead_score}
              onChange={(e) => setFormData(prev => ({ ...prev, lead_score: e.target.value as LeadScore }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">☀️ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.customer_name}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
              required
              placeholder="Enter customer name"
            />

            <Input
              label="Mobile Number"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              required
              placeholder="10-digit mobile number"
              maxLength={10}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="customer@example.com"
            />

            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requirement Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Range
              </label>
              <select
                value={formData.budget_range}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_range: e.target.value as BudgetRange }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="<50L">Less than 50 Lakhs</option>
                <option value="50L-1Cr">50 Lakhs - 1 Crore</option>
                <option value="1Cr-2Cr">1 Crore - 2 Crore</option>
                <option value=">2Cr">More than 2 Crore</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purpose
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Investment"
                    checked={formData.purpose === 'Investment'}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value as PurposeType }))}
                    className="mr-2"
                  />
                  Investment
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="End Use"
                    checked={formData.purpose === 'End Use'}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value as PurposeType }))}
                    className="mr-2"
                  />
                  End Use
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Locations
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                placeholder="Enter location and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
              <Button type="button" onClick={handleAddLocation} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.preferred_locations.map((location, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm dark:bg-blue-900 dark:text-blue-200"
                >
                  {location}
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(location)}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignment & Notes</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sales Executive <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sales_executive_id}
              onChange={(e) => setFormData(prev => ({ ...prev, sales_executive_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            >
              <option value="">Select Sales Executive</option>
              {(salesExecutives || []).map(exec => (
                <option key={exec._id} value={exec._id}>
                  {exec.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Internal Notes
            </label>
            <textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
              rows={3}
              placeholder="Add internal notes about this lead..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {lead ? 'Update Lead' : 'Create Lead'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
