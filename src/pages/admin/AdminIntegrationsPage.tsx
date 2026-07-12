import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMutation, useAction } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Settings, Save, Facebook, Info, LogOut, Eye, EyeOff, Plug, X, ChevronRight } from 'lucide-react';

export function AdminIntegrationsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const toast = useToast();
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [savingNineNine, setSavingNineNine] = useState(false);
  const [savingMagicbricks, setSavingMagicbricks] = useState(false);
  const [savingHousing, setSavingHousing] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingGoogleForm, setSavingGoogleForm] = useState(false);
  const [savingGoogleSheet, setSavingGoogleSheet] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  
  // Facebook OAuth Actions
  const exchangeCodeAndGetPagesAction = useAction("meta:exchangeCodeAndGetPages" as any);
  const subscribePageToWebhookAction = useAction("meta:subscribePageToWebhook" as any);

  // Modal display states
  const [activeModal, setActiveModal] = useState<'meta' | 'google' | 'nineNineAcres' | 'magicbricks' | 'housing' | 'whatsapp' | 'googleForm' | 'googleSheet' | null>(null);
  const [showMetaHelp, setShowMetaHelp] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [showNineNineHelp, setShowNineNineHelp] = useState(false);
  const [showMagicbricksHelp, setShowMagicbricksHelp] = useState(false);
  const [showHousingHelp, setShowHousingHelp] = useState(false);
  const [showWhatsappHelp, setShowWhatsappHelp] = useState(false);
  const [showGoogleFormHelp, setShowGoogleFormHelp] = useState(false);
  const [showGoogleSheetHelp, setShowGoogleSheetHelp] = useState(false);

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

  // 99acres State
  const [nineNineSettings, setNineNineSettings] = useState({
    enabled: false,
    username: '',
    clientId: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Magicbricks State
  const [magicbricksSettings, setMagicbricksSettings] = useState({
    enabled: false,
    apiKey: '',
    username: '',
    agentId: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Housing State
  const [housingSettings, setHousingSettings] = useState({
    enabled: false,
    mobileNumber: '',
    profileId: '',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // WhatsApp State
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: false,
    provider: 'wati' as 'wati' | 'aisensy' | 'interakt' | 'doubletick' | 'custom',
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Google Form State
  const [googleFormSettings, setGoogleFormSettings] = useState({
    enabled: false,
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Google Sheet State
  const [googleSheetSettings, setGoogleSheetSettings] = useState({
    enabled: false,
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

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
    if (tenant?.settings?.integrations?.nineNineAcres) {
      setNineNineSettings({
        enabled: tenant.settings.integrations.nineNineAcres.enabled ?? false,
        username: tenant.settings.integrations.nineNineAcres.username ?? '',
        clientId: tenant.settings.integrations.nineNineAcres.clientId ?? '',
        assignmentRule: (tenant.settings.integrations.nineNineAcres.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if (tenant?.settings?.integrations?.magicbricks) {
      setMagicbricksSettings({
        enabled: tenant.settings.integrations.magicbricks.enabled ?? false,
        apiKey: tenant.settings.integrations.magicbricks.apiKey ?? '',
        username: tenant.settings.integrations.magicbricks.username ?? '',
        agentId: tenant.settings.integrations.magicbricks.agentId ?? '',
        assignmentRule: (tenant.settings.integrations.magicbricks.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if (tenant?.settings?.integrations?.housing) {
      setHousingSettings({
        enabled: tenant.settings.integrations.housing.enabled ?? false,
        mobileNumber: tenant.settings.integrations.housing.mobileNumber ?? '',
        profileId: tenant.settings.integrations.housing.profileId ?? '',
        assignmentRule: (tenant.settings.integrations.housing.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if (tenant?.settings?.integrations?.whatsapp) {
      setWhatsappSettings({
        enabled: tenant.settings.integrations.whatsapp.enabled ?? false,
        provider: (tenant.settings.integrations.whatsapp.provider as any) ?? 'wati',
        assignmentRule: (tenant.settings.integrations.whatsapp.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if ((tenant?.settings?.integrations as any)?.googleForm) {
      setGoogleFormSettings({
        enabled: (tenant?.settings?.integrations as any).googleForm.enabled ?? false,
        assignmentRule: ((tenant?.settings?.integrations as any).googleForm.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if ((tenant?.settings?.integrations as any)?.googleSheet) {
      setGoogleSheetSettings({
        enabled: (tenant?.settings?.integrations as any).googleSheet.enabled ?? false,
        assignmentRule: ((tenant?.settings?.integrations as any).googleSheet.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
  }, [tenant]);

  // Reset help states when active modal changes
  useEffect(() => {
    setShowMetaHelp(false);
    setShowGoogleHelp(false);
    setShowNineNineHelp(false);
    setShowMagicbricksHelp(false);
    setShowHousingHelp(false);
    setShowWhatsappHelp(false);
    setShowGoogleFormHelp(false);
    setShowGoogleSheetHelp(false);
  }, [activeModal]);

  // Handle Facebook Redirect OAuth Code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'meta_auth') {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setActiveModal('meta');
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
    
    window.location.href = oauthUrl;
  };

  const handleConnectPage = async (page: any) => {
    if (!tenant?._id) return;
    setConnectingPageId(page.id);

    try {
      await subscribePageToWebhookAction({
        pageId: page.id,
        pageAccessToken: page.access_token
      });

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
      setActiveModal(null);
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
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error saving Google settings:', error);
      toast.error(error.message || 'Failed to save Google settings.');
    } finally {
      setSavingGoogle(false);
    }
  };

  const handleSaveNineNineSettings = async () => {
    if (!tenant?._id) return;
    setSavingNineNine(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          nineNineAcres: {
            enabled: nineNineSettings.enabled,
            username: nineNineSettings.username,
            clientId: nineNineSettings.clientId,
            assignmentRule: nineNineSettings.assignmentRule,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('99acres integration settings updated successfully!');
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error saving 99acres settings:', error);
      toast.error(error.message || 'Failed to save 99acres settings.');
    } finally {
      setSavingNineNine(false);
    }
  };

  const handleSaveMagicbricksSettings = async () => {
    if (!tenant?._id) return;
    setSavingMagicbricks(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          magicbricks: {
            enabled: magicbricksSettings.enabled,
            apiKey: magicbricksSettings.apiKey,
            username: magicbricksSettings.username,
            agentId: magicbricksSettings.agentId,
            assignmentRule: magicbricksSettings.assignmentRule,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Magicbricks integration settings updated successfully!');
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error saving Magicbricks settings:', error);
      toast.error(error.message || 'Failed to save Magicbricks settings.');
    } finally {
      setSavingMagicbricks(false);
    }
  };

  const handleSaveHousingSettings = async () => {
    if (!tenant?._id) return;
    setSavingHousing(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          housing: {
            enabled: housingSettings.enabled,
            mobileNumber: housingSettings.mobileNumber,
            profileId: housingSettings.profileId,
            assignmentRule: housingSettings.assignmentRule,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Housing.com integration settings updated successfully!');
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error saving Housing.com settings:', error);
      toast.error(error.message || 'Failed to save Housing.com settings.');
    } finally {
      setSavingHousing(false);
    }
  };

  const handleSaveWhatsappSettings = async () => {
    if (!tenant?._id) return;
    setSavingWhatsapp(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          whatsapp: {
            enabled: whatsappSettings.enabled,
            provider: whatsappSettings.provider,
            assignmentRule: whatsappSettings.assignmentRule,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('WhatsApp integration settings updated successfully!');
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error(error.message || 'Failed to save WhatsApp settings.');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSaveGoogleFormSettings = async () => {
    if (!tenant?._id) return;
    setSavingGoogleForm(true);
    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          googleForm: {
            enabled: googleFormSettings.enabled,
            assignmentRule: googleFormSettings.assignmentRule,
          }
        }
      };
      await updateTenantMutation({ id: tenant._id as any, settings: updatedSettings });
      await refreshTenant();
      toast.success('Google Form integration settings saved!');
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Google Form settings.');
    } finally {
      setSavingGoogleForm(false);
    }
  };

  const handleSaveGoogleSheetSettings = async () => {
    if (!tenant?._id) return;
    setSavingGoogleSheet(true);
    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          googleSheet: {
            enabled: googleSheetSettings.enabled,
            assignmentRule: googleSheetSettings.assignmentRule,
          }
        }
      };
      await updateTenantMutation({ id: tenant._id as any, settings: updatedSettings });
      await refreshTenant();
      toast.success('Google Sheet integration settings saved!');
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Google Sheet settings.');
    } finally {
      setSavingGoogleSheet(false);
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
  const googleWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/google-webhook?tenantId=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/google-webhook?tenantId=tenant_id';

  const housingWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/v1/inbound-leads?portal=housing&token=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/api/v1/inbound-leads?portal=housing&token=tenant_id';

  const nineNineWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/v1/inbound-leads?portal=99acres&token=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/api/v1/inbound-leads?portal=99acres&token=tenant_id';

  const magicbricksWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/v1/inbound-leads?portal=magicbricks&token=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/api/v1/inbound-leads?portal=magicbricks&token=tenant_id';

  const whatsappWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/v1/inbound-leads?portal=whatsapp&token=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/api/v1/inbound-leads?portal=whatsapp&token=tenant_id';

  const googleFormWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/v1/inbound-leads?portal=google_form&token=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/api/v1/inbound-leads?portal=google_form&token=tenant_id';

  const googleSheetWebhookUrl = tenant?._id && convexUrl
    ? `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/v1/inbound-leads?portal=google_sheet&token=${tenant._id}`
    : 'https://<your-convex-deployment>.convex.site/api/v1/inbound-leads?portal=google_sheet&token=tenant_id';

  const isMetaConnected = !!metaSettings.pageId;
  const isMetaActive = metaSettings.enabled && isMetaConnected;
  const isGoogleActive = googleSettings.enabled && !!googleSettings.googleKey;
  const isNineNineActive = nineNineSettings.enabled && (!!nineNineSettings.username || !!nineNineSettings.clientId);
  const isMagicbricksActive = magicbricksSettings.enabled && (!!magicbricksSettings.username || !!magicbricksSettings.agentId || !!magicbricksSettings.apiKey);
  const isHousingActive = housingSettings.enabled && (!!housingSettings.mobileNumber || !!housingSettings.profileId);
  const isWhatsappActive = whatsappSettings.enabled;
  const isGoogleFormActive = googleFormSettings.enabled;
  const isGoogleSheetActive = googleSheetSettings.enabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Plug className="text-slate-400" /> Platform Integrations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Connect external advertising platforms to import leads directly into your CRM.</p>
      </div>

      {/* Grid of integrations cards */}
      <div className="space-y-8 pt-4">
        {/* Social Media Category */}
        <div>
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Social Media</h2>
          <div className="flex flex-wrap gap-6 mt-4">
            <div 
              onClick={() => setActiveModal('meta')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMetaActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMetaActive ? 'bg-emerald-500' : isMetaConnected ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              <div className="w-16 h-16 bg-[#ECF2FF] rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/facebook_ads.webp" 
                  alt="Facebook & Instagram" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Facebook & Instagram
              </span>
            </div>

            {/* WhatsApp Integration Card */}
            <div 
              onClick={() => setActiveModal('whatsapp')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWhatsappActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isWhatsappActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              <div className="w-16 h-16 bg-[#E8F8F0] rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/whatsApp.webp" 
                  alt="WhatsApp Integration" 
                  className="w-11 h-11 object-contain"
                />
              </div>
              
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                WhatsApp Webhook
              </span>
            </div>
          </div>
        </div>

        {/* Google Apps Category */}
        <div>
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Google Apps</h2>
          <div className="flex flex-wrap gap-6 mt-4">
            <div 
              onClick={() => setActiveModal('google')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/google_ads.webp" 
                  alt="Google Ads" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Google Ads
              </span>
            </div>

            {/* Google Form Integration Card */}
            <div
              onClick={() => setActiveModal('googleForm')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleFormActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleFormActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>
              <div className="w-16 h-16 bg-[#F3F7FF] rounded-2xl flex items-center justify-center overflow-hidden">
                <img src="/images/google_form.webp" alt="Google Forms" className="w-12 h-12 object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Google Forms
              </span>
            </div>

            {/* Google Sheet Integration Card */}
            <div
              onClick={() => setActiveModal('googleSheet')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleSheetActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleSheetActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>
              <div className="w-16 h-16 bg-[#E8F5EC] rounded-2xl flex items-center justify-center overflow-hidden">
                <img src="/images/Googlesheet.webp" alt="Google Sheets" className="w-12 h-12 object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Google Sheets
              </span>
            </div>
          </div>
        </div>

        {/* Property Portals Category */}
        <div>
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Property Portals</h2>
          <div className="flex flex-wrap gap-6 mt-4">
            {/* 99acres */}
            <div 
              onClick={() => setActiveModal('nineNineAcres')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNineNineActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isNineNineActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>
              <div className="w-16 h-16 bg-white border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/99acres.webp" 
                  alt="99acres" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                99acres
              </span>
            </div>

            {/* Magicbricks */}
            <div 
              onClick={() => setActiveModal('magicbricks')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMagicbricksActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMagicbricksActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>
              <div className="w-16 h-16 bg-white border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/magicbricks.webp" 
                  alt="Magicbricks" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Magicbricks
              </span>
            </div>

            {/* Housing.com */}
            <div 
              onClick={() => setActiveModal('housing')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHousingActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isHousingActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>
              <div className="w-16 h-16 bg-white border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/hosing.webp" 
                  alt="Housing.com" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Housing.com
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Modal Overlay */}
      {activeModal === 'meta' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center gap-2">
                <Facebook className="text-blue-600 dark:text-blue-400" size={24} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Meta Lead Ads Configuration</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowMetaHelp(!showMetaHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Info size={14} />
                  {showMetaHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {showMetaHelp ? (
                <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Meta Integration Help Guide</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Step 1: Connect your Facebook Account</h4>
                      <p className="mt-1">
                        Click the <strong className="font-bold text-slate-800 dark:text-slate-200">"Connect Account"</strong> button inside settings to log in with Facebook. RealSalePro will fetch the Facebook Pages linked to your profile automatically.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Step 2: Select Page & Map Leads</h4>
                      <p className="mt-1">
                        Select the specific business page running lead form campaigns. The CRM will automatically subscribe to page updates and configure webhook listeners.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Step 3: Assign Lead Access in Business Manager</h4>
                      <p className="mt-1">
                        After connecting your page, go to your <strong className="font-bold text-slate-800 dark:text-slate-200">Facebook Business Manager Settings → Integrations → Lead Access</strong>. Ensure that this App is granted permissions to access lead data for your page.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">📌 Important Note:</h4>
                      <p className="mt-1">
                        Only leads generated through Facebook <strong className="font-bold text-slate-800 dark:text-slate-200">Instant Forms (Lead Ads Campaigns)</strong> will be automatically captured and synced to the CRM.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                    <Button variant="neutral" onClick={() => setShowMetaHelp(false)}>
                      Back to Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {isMetaConnected && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Meta Integration</h4>
                        <p className="text-xs text-gray-500">Temporarily stop or start importing leads from Facebook.</p>
                      </div>
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Status</h3>
                      
                      {!isMetaConnected ? (
                        <div className="p-6 border border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                          <Facebook className="text-gray-300 dark:text-gray-700 w-10 h-10" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No account linked</p>
                            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                              Connect your Facebook Page to automatically pull new leads.
                            </p>
                          </div>
                          <Button
                            onClick={handleFacebookConnect}
                            className="bg-[#1877F2] text-white hover:bg-[#166FE5] border-none font-semibold flex items-center gap-1.5 shadow-sm text-xs py-2"
                          >
                            <Facebook size={14} fill="currentColor" /> Connect Account
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 bg-[#1877F2] text-white rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                                FB
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {metaSettings.pageName || "Connected Page"}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                  ID: {metaSettings.pageId}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={handleDisconnectMeta}
                              isLoading={savingMeta}
                              className="text-[10px] py-1 px-2.5 flex items-center gap-1 flex-shrink-0"
                            >
                              <LogOut size={10} /> Disconnect
                            </Button>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Lead Assignment Rule
                            </label>
                            <Select
                              value={metaSettings.assignmentRule}
                              onChange={(e) => setMetaSettings({ ...metaSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                              className="text-xs py-1.5 h-9"
                              options={[
                                { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                                { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                              ]}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              {metaSettings.assignmentRule === 'manual' 
                                ? 'New leads from Meta will import as unassigned. Admin can assign them manually.' 
                                : 'New leads will be automatically distributed one-by-one to active Sales Executives.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Automated Sync</h3>
                      <p>
                        RealSalePro simplifies the integration. Once you log in with your Facebook account, our system handles the backend configuration:
                      </p>
                      <ul className="space-y-1.5 list-disc pl-4 mt-2">
                        <li>Exchanges authentication codes for permanent page security tokens.</li>
                        <li>Configures webhooks automatically on Facebook Graph API.</li>
                        <li>Saves incoming leads and matches them directly to sales executives.</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              {isMetaConnected && (
                <Button onClick={handleSaveMetaSettings} isLoading={savingMeta} className="gap-2">
                  <Save size={16} /> Save Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Modal Overlay */}
      {activeModal === 'google' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.111 4.113-3.41 0-6.19-2.779-6.19-6.19s2.78-6.19 6.19-6.19c1.483 0 2.825.524 3.878 1.547l3.123-3.124C19.046 2.372 15.824 1 12.24 1 5.756 1 .5 6.256.5 12.74s5.256 11.74 11.74 11.74c7.17 0 11.24-5.02 11.24-11.44 0-.771-.06-1.5-.2-2.19H12.24z"/>
                </svg>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Google Ads Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowGoogleHelp(!showGoogleHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Info size={14} />
                  {showGoogleHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    setShowGoogleHelp(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {showGoogleHelp ? (
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="text-blue-500" size={20} />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Ads Integration Help Guide</h3>
                </div>
                
                <div className="space-y-6 text-sm text-slate-600 dark:text-gray-400">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">Step 1: Configure & Save Settings in CRM</h4>
                    <p className="text-xs leading-relaxed">
                      First, specify a secret passphrase (Google Key) of your choice in the Google Ads settings inside this CRM. For example: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-rose-500">my_secret_google_key</code>. Then, turn ON the <strong className="text-slate-800 dark:text-slate-200">"Enable Google Ads Integration"</strong> toggle and click <strong className="text-slate-800 dark:text-slate-200">"Save Settings"</strong> at the bottom.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">Step 2: Add Webhook in Google Ads Lead Form</h4>
                    <ol className="list-decimal pl-5 text-xs space-y-2 leading-relaxed">
                      <li>Log in to your <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Ads account</a>.</li>
                      <li>Go to your campaign, select <strong className="text-slate-800 dark:text-slate-200">Assets</strong> or <strong className="text-slate-800 dark:text-slate-200">Ad Extensions</strong>, and create or edit a <strong className="text-slate-800 dark:text-slate-200">Lead Form extension</strong>.</li>
                      <li>Scroll down to the bottom section called <strong className="text-slate-800 dark:text-slate-200">"Export leads from Google Ads"</strong> and choose <strong className="text-slate-800 dark:text-slate-200">"Other webhook integration options"</strong>.</li>
                      <li>Copy and paste your dynamic webhook details:
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/5 space-y-2">
                          <div>
                            <span className="font-semibold block text-slate-700 dark:text-slate-300 text-[11px]">Webhook URL:</span>
                            <code className="block p-1 bg-white dark:bg-slate-905 rounded border border-slate-200 dark:border-slate-800 text-[10px] break-all select-all font-mono text-blue-500">{googleWebhookUrl}</code>
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-700 dark:text-slate-300 text-[11px]">Google Key (Passphrase):</span>
                            <code className="block p-1 bg-white dark:bg-slate-905 rounded border border-slate-200 dark:border-slate-800 text-[10px] select-all font-mono text-blue-500">{googleSettings.googleKey || "[Set your Google Key first]"}</code>
                          </div>
                        </div>
                      </li>
                      <li>Click the <strong className="text-slate-800 dark:text-slate-200">"Send test data"</strong> button. Google Ads will push a mock test lead. You will see a success message in Google Ads, and a new test lead will instantly appear in your CRM Leads list with the source <strong className="text-slate-800 dark:text-slate-200">"Google"</strong>.</li>
                      <li>Save the Lead Form extension inside your campaign.</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                  <Button variant="neutral" onClick={() => setShowGoogleHelp(false)}>
                    Back to Settings
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Google Ads Integration</h4>
                      <p className="text-xs text-gray-500">Temporarily stop or start importing leads from Google webhooks.</p>
                    </div>
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Settings</h3>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Google Ads Webhook Passphrase (Google Key)
                        </label>
                        <div className="relative">
                          <input
                            type={showGoogleKey ? "text" : "password"}
                            value={googleSettings.googleKey}
                            onChange={(e) => setGoogleSettings({ ...googleSettings, googleKey: e.target.value })}
                            placeholder="Define a secure passphrase (e.g. key_12345)"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGoogleKey(!showGoogleKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showGoogleKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Define a secure passphrase here, then enter this exact same key inside Google Ads webhook settings.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
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
                        <p className="text-[10px] text-gray-500 mt-1">
                          {googleSettings.assignmentRule === 'manual' 
                            ? 'New leads from Google Ads will import as unassigned. Admin can assign them manually.' 
                            : 'New leads will be automatically distributed one-by-one to active Sales Executives.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Webhook Setup Guide</h3>
                      <ol className="space-y-3 list-decimal pl-4">
                        <li>Create or edit a <strong>Lead Form extension</strong> in your Google Ads campaign settings.</li>
                        <li>Scroll to <strong>"Export leads from Google Ads"</strong> and select <strong>"Other webhook integration"</strong>.</li>
                        <li>Enter these details:
                          <div className="mt-2 space-y-2">
                            <div>
                              <span className="font-semibold block text-slate-700 dark:text-slate-300">Webhook URL:</span>
                              <code className="block p-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 break-all select-all font-mono text-[10px]">{googleWebhookUrl}</code>
                            </div>
                            <div>
                              <span className="font-semibold block text-slate-700 dark:text-slate-300">Google Key:</span>
                              <code className="block p-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 select-all font-mono text-[10px]">{googleSettings.googleKey || "[Set passphrase on the left]"}</code>
                            </div>
                          </div>
                        </li>
                        <li>Click <strong>"Send test data"</strong> in Google Ads to test the connection immediately.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
                  <Button variant="neutral" onClick={() => setActiveModal(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveGoogleSettings} isLoading={savingGoogle} className="gap-2">
                    <Save size={16} /> Save Settings
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 99acres Modal Overlay */}
      {activeModal === 'nineNineAcres' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/images/99acres.webp" alt="99acres" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">99acres Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowNineNineHelp(!showNineNineHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Info size={14} />
                  {showNineNineHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {showNineNineHelp ? (
                <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">99acres Integration Help Guide</h3>
                  </div>
                  <p>
                    99acres does not offer a self-service webhook configuration panel. You must send your unique Webhook URL and account details to your **99acres Account Manager** or **Support Team** to activate it.
                  </p>
                  
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[10px]">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Request Type:</span> POST
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Content-Type:</span> application/json
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Webhook URL:</span>
                      <code className="block p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-850 break-all select-all text-blue-500 mt-1">{nineNineWebhookUrl}</code>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">📋 Email Template to Support:</h4>
                    <p className="mb-2 text-[10px]">Fill in your Client ID and Username on the settings page first, then copy this text:</p>
                    <button
                      type="button"
                      onClick={() => {
                        const emailText = `Subject: Query Regarding Webhook Integration - Client ID: ${nineNineSettings.clientId || "[Your Client ID]"}\n\nHi 99acres Support / Account Manager,\n\nI want to integrate my 99acres leads with my CRM using a Real-time Webhook Push.\n\nPlease configure my account with the following parameters:\n\n- Client ID: ${nineNineSettings.clientId || "[Your Client ID]"}\n- Username/Email: ${nineNineSettings.username || "[Your Registered Email]"}\n- Webhook URL: ${nineNineWebhookUrl}\n- Request Method: HTTP POST\n- Content-Type: application/json\n\nKindly activate "Real-time Webhook Push" for this URL as soon as possible and let me know once done.\n\nThanks!`;
                        navigator.clipboard.writeText(emailText);
                        toast.success("Email template copied to clipboard!");
                      }}
                      className="w-full text-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Copy Support Email Template
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                    <Button variant="neutral" onClick={() => setShowNineNineHelp(false)}>
                      Back to Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable 99acres Webhook Integration</h4>
                      <p className="text-xs text-gray-500">Temporarily stop or start importing leads from 99acres webhooks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nineNineSettings.enabled}
                        onChange={(e) => setNineNineSettings({ ...nineNineSettings, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        99acres Registered Email ID / Username
                      </label>
                      <input
                        type="text"
                        value={nineNineSettings.username || ""}
                        onChange={(e) => setNineNineSettings({ ...nineNineSettings, username: e.target.value })}
                        placeholder="Enter registered Email or Username"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        99acres Client ID / Profile ID
                      </label>
                      <input
                        type="text"
                        value={nineNineSettings.clientId || ""}
                        onChange={(e) => setNineNineSettings({ ...nineNineSettings, clientId: e.target.value })}
                        placeholder="Enter your 99acres Client ID"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Lead Assignment Rule
                      </label>
                      <Select
                        value={nineNineSettings.assignmentRule}
                        onChange={(e) => setNineNineSettings({ ...nineNineSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                        options={[
                          { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                          { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setActiveModal(null)}>Cancel</Button>
              {!showNineNineHelp && (
                <Button onClick={handleSaveNineNineSettings} isLoading={savingNineNine} className="gap-2">
                  <Save size={16} /> Save Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Magicbricks Modal Overlay */}
      {activeModal === 'magicbricks' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/images/magicbricks.webp" alt="Magicbricks" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Magicbricks Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowMagicbricksHelp(!showMagicbricksHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Info size={14} />
                  {showMagicbricksHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {showMagicbricksHelp ? (
                <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Magicbricks Integration Help Guide</h3>
                  </div>
                  <p>
                    Magicbricks requires their support team to map webhooks manually. Send your Webhook URL and account details to your **Magicbricks Account Representative**.
                  </p>
                  
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[10px]">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Integration Type:</span> Push API
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Webhook URL:</span>
                      <code className="block p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-850 break-all select-all text-blue-500 mt-1">{magicbricksWebhookUrl}</code>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">📋 Email Template to Representative:</h4>
                    <p className="mb-2 text-[10px]">Fill in your Username / Agent ID on the settings page first, then copy this text:</p>
                    <button
                      type="button"
                      onClick={() => {
                        const emailText = `Subject: Inquiry Regarding Magicbricks Lead Push API Integration - Agent ID: ${magicbricksSettings.username || "[Your Agent ID]"}\n\nHi Magicbricks Support,\n\nI want to integrate my Magicbricks leads with my CRM using the Lead Push API.\n\nPlease map my account with the following parameters:\n\n- Magicbricks Username / Agent ID: ${magicbricksSettings.username || "[Your Agent ID]"}\n- Webhook URL: ${magicbricksWebhookUrl}\n- Request Method: HTTP POST\n- Content-Type: application/json\n\nPlease activate this Lead Push integration and let me know once verified.\n\nThanks!`;
                        navigator.clipboard.writeText(emailText);
                        toast.success("Email template copied to clipboard!");
                      }}
                      className="w-full text-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Copy Magicbricks Support Email
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                    <Button variant="neutral" onClick={() => setShowMagicbricksHelp(false)}>
                      Back to Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Magicbricks Webhook Integration</h4>
                      <p className="text-xs text-gray-500">Temporarily stop or start importing leads from Magicbricks webhooks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={magicbricksSettings.enabled}
                        onChange={(e) => setMagicbricksSettings({ ...magicbricksSettings, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Magicbricks Registered Username / Agent ID
                      </label>
                      <input
                        type="text"
                        value={magicbricksSettings.username || ""}
                        onChange={(e) => setMagicbricksSettings({ ...magicbricksSettings, username: e.target.value })}
                        placeholder="Enter registered Username or Agent ID"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        LMS API Key (Optional Developer Key)
                      </label>
                      <input
                        type="text"
                        value={magicbricksSettings.apiKey || ""}
                        onChange={(e) => setMagicbricksSettings({ ...magicbricksSettings, apiKey: e.target.value })}
                        placeholder="Enter LMS API Key if provided"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      />
                      <p className="text-[9px] text-gray-500 mt-1">
                        Only required if your account uses a pull-based API sync instead of push webhook.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Lead Assignment Rule
                      </label>
                      <Select
                        value={magicbricksSettings.assignmentRule}
                        onChange={(e) => setMagicbricksSettings({ ...magicbricksSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                        options={[
                          { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                          { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setActiveModal(null)}>Cancel</Button>
              {!showMagicbricksHelp && (
                <Button onClick={handleSaveMagicbricksSettings} isLoading={savingMagicbricks} className="gap-2">
                  <Save size={16} /> Save Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Housing.com Modal Overlay */}
      {activeModal === 'housing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/images/hosing.webp" alt="Housing.com" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Housing.com Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowHousingHelp(!showHousingHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Info size={14} />
                  {showHousingHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {showHousingHelp ? (
                <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Housing.com Integration Help Guide</h3>
                  </div>
                  <p>
                    Housing.com requires their support team or your partner account representative to map the lead push hook.
                  </p>
                  
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[10px]">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Request Type:</span> POST
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Webhook URL:</span>
                      <code className="block p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-850 break-all select-all text-blue-500 mt-1">{housingWebhookUrl}</code>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Security Token:</span> URL Parameter authentication (`token`) is already embedded in the URL. No custom headers are needed.
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">📋 Email Template to Representative:</h4>
                    <p className="mb-2 text-[10px]">Fill in your Profile ID and Mobile Number on the settings page first, then copy this text:</p>
                    <button
                      type="button"
                      onClick={() => {
                        const emailText = `Subject: Webhook URL Mapping Request for Housing.com - Profile ID: ${housingSettings.profileId || "[Your Profile ID]"}\n\nHi Housing.com Support,\n\nI want to integrate my Housing.com leads into my CRM using a Lead Webhook Push.\n\nPlease map my account with the following parameters:\n\n- Housing Profile ID: ${housingSettings.profileId || "[Your Profile ID]"}\n- Registered Mobile Number: ${housingSettings.mobileNumber || "[Your Registered Mobile]"}\n- Webhook URL: ${housingWebhookUrl}\n- Request Method: HTTP POST\n- Content-Type: application/json\n\nKindly map this endpoint to my listings and verify once active.\n\nThanks!`;
                        navigator.clipboard.writeText(emailText);
                        toast.success("Housing.com email template copied!");
                      }}
                      className="w-full text-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Copy Housing Support Email
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                    <Button variant="neutral" onClick={() => setShowHousingHelp(false)}>
                      Back to Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Housing.com Integration</h4>
                      <p className="text-xs text-gray-500">Temporarily stop or start importing leads from Housing.com webhooks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={housingSettings.enabled}
                        onChange={(e) => setHousingSettings({ ...housingSettings, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Housing.com Registered Mobile Number
                      </label>
                      <input
                        type="text"
                        value={housingSettings.mobileNumber || ""}
                        onChange={(e) => setHousingSettings({ ...housingSettings, mobileNumber: e.target.value })}
                        placeholder="Enter registered mobile number"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Housing.com Profile ID
                      </label>
                      <input
                        type="text"
                        value={housingSettings.profileId || ""}
                        onChange={(e) => setHousingSettings({ ...housingSettings, profileId: e.target.value })}
                        placeholder="Enter your Housing Profile ID"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Lead Assignment Rule
                      </label>
                      <Select
                        value={housingSettings.assignmentRule}
                        onChange={(e) => setHousingSettings({ ...housingSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                        options={[
                          { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                          { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setActiveModal(null)}>Cancel</Button>
              {!showHousingHelp && (
                <Button onClick={handleSaveHousingSettings} isLoading={savingHousing} className="gap-2">
                  <Save size={16} /> Save Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Overlay */}
      {activeModal === 'whatsapp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/images/whatsApp.webp" alt="WhatsApp" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowWhatsappHelp(!showWhatsappHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Info size={14} />
                  {showWhatsappHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {showWhatsappHelp ? (
                <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp Integration Help Guide</h3>
                  </div>
                  <p>
                    WhatsApp BSPs send lead events to your CRM Webhook endpoint in real time. Please paste the webhook URL in your BSP developer portal or email it to your provider account manager.
                  </p>
                  
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[10px]">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Request Type:</span> POST
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Content-Type:</span> application/json
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Webhook URL:</span>
                      <code className="block p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-850 break-all select-all text-blue-500 mt-1">{whatsappWebhookUrl}</code>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">📋 Email Template to Provider Support:</h4>
                    <p className="mb-2 text-[10px]">Select your BSP provider on the settings page first, then copy this text:</p>
                    <button
                      type="button"
                      onClick={() => {
                        const emailText = `Subject: Webhook Endpoint Setup Request for WhatsApp Lead Push API\n\nHi Partner Support,\n\nI want to integrate my WhatsApp leads with my Real Estate CRM via Webhook lead push.\n\nPlease configure my webhook settings with the following details:\n\n- Webhook URL: ${whatsappWebhookUrl}\n- Request Type: HTTP POST\n- Content-Type: application/json\n- Events: Inbound Message / New Lead Inquiry\n\nKindly activate this mapping on my active number and let me know once verified.\n\nThanks!`;
                        navigator.clipboard.writeText(emailText);
                        toast.success("WhatsApp support email template copied!");
                      }}
                      className="w-full text-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Copy Webhook Request Email
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                    <Button variant="neutral" onClick={() => setShowWhatsappHelp(false)}>
                      Back to Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable WhatsApp Integration</h4>
                      <p className="text-xs text-gray-500">Temporarily stop or start importing leads from WhatsApp webhooks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappSettings.enabled}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Select WhatsApp Business Provider (BSP)
                      </label>
                      <Select
                        value={whatsappSettings.provider}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, provider: e.target.value as any })}
                        options={[
                          { label: 'Wati.io', value: 'wati' },
                          { label: 'Aisensy', value: 'aisensy' },
                          { label: 'Interakt', value: 'interakt' },
                          { label: 'DoubleTick', value: 'doubletick' },
                          { label: 'Custom / Other Provider', value: 'custom' }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Lead Assignment Rule
                      </label>
                      <Select
                        value={whatsappSettings.assignmentRule}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                        options={[
                          { label: 'Manual Assignment (Unassigned)', value: 'manual' },
                          { label: 'Round Robin Auto-Assignment', value: 'round_robin' }
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setActiveModal(null)}>Cancel</Button>
              {!showWhatsappHelp && (
                <Button onClick={handleSaveWhatsappSettings} isLoading={savingWhatsapp} className="gap-2">
                  <Save size={16} /> Save Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Facebook Pages Selection Modal (Nested inside Meta modal check) */}
      {showPagesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
      {/* Google Form Modal */}
      {activeModal === 'googleForm' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src="/images/google_form.webp" alt="Google Forms" className="w-7 h-7 object-contain" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Google Forms Webhook Integration</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGoogleFormHelp(!showGoogleFormHelp)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                >
                  <span>📋</span>
                  {showGoogleFormHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {showGoogleFormHelp ? (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">📋 Google Forms Setup Guide</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Connect any Google Form to your CRM using a Google Apps Script trigger. When a user submits the form, the script automatically sends the response to your CRM webhook.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">🔗 Your Webhook URL (copy this):</p>
                    <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-all text-blue-600 dark:text-blue-400 text-xs select-all">{googleFormWebhookUrl}</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">📝 Step-by-step Setup:</p>
                    <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Open your Google Form → click ⋮ menu → <strong>Script editor</strong></li>
                      <li>Delete any existing code and paste the Apps Script below</li>
                      <li>Replace the WEBHOOK_URL value with your URL above</li>
                      <li>Click <strong>Save</strong>, then <strong>Triggers</strong> (alarm icon)</li>
                      <li>Add trigger: Function <strong>onFormSubmit</strong> → Event type <strong>On form submit</strong></li>
                      <li>Authorize the script when prompted → Done!</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">📋 Apps Script Code:</p>
                    <pre className="text-xs bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto">{`var WEBHOOK_URL = "${googleFormWebhookUrl}";

function onFormSubmit(e) {
  var responses = e.response.getItemResponses();
  var data = {};
  responses.forEach(function(r) {
    var key = r.getItem().getTitle().toLowerCase().trim();
    data[key] = r.getResponse();
  });
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ row_data: data }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`}</pre>
                    <button
                      onClick={() => {
                        const script = `var WEBHOOK_URL = "${googleFormWebhookUrl}";

function onFormSubmit(e) {
  var responses = e.response.getItemResponses();
  var data = {};
  responses.forEach(function(r) {
    var key = r.getItem().getTitle().toLowerCase().trim();
    data[key] = r.getResponse();
  });
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ row_data: data }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`;
                        navigator.clipboard.writeText(script);
                        toast.success('Apps Script code copied!');
                      }}
                      className="w-full text-xs py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                    >
                      📋 Copy Apps Script Code
                    </button>
                  </div>
                  <button onClick={() => setShowGoogleFormHelp(false)} className="text-xs text-blue-600 dark:text-blue-400 underline mt-1">Hide Guide</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Webhook Endpoint</p>
                    <code className="block text-xs break-all text-blue-600 dark:text-blue-400 select-all">{googleFormWebhookUrl}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(googleFormWebhookUrl); toast.success('Webhook URL copied!'); }}
                      className="mt-2 text-xs px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Google Forms Integration</h4>
                      <p className="text-xs text-gray-500">Accept leads from Google Form submissions via webhook.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={googleFormSettings.enabled}
                      onChange={(e) => setGoogleFormSettings({ ...googleFormSettings, enabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Lead Assignment Rule</h4>
                    <p className="text-xs text-gray-500">How should incoming leads from Google Forms be distributed?</p>
                    <select
                      value={googleFormSettings.assignmentRule}
                      onChange={(e) => setGoogleFormSettings({ ...googleFormSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                      className="w-full p-2 text-sm border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Manual Assignment</option>
                      <option value="round_robin">Round Robin (Auto)</option>
                    </select>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300"><strong>💡 Field Mapping Tip:</strong> Make sure your Google Form question titles include keywords like <em>Name</em>, <em>Phone</em>, <em>Email</em>, <em>City</em>, <em>Budget</em>, <em>Project</em> so the CRM can auto-map them. Click "Setup Help Guide" for the Apps Script code.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleSaveGoogleFormSettings}
                disabled={savingGoogleForm}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingGoogleForm ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheet Modal */}
      {activeModal === 'googleSheet' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src="/images/Googlesheet.webp" alt="Google Sheets" className="w-7 h-7 object-contain" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Google Sheets Webhook Integration</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGoogleSheetHelp(!showGoogleSheetHelp)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
                >
                  <span>📋</span>
                  {showGoogleSheetHelp ? "Hide Help" : "Setup Help Guide"}
                </button>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {showGoogleSheetHelp ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">📊 Google Sheets Setup Guide</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Connect Google Sheets to your CRM using Apps Script. Every time a new row is added or edited in your sheet, the script will automatically push the row data to your CRM.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">🔗 Your Webhook URL (copy this):</p>
                    <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-all text-emerald-600 dark:text-emerald-400 text-xs select-all">{googleSheetWebhookUrl}</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">📝 Step-by-step Setup:</p>
                    <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Open your Google Sheet → <strong>Extensions</strong> → <strong>Apps Script</strong></li>
                      <li>Delete any existing code and paste the Apps Script below</li>
                      <li>Replace the WEBHOOK_URL value with your URL above</li>
                      <li>Ensure Row 1 has column headers matching: <em>Name, Phone, Email, City, Budget, Project</em></li>
                      <li>Click <strong>Save</strong>, then <strong>Triggers</strong> (alarm icon)</li>
                      <li>Add trigger: Function <strong>onSheetEdit</strong> → Event type <strong>On edit</strong></li>
                      <li>Authorize the script when prompted → Done!</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">📋 Apps Script Code:</p>
                    <pre className="text-xs bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto">{`var WEBHOOK_URL = "${googleSheetWebhookUrl}";

function onSheetEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var row = range.getRow();
  if (row <= 1) return; // skip header row
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = {};
  headers.forEach(function(header, i) {
    data[header.toString().toLowerCase().trim()] = rowData[i];
  });
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ row_data: data }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`}</pre>
                    <button
                      onClick={() => {
                        const script = `var WEBHOOK_URL = "${googleSheetWebhookUrl}";

function onSheetEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var row = range.getRow();
  if (row <= 1) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = {};
  headers.forEach(function(header, i) {
    data[header.toString().toLowerCase().trim()] = rowData[i];
  });
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ row_data: data }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`;
                        navigator.clipboard.writeText(script);
                        toast.success('Apps Script code copied!');
                      }}
                      className="w-full text-xs py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      📋 Copy Apps Script Code
                    </button>
                  </div>
                  <button onClick={() => setShowGoogleSheetHelp(false)} className="text-xs text-emerald-600 dark:text-emerald-400 underline mt-1">Hide Guide</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Webhook Endpoint</p>
                    <code className="block text-xs break-all text-emerald-600 dark:text-emerald-400 select-all">{googleSheetWebhookUrl}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(googleSheetWebhookUrl); toast.success('Webhook URL copied!'); }}
                      className="mt-2 text-xs px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Google Sheets Integration</h4>
                      <p className="text-xs text-gray-500">Accept leads from Google Sheet row edits via webhook.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={googleSheetSettings.enabled}
                      onChange={(e) => setGoogleSheetSettings({ ...googleSheetSettings, enabled: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Lead Assignment Rule</h4>
                    <p className="text-xs text-gray-500">How should incoming leads from Google Sheets be distributed?</p>
                    <select
                      value={googleSheetSettings.assignmentRule}
                      onChange={(e) => setGoogleSheetSettings({ ...googleSheetSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                      className="w-full p-2 text-sm border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="manual">Manual Assignment</option>
                      <option value="round_robin">Round Robin (Auto)</option>
                    </select>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300"><strong>💡 Column Header Tip:</strong> Ensure your Google Sheet's Row 1 headers include keywords like <em>Name</em>, <em>Phone</em>, <em>Email</em>, <em>City</em>, <em>Budget</em>, <em>Project</em>. The CRM auto-maps column names to lead fields. Click "Setup Help Guide" for the Apps Script.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleSaveGoogleSheetSettings}
                disabled={savingGoogleSheet}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {savingGoogleSheet ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
