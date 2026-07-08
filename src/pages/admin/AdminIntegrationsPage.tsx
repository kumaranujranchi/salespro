import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMutation, useAction } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Settings, Save, Facebook, Info, LogOut, Eye, EyeOff, Plug } from 'lucide-react';

export function AdminIntegrationsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const toast = useToast();
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  
  // Facebook OAuth Actions
  const exchangeCodeAndGetPagesAction = useAction("meta:exchangeCodeAndGetPages" as any);
  const subscribePageToWebhookAction = useAction("meta:subscribePageToWebhook" as any);

  // Meta Integration State
  const [metaSettings, setMetaSettings] = useState({
    enabled: false,
    accessToken: '',
    pageId: '',
    pageName: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Google Integration State
  const [googleSettings, setGoogleSettings] = useState({
    enabled: false,
    googleKey: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  const [showGoogleKey, setShowGoogleKey] = useState(false);

  // Pages selection modal state
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [fetchingPages, setFetchingPages] = useState(false);
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);

  useEffect(() => {
    if (tenant?.settings?.integrations?.meta) {
      setMetaSettings({
        enabled: tenant.settings.integrations.meta.enabled ?? false,
        accessToken: tenant.settings.integrations.meta.accessToken ?? '',
        pageId: tenant.settings.integrations.meta.pageId ?? '',
        pageName: tenant.settings.integrations.meta.pageName ?? '',
        assignmentRule: (tenant.settings.integrations.meta.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if (tenant?.settings?.integrations?.google) {
      setGoogleSettings({
        enabled: tenant.settings.integrations.google.enabled ?? false,
        googleKey: tenant.settings.integrations.google.googleKey ?? '',
        assignmentRule: (tenant.settings.integrations.google.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
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
      
      setShowPagesModal(true);
      setFetchingPages(true);

      const fetchPages = async () => {
        try {
          const redirectUri = `${window.location.origin}/settings/integrations`;
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

  const handleFacebookConnect = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      toast.error("Facebook App ID (VITE_FACEBOOK_APP_ID) is not configured in client environment variables.");
      return;
    }

    const redirectUri = `${window.location.origin}/settings/integrations`;
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

  const handleSaveGoogleSettings = async () => {
    if (!tenant?._id) return;
    setSavingGoogle(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          google: {
            enabled: googleSettings.enabled,
            googleKey: googleSettings.googleKey,
            assignmentRule: googleSettings.assignmentRule,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Google Ads integration settings updated successfully!');
    } catch (error: any) {
      console.error('Error saving Google settings:', error);
      toast.error(error.message || 'Failed to save Google settings.');
    } finally {
      setSavingGoogle(false);
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

  const googleWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/google-webhook?tenantId=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/google-webhook?tenantId=tenant_id';

  const verifyToken = 'realsalepro_meta_verify';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Plug className="text-slate-400" /> Platform Integrations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Connect external advertising platforms to import leads directly into your CRM.</p>
      </div>

      <div className="space-y-8">
        {/* Facebook Integration Card */}
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
                  <Info size={18} className="text-blue-500" /> Meta Integration Info
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  RealSalePro automates the Meta integration process. When you log in with Facebook, we:
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
                  <Save size={18} /> Save Meta Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Ads Integration Card */}
        <Card>
          <CardHeader className="border-b border-gray-100 dark:border-white/10 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.111 4.113-3.41 0-6.19-2.779-6.19-6.19s2.78-6.19 6.19-6.19c1.483 0 2.825.524 3.878 1.547l3.123-3.124C19.046 2.372 15.824 1 12.24 1 5.756 1 .5 6.256.5 12.74s5.256 11.74 11.74 11.74c7.17 0 11.24-5.02 11.24-11.44 0-.771-.06-1.5-.2-2.19H12.24z"/>
              </svg>
              Google Ads Lead Forms Integration
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                googleSettings.enabled 
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {googleSettings.enabled ? 'Active' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleSettings.enabled}
                  onChange={(e) => setGoogleSettings({ ...googleSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Credentials & Options */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Settings size={18} className="text-slate-400" /> Credentials & Options
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Google Ads Webhook Passphrase (Google Key)
                  </label>
                  <div className="relative">
                    <input
                      type={showGoogleKey ? "text" : "password"}
                      value={googleSettings.googleKey}
                      onChange={(e) => setGoogleSettings({ ...googleSettings, googleKey: e.target.value })}
                      placeholder="Define a secure passphrase (e.g. key_12345)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGoogleKey(!showGoogleKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showGoogleKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Set a secret key here, and enter the exact same key in your Google Ads Lead Form extension configuration.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lead Assignment Rule
                  </label>
                  <Select
                    value={googleSettings.assignmentRule}
                    onChange={(e) => setGoogleSettings({ ...googleSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                    options={[
                      { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                      { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {googleSettings.assignmentRule === 'manual' 
                      ? 'New leads from Google Ads will import as unassigned. Admin can assign them manually.' 
                      : 'New leads will be automatically distributed one-by-one to active Sales Executives.'}
                  </p>
                </div>
              </div>

              {/* Webhook Setup Instructions */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-white/5">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Info size={18} className="text-blue-500" /> Google Ads Webhook Setup Guide
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Set up lead delivery inside Google Ads:
                </p>
                <ol className="space-y-3 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4">
                  <li>Create or edit a <strong>Lead Form extension</strong> in your Google Ads campaign.</li>
                  <li>Scroll down to the <strong>"Export leads from Google Ads"</strong> section and select <strong>"Other webhook integration"</strong>.</li>
                  <li>Enter the following configurations:
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="font-semibold block text-slate-700 dark:text-slate-300">Webhook URL:</span>
                        <code className="block p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 break-all select-all font-mono">{googleWebhookUrl}</code>
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-700 dark:text-slate-300">Google Key:</span>
                        <code className="block p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 select-all font-mono">{googleSettings.googleKey || "Set passphrase on the left"}</code>
                      </div>
                    </div>
                  </li>
                  <li>Click <strong>"Send test data"</strong> in Google Ads to test delivery instantly.</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
              <Button onClick={handleSaveGoogleSettings} isLoading={savingGoogle} className="gap-2">
                <Save size={18} /> Save Google Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
