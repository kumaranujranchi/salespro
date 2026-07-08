import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Settings, Target, Save, Facebook, Link, Info } from 'lucide-react';

export function SettingsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  
  const [activeTab, setActiveTab] = useState<'general' | 'integrations'>('general');

  // General Settings State
  const [settings, setSettings] = useState({
    targetModel: 'area'
  });

  // Meta Integration State
  const [metaSettings, setMetaSettings] = useState({
    enabled: false,
    accessToken: '',
    pageId: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  useEffect(() => {
    if (tenant?.settings?.general?.target_model) {
      setSettings({
        targetModel: tenant.settings.general.target_model
      });
    }
    if (tenant?.settings?.integrations?.meta) {
      setMetaSettings({
        enabled: tenant.settings.integrations.meta.enabled ?? false,
        accessToken: tenant.settings.integrations.meta.accessToken ?? '',
        pageId: tenant.settings.integrations.meta.pageId ?? '',
        assignmentRule: (tenant.settings.integrations.meta.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
  }, [tenant]);

  const handleSaveGeneral = async () => {
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
        id: tenant._id as any,
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

  const handleSaveMeta = async () => {
    if (!tenant?._id) return;
    setSavingMeta(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          meta: {
            enabled: metaSettings.enabled,
            accessToken: metaSettings.accessToken,
            pageId: metaSettings.pageId,
            assignmentRule: metaSettings.assignmentRule,
            lastAssignedExecutiveId: tenant.settings?.integrations?.meta?.lastAssignedExecutiveId
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Meta Lead Ads integration updated successfully!');
    } catch (error: any) {
      console.error('Error saving Meta settings:', error);
      toast.error(error.message || 'Failed to save Meta settings.');
    } finally {
      setSavingMeta(false);
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

  // Derive Convex HTTP site URL dynamically
  const convexUrl = import.meta.env.VITE_CONVEX_URL || '';
  const webhookUrl = convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/meta-webhook`
    : 'https://<your-convex-deployment>.convex.site/meta-webhook';

  const verifyToken = 'realsalepro_meta_verify';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-slate-400" /> Organization Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure settings and integrations for your organization</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Settings size={16} /> General Settings
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'integrations'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Link size={16} /> Integrations
        </button>
      </div>

      {activeTab === 'general' ? (
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
              <Button onClick={handleSaveGeneral} isLoading={loading} className="gap-2">
                <Save size={18} /> Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-100 dark:border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Facebook className="text-blue-600 dark:text-blue-400" size={20} /> Meta Lead Ads Integration
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  metaSettings.enabled 
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {metaSettings.enabled ? 'Active / Connected' : 'Disconnected'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metaSettings.enabled}
                    onChange={(e) => setMetaSettings({ ...metaSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Configuration form fields */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Settings size={18} className="text-slate-400" /> Credentials
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Facebook Page ID
                    </label>
                    <input
                      type="text"
                      value={metaSettings.pageId}
                      onChange={(e) => setMetaSettings({ ...metaSettings, pageId: e.target.value })}
                      placeholder="e.g. 1092837482910"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">ID of the Facebook page running your Lead Ads campaigns.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Page Access Token
                    </label>
                    <textarea
                      value={metaSettings.accessToken}
                      onChange={(e) => setMetaSettings({ ...metaSettings, accessToken: e.target.value })}
                      placeholder="Paste your Meta Page Access Token here..."
                      rows={4}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Provide a permanent Page Access Token with <code>pages_show_list</code>, <code>leads_retrieval</code>, and <code>pages_read_engagement</code> permissions.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lead Assignment Rule
                    </label>
                    <Select
                      value={metaSettings.assignmentRule}
                      onChange={(e) => setMetaSettings({ ...metaSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                      options={[
                        { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                        { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                      ]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {metaSettings.assignmentRule === 'manual' 
                        ? 'New leads from Meta will import as unassigned. Admin can assign them manually.' 
                        : 'New leads will be automatically distributed one-by-one to active Sales Executives.'}
                    </p>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-white/5">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Info size={18} className="text-blue-500" /> Webhook Integration Setup
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Configure Webhooks inside your Facebook Developer App to push leads automatically to CRM:
                  </p>
                  <ol className="space-y-4 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4">
                    <li>
                      Add the <strong>Webhooks</strong> product to your Meta Developer App and choose <strong>Page</strong> from the dropdown.
                    </li>
                    <li>
                      Click <strong>Subscribe to this object</strong> and enter the following settings:
                      <div className="mt-2 space-y-2">
                        <div>
                          <span className="font-semibold block text-slate-700 dark:text-slate-300">Callback URL:</span>
                          <code className="block p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 break-all select-all">{webhookUrl}</code>
                        </div>
                        <div>
                          <span className="font-semibold block text-slate-700 dark:text-slate-300">Verify Token:</span>
                          <code className="block p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 select-all">{verifyToken}</code>
                        </div>
                      </div>
                    </li>
                    <li>
                      Subscribe to the <code>leadgen</code> field.
                    </li>
                    <li>
                      Ensure Page permissions are set up correctly in Business Manager.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                <Button onClick={handleSaveMeta} isLoading={savingMeta} className="gap-2">
                  <Save size={18} /> Save Meta Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
