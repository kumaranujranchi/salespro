import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMutation, useAction } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Settings, Target, Save, Facebook, Link, Info, LogOut } from 'lucide-react';

export function SettingsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  
  // Facebook OAuth Actions
  const exchangeCodeAndGetPagesAction = useAction("meta:exchangeCodeAndGetPages" as any);
  const subscribePageToWebhookAction = useAction("meta:subscribePageToWebhook" as any);

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
    pageName: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Pages selection modal state
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [fetchingPages, setFetchingPages] = useState(false);
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);

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
        pageName: tenant.settings.integrations.meta.pageName ?? '',
        assignmentRule: (tenant.settings.integrations.meta.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
  }, [tenant]);

  // Handle Facebook Redirect OAuth Code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'meta_auth') {
      // Clear URL params immediately to prevent reload loop
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setActiveTab('integrations');
      setShowPagesModal(true);
      setFetchingPages(true);

      const fetchPages = async () => {
        try {
          const redirectUri = `${window.location.origin}/settings`;
          const pages = await exchangeCodeAndGetPagesAction({ code, redirectUri });
          setPagesList(pages);
        } catch (error: any) {
          console.error("Error exchanging Facebook code:", error);
          toast.error(error.message || "Failed to retrieve Facebook pages. Check server environment keys.");
          setShowPagesModal(false);
        } finally {
          setFetchingPages(false);
        }
      };

      fetchPages();
    }
  }, [exchangeCodeAndGetPagesAction, toast]);

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

  const handleFacebookConnect = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      toast.error("Facebook App ID (VITE_FACEBOOK_APP_ID) is not configured in client environment variables.");
      return;
    }

    const redirectUri = `${window.location.origin}/settings`;
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval&state=meta_auth`;
    
    // Redirect user to Facebook OAuth
    window.location.href = oauthUrl;
  };

  const handleConnectPage = async (page: any) => {
    if (!tenant?._id) return;
    setConnectingPageId(page.id);

    try {
      // 1. Automatically subscribe Facebook page to our app's webhook
      await subscribePageToWebhookAction({
        pageId: page.id,
        pageAccessToken: page.access_token
      });

      // 2. Save settings to database
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          meta: {
            enabled: true,
            accessToken: page.access_token,
            pageId: page.id,
            pageName: page.name,
            assignmentRule: metaSettings.assignmentRule || 'manual',
            lastAssignedExecutiveId: tenant.settings?.integrations?.meta?.lastAssignedExecutiveId
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success(`Successfully connected to Page: ${page.name}`);
      setShowPagesModal(false);
    } catch (error: any) {
      console.error("Error connecting Facebook page:", error);
      toast.error(error.message || "Failed to connect Facebook page.");
    } finally {
      setConnectingPageId(null);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!tenant?._id) return;
    if (!confirm("Are you sure you want to disconnect your Facebook Page? Leads will no longer be imported.")) return;

    setSavingMeta(true);
    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          meta: {
            enabled: false,
            accessToken: '',
            pageId: '',
            pageName: '',
            assignmentRule: 'manual'
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Facebook integration disconnected.');
    } catch (error: any) {
      console.error('Error disconnecting Meta:', error);
      toast.error(error.message || 'Failed to disconnect Meta.');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveMetaSettings = async () => {
    if (!tenant?._id) return;
    setSavingMeta(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          meta: {
            ...tenant.settings?.integrations?.meta,
            enabled: metaSettings.enabled,
            assignmentRule: metaSettings.assignmentRule,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Meta integration settings updated successfully!');
    } catch (error: any) {
      console.error('Error saving Meta settings:', error);
      toast.error(error.message || 'Failed to save integration settings.');
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
              {metaSettings.pageId && (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    metaSettings.enabled 
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {metaSettings.enabled ? 'Active' : 'Disabled'}
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
              )}
            </CardHeader>
            <CardContent className="space-y-6 py-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Connection Status block */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Settings size={18} className="text-slate-400" /> Connection Status
                  </h3>
                  
                  {!metaSettings.pageId ? (
                    <div className="p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                      <Facebook className="text-gray-300 dark:text-gray-700 w-12 h-12" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Facebook Account Connected</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                          Connect your Facebook Page to start importing leads directly from Facebook Lead Ads.
                        </p>
                      </div>
                      <Button
                        onClick={handleFacebookConnect}
                        className="bg-[#1877F2] text-white hover:bg-[#166FE5] border-none font-semibold flex items-center gap-2 shadow-sm"
                      >
                        <Facebook size={18} fill="currentColor" /> Connect Facebook Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1877F2] text-white rounded-lg flex items-center justify-center font-bold">
                            FB
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {metaSettings.pageName || "Connected Page"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Page ID: {metaSettings.pageId}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleDisconnectMeta}
                          isLoading={savingMeta}
                          className="flex items-center gap-1.5"
                        >
                          <LogOut size={14} /> Disconnect
                        </Button>
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
                  )}
                </div>

                {/* Setup Instructions */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-white/5">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Info size={18} className="text-blue-500" /> Dynamic Integration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    RealSalePro simplifies the integration process. When you log in with Facebook, we:
                  </p>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 list-disc pl-4">
                    <li>Exchange code for a permanent access token automatically.</li>
                    <li>Subscribe our platform webhook directly to your selected Page.</li>
                    <li>Securely isolate your leads and map them into the CRM.</li>
                  </ul>
                  
                  {/* Read-only Webhook info for advanced verification */}
                  <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-4 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Webhook Info (Reference Only)</p>
                    <div>
                      <span className="text-[11px] font-semibold block text-slate-700 dark:text-slate-300">Callback URL:</span>
                      <code className="block p-1.5 bg-white dark:bg-slate-800 text-[10px] rounded border border-slate-200 dark:border-slate-700 break-all select-all font-mono">{webhookUrl}</code>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold block text-slate-700 dark:text-slate-300">Verify Token:</span>
                      <code className="block p-1.5 bg-white dark:bg-slate-800 text-[10px] rounded border border-slate-200 dark:border-slate-700 select-all font-mono">{verifyToken}</code>
                    </div>
                  </div>
                </div>
              </div>

              {metaSettings.pageId && (
                <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                  <Button onClick={handleSaveMetaSettings} isLoading={savingMeta} className="gap-2">
                    <Save size={18} /> Save Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Facebook Pages Selection Modal */}
      {showPagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleIn">
            <CardHeader className="border-b border-gray-100 dark:border-white/10 p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                <Facebook className="text-blue-600 dark:text-blue-400" size={24} /> Connect Facebook Page
              </CardTitle>
            </CardHeader>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {fetchingPages ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fetching your Facebook pages...</p>
                </div>
              ) : pagesList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No managed pages found for this account.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Make sure you have admin rights on the pages.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select the Facebook Page you want to connect to RealSalePro CRM:
                  </p>
                  <div className="divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden">
                    {pagesList.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="pr-4">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{page.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">{page.category} • ID: {page.id}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleConnectPage(page)}
                          isLoading={connectingPageId === page.id}
                          className="px-4 py-1.5 flex-shrink-0"
                        >
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
              <Button
                variant="neutral"
                onClick={() => setShowPagesModal(false)}
                disabled={connectingPageId !== null}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
