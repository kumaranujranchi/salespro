import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Settings, Target, Save } from 'lucide-react';

export function SettingsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  
  const [settings, setSettings] = useState({
    targetModel: 'area'
  });

  useEffect(() => {
    if (tenant?.settings?.general?.target_model) {
      setSettings({
        targetModel: tenant.settings.general.target_model
      });
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant?._id) return;
    setLoading(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        general: {
          ...tenant.settings?.general,
          target_model: settings.targetModel
        }
      };

      await updateTenantMutation({
        id: tenant._id,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Only Super Admins can access organization settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-slate-400" /> Organization Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure global settings for your organization</p>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="text-blue-500" size={20} /> Target Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sales Target Model
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Choose how you want to set and track sales targets for your team.
            </p>
            
            <div className="space-y-4">
              <Select
                value={settings.targetModel}
                onChange={(e) => setSettings({ ...settings, targetModel: e.target.value })}
                options={[
                  { label: 'Area Based (Sq Ft)', value: 'area' },
                  { label: 'Unit Based (Count)', value: 'units' },
                  { label: 'Revenue Based (Amount)', value: 'revenue' },
                  { label: 'Hybrid (Area + Revenue + Units)', value: 'hybrid' }
                ]}
              />

              <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
                <span className="font-semibold block mb-1">Preview:</span>
                {settings.targetModel === 'area' && "Agents will be assigned a target in Square Feet (e.g., 5000 Sq Ft)."}
                {settings.targetModel === 'units' && "Agents will be assigned a target in Number of Units (e.g., 5 Units)."}
                {settings.targetModel === 'revenue' && "Agents will be assigned a revenue target (e.g., ₹50,00,000)."}
                {settings.targetModel === 'hybrid' && "You can assign targets using any combination of Area, Units, and Revenue."}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <Button onClick={handleSave} isLoading={loading} className="gap-2">
              <Save size={18} /> Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
