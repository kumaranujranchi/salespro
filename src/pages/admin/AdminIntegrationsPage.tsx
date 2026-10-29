import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMutation, useAction } from "../../lib/reactive";
import { api } from '../../lib/api-endpoints';
import { getApiBaseUrl } from '../../lib/api';
import { tenantsService, capiService, metaService } from '../../lib/services';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Settings, Save, Facebook, Info, LogOut, Eye, EyeOff, Plug, X, ChevronRight, Lock, CheckCircle2, AlertCircle, ExternalLink, Activity, Sparkles, RefreshCw, Globe, Code, Copy, Send, Smartphone, Check } from 'lucide-react';

export function AdminIntegrationsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const isFreePlan = tenant?.plan_tier === 'free';
  const toast = useToast();
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [savingNineNine, setSavingNineNine] = useState(false);
  const [savingMagicbricks, setSavingMagicbricks] = useState(false);
  const [savingHousing, setSavingHousing] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingGoogleForm, setSavingGoogleForm] = useState(false);
  const [savingGoogleSheet, setSavingGoogleSheet] = useState(false);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [savingMetaCapi, setSavingMetaCapi] = useState(false);
  const [savingGoogleConversion, setSavingGoogleConversion] = useState(false);
  const [isTestingCapi, setIsTestingCapi] = useState(false);
  const [capiTestResult, setCapiTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [isTestingWebsiteLead, setIsTestingWebsiteLead] = useState(false);
  const [websiteTestResult, setWebsiteTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [websiteActiveTab, setWebsiteActiveTab] = useState<'elementor' | 'html' | 'php' | 'zapier'>('elementor');
  const [showMetaCapiToken, setShowMetaCapiToken] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  
  // Facebook OAuth Actions
  const exchangeCodeAndGetPagesAction = useAction("meta:exchangeCodeAndGetPages" as any);
  const subscribePageToWebhookAction = useAction("meta:subscribePageToWebhook" as any);

  // Modal display states
  const [activeModal, setActiveModal] = useState<'meta' | 'google' | 'nineNineAcres' | 'magicbricks' | 'housing' | 'whatsapp' | 'googleForm' | 'googleSheet' | 'website' | 'metaCapi' | 'googleConversion' | null>(null);
  const [showMetaHelp, setShowMetaHelp] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [showNineNineHelp, setShowNineNineHelp] = useState(false);
  const [showMagicbricksHelp, setShowMagicbricksHelp] = useState(false);
  const [showHousingHelp, setShowHousingHelp] = useState(false);
  const [showWhatsappHelp, setShowWhatsappHelp] = useState(false);
  const [showGoogleFormHelp, setShowGoogleFormHelp] = useState(false);
  const [showGoogleSheetHelp, setShowGoogleSheetHelp] = useState(false);
  const [showWebsiteHelp, setShowWebsiteHelp] = useState(false);
  const [showMetaCapiHelp, setShowMetaCapiHelp] = useState(false);
  const [showGoogleConversionHelp, setShowGoogleConversionHelp] = useState(false);

  // Website Webhook State
  const [websiteSettings, setWebsiteSettings] = useState({
    enabled: true,
    assignmentRule: 'manual' as 'manual' | 'round_robin'
  });

  // Meta Conversions API (CAPI) State
  const [metaCapiSettings, setMetaCapiSettings] = useState({
    enabled: false,
    pixelId: '',
    accessToken: '',
    testEventCode: '',
    sendQualified: true,
    sendSiteVisit: true,
    sendSale: true,
    siteVisitValue: 1000
  });

  // Google Offline Conversions State
  const [googleConversionSettings, setGoogleConversionSettings] = useState({
    enabled: false,
    conversionActionId: '',
    customerId: '',
    sendQualified: true,
    sendSale: true
  });

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
    provider: 'meta_cloud' as 'meta_cloud' | 'wati' | 'aisensy' | 'interakt' | 'doubletick' | 'custom',
    assignmentRule: 'manual' as 'manual' | 'round_robin',
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    bspApiKey: '',
    bspEndpoint: '',
    autoWelcomeEnabled: false,
    welcomeTemplateName: 'realsalepro_lead_welcome',
    templateLanguage: 'en',
    customGreeting: 'Namaste',
    companyDisplayName: '',
    representativeName: 'Our Property Specialist',
    brochureUrl: '',
    customMessageBody: '',
  });
  const [whatsappActiveTab, setWhatsappActiveTab] = useState<'api_setup' | 'auto_welcome' | 'test'>('api_setup');
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [testWhatsAppPhone, setTestWhatsAppPhone] = useState('');
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [whatsAppTestResult, setWhatsAppTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);

  // Pages selection modal state
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [fetchingPages, setFetchingPages] = useState(false);
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);

  useEffect(() => {
    const tenantId = tenant?._id as string | undefined;
    if (!tenantId) return;
    let cancelled = false;

    tenantsService
      .getWebhookSecret(tenantId)
      .then((res) => {
        if (!cancelled && res?.secret) setWebhookSecret(res.secret);
      })
      .catch((err) => console.error('Failed to load webhook token:', err));

    return () => {
      cancelled = true;
    };
  }, [tenant?._id]);

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
      const wa = tenant.settings.integrations.whatsapp as any;
      setWhatsappSettings({
        enabled: wa.enabled ?? false,
        provider: wa.provider ?? 'meta_cloud',
        assignmentRule: wa.assignmentRule ?? 'manual',
        phoneNumberId: wa.phoneNumberId ?? '',
        wabaId: wa.wabaId ?? '',
        accessToken: wa.accessToken ?? '',
        bspApiKey: wa.bspApiKey ?? '',
        bspEndpoint: wa.bspEndpoint ?? '',
        autoWelcomeEnabled: wa.autoWelcomeEnabled ?? false,
        welcomeTemplateName: wa.welcomeTemplateName ?? 'realsalepro_lead_welcome',
        templateLanguage: wa.templateLanguage ?? 'en',
        customGreeting: wa.customGreeting ?? 'Namaste',
        companyDisplayName: wa.companyDisplayName ?? tenant.name ?? '',
        representativeName: wa.representativeName ?? 'Our Property Specialist',
        brochureUrl: wa.brochureUrl ?? '',
        customMessageBody: wa.customMessageBody ?? '',
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
    if ((tenant?.settings?.integrations as any)?.website) {
      const ws = (tenant.settings.integrations as any).website;
      setWebsiteSettings({
        enabled: ws.enabled ?? true,
        assignmentRule: (ws.assignmentRule as 'manual' | 'round_robin') ?? 'manual'
      });
    }
    if ((tenant?.settings?.integrations as any)?.meta_capi) {
      const mc = (tenant.settings.integrations as any).meta_capi;
      setMetaCapiSettings({
        enabled: mc.enabled ?? false,
        pixelId: mc.pixelId ?? '',
        accessToken: mc.accessToken ?? '',
        testEventCode: mc.testEventCode ?? '',
        sendQualified: mc.sendQualified ?? true,
        sendSiteVisit: mc.sendSiteVisit ?? true,
        sendSale: mc.sendSale ?? true,
        siteVisitValue: mc.siteVisitValue ?? 1000
      });
    }
    if ((tenant?.settings?.integrations as any)?.google_conversion) {
      const gc = (tenant.settings.integrations as any).google_conversion;
      setGoogleConversionSettings({
        enabled: gc.enabled ?? false,
        conversionActionId: gc.conversionActionId ?? '',
        customerId: gc.customerId ?? '',
        sendQualified: gc.sendQualified ?? true,
        sendSale: gc.sendSale ?? true
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
    setShowWebsiteHelp(false);
    setShowMetaCapiHelp(false);
    setShowGoogleConversionHelp(false);
    setCapiTestResult(null);
    setWebsiteTestResult(null);
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
            phoneNumberId: whatsappSettings.phoneNumberId,
            wabaId: whatsappSettings.wabaId,
            accessToken: whatsappSettings.accessToken,
            bspApiKey: whatsappSettings.bspApiKey,
            bspEndpoint: whatsappSettings.bspEndpoint,
            autoWelcomeEnabled: whatsappSettings.autoWelcomeEnabled,
            welcomeTemplateName: whatsappSettings.welcomeTemplateName,
            templateLanguage: whatsappSettings.templateLanguage,
            customGreeting: whatsappSettings.customGreeting,
            companyDisplayName: whatsappSettings.companyDisplayName,
            representativeName: whatsappSettings.representativeName,
            brochureUrl: whatsappSettings.brochureUrl,
            customMessageBody: whatsappSettings.customMessageBody,
          }
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('WhatsApp API & automated messaging settings updated successfully!');
      setActiveModal(null);
    } catch (error: any) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error(error.message || 'Failed to save WhatsApp settings.');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testWhatsAppPhone.trim()) {
      toast.error('Please enter a mobile number with country code (e.g. 919876543210)');
      return;
    }
    setIsTestingWhatsApp(true);
    setWhatsAppTestResult(null);
    try {
      const res = await metaService.testWhatsAppMessage({
        provider: whatsappSettings.provider,
        phoneNumberId: whatsappSettings.phoneNumberId,
        accessToken: whatsappSettings.accessToken,
        bspEndpoint: whatsappSettings.bspEndpoint,
        bspApiKey: whatsappSettings.bspApiKey,
        toPhone: testWhatsAppPhone,
        templateName: whatsappSettings.welcomeTemplateName || 'realsalepro_lead_welcome',
        languageCode: whatsappSettings.templateLanguage || 'en',
        bodyParams: [
          'Test Lead',
          whatsappSettings.companyDisplayName || tenant?.name || 'Company',
          'Premium Residential Suite',
          whatsappSettings.representativeName || 'Property Consultant',
          whatsappSettings.brochureUrl || 'https://realsalepro.in',
        ],
      });
      setWhatsAppTestResult({ success: true, message: `Delivered successfully! Message ID: ${res.messageId || 'OK'}` });
      toast.success('Test WhatsApp message delivered!');
    } catch (err: any) {
      const errMsg = err.message || 'Failed to dispatch WhatsApp message.';
      setWhatsAppTestResult({ success: false, message: errMsg });
      toast.error('WhatsApp test failed: ' + errMsg);
    } finally {
      setIsTestingWhatsApp(false);
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

  const handleSaveWebsiteSettings = async () => {
    if (!tenant?._id) return;
    setSavingWebsite(true);
    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          website: {
            enabled: websiteSettings.enabled,
            assignmentRule: websiteSettings.assignmentRule,
          }
        }
      };
      await updateTenantMutation({ id: tenant._id as any, settings: updatedSettings });
      await refreshTenant();
      toast.success('Website webhook integration settings saved!');
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Website webhook settings.');
    } finally {
      setSavingWebsite(false);
    }
  };

  const handleSendTestWebsiteLead = async () => {
    if (!webhookSecret) {
      toast.error('Webhook token not ready yet. Please wait a moment.');
      return;
    }
    setIsTestingWebsiteLead(true);
    setWebsiteTestResult(null);
    try {
      const testUrl = `${publicApiBase}/v1/inbound-leads?portal=website&token=${webhookToken}`;
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Rahul Sharma (Website Test)',
          phone: '9876543210',
          email: 'rahul.test@example.com',
          city: 'Mumbai',
          budget: '75 Lakhs',
          requirement: '3 BHK Luxury Apartment',
          message: 'Website test inquiry: I am interested in your project.'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebsiteTestResult({
          success: true,
          message: `Test lead successfully created in CRM! Lead ID: ${data.lead_id || data.id}`
        });
        toast.success('Test lead successfully received by CRM! Check Leads page.');
      } else {
        setWebsiteTestResult({
          success: false,
          message: data.error || 'Server rejected test lead'
        });
        toast.error(data.error || 'Failed to submit test lead');
      }
    } catch (err: any) {
      setWebsiteTestResult({
        success: false,
        message: err.message || 'Network error while sending test lead'
      });
      toast.error(err.message || 'Failed to test website webhook');
    } finally {
      setIsTestingWebsiteLead(false);
    }
  };

  const handleSaveMetaCapiSettings = async () => {
    if (!tenant?._id) return;
    setSavingMetaCapi(true);
    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          meta_capi: {
            enabled: metaCapiSettings.enabled,
            pixelId: metaCapiSettings.pixelId.trim(),
            accessToken: metaCapiSettings.accessToken.trim(),
            testEventCode: metaCapiSettings.testEventCode.trim(),
            sendQualified: metaCapiSettings.sendQualified,
            sendSiteVisit: metaCapiSettings.sendSiteVisit,
            sendSale: metaCapiSettings.sendSale,
            siteVisitValue: Number(metaCapiSettings.siteVisitValue) || 1000,
          }
        }
      };
      await updateTenantMutation({ id: tenant._id as any, settings: updatedSettings });
      await refreshTenant();
      toast.success('Meta Conversions API (CAPI) settings saved successfully!');
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Meta CAPI settings.');
    } finally {
      setSavingMetaCapi(false);
    }
  };

  const handleTestMetaCapi = async () => {
    if (!metaCapiSettings.pixelId || !metaCapiSettings.accessToken) {
      toast.error('Please enter both Pixel ID and Access Token to test.');
      return;
    }
    setIsTestingCapi(true);
    setCapiTestResult(null);
    try {
      const res = await capiService.test({
        pixelId: metaCapiSettings.pixelId.trim(),
        accessToken: metaCapiSettings.accessToken.trim(),
        testEventCode: metaCapiSettings.testEventCode.trim() || undefined,
        eventName: 'Test_Lead'
      });
      if (res.success) {
        setCapiTestResult({
          success: true,
          message: res.message || 'Meta CAPI event received successfully by Meta Graph API!',
          data: res.metaResponse
        });
        toast.success('Test event accepted by Meta Graph API! Check your Meta Events Manager Test Events tab.');
      } else {
        setCapiTestResult({
          success: false,
          message: res.error || 'Meta rejected test event.'
        });
        toast.error(res.error || 'Test event failed.');
      }
    } catch (err: any) {
      setCapiTestResult({
        success: false,
        message: err.message || 'Network error while contacting Meta CAPI endpoint.'
      });
      toast.error(err.message || 'Failed to trigger test event.');
    } finally {
      setIsTestingCapi(false);
    }
  };

  const handleSaveGoogleConversionSettings = async () => {
    if (!tenant?._id) return;
    setSavingGoogleConversion(true);
    try {
      const updatedSettings = {
        ...tenant.settings,
        integrations: {
          ...tenant.settings?.integrations,
          google_conversion: {
            enabled: googleConversionSettings.enabled,
            conversionActionId: googleConversionSettings.conversionActionId.trim(),
            customerId: googleConversionSettings.customerId.trim(),
            sendQualified: googleConversionSettings.sendQualified,
            sendSale: googleConversionSettings.sendSale
          }
        }
      };
      await updateTenantMutation({ id: tenant._id as any, settings: updatedSettings });
      await refreshTenant();
      toast.success('Google Ads offline conversion settings saved!');
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Google conversion settings.');
    } finally {
      setSavingGoogleConversion(false);
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

  // Public webhook base for lead-capture integrations, served by the AWS API.
  const apiBase = getApiBaseUrl().replace(/\/+$/, '');
  const publicApiBase = apiBase.startsWith('http') ? apiBase : `${window.location.origin}${apiBase}`;
  const webhookToken = webhookSecret || '<webhook_token>';
  const buildWebhookUrl = (portal: string) =>
    `${publicApiBase}/v1/inbound-leads?portal=${portal}&token=${webhookToken}`;

  const googleWebhookUrl = buildWebhookUrl('google_ads');
  const housingWebhookUrl = buildWebhookUrl('housing');
  const nineNineWebhookUrl = buildWebhookUrl('99acres');
  const magicbricksWebhookUrl = buildWebhookUrl('magicbricks');
  const whatsappWebhookUrl = buildWebhookUrl('whatsapp');
  const googleFormWebhookUrl = buildWebhookUrl('google_form');
  const googleSheetWebhookUrl = buildWebhookUrl('google_sheet');
  const websiteWebhookUrl = buildWebhookUrl('website');

  const isMetaConnected = !!metaSettings.pageId;
  const isMetaActive = metaSettings.enabled && isMetaConnected;
  const isGoogleActive = googleSettings.enabled && !!googleSettings.googleKey;
  const isNineNineActive = nineNineSettings.enabled && (!!nineNineSettings.username || !!nineNineSettings.clientId);
  const isMagicbricksActive = magicbricksSettings.enabled && (!!magicbricksSettings.username || !!magicbricksSettings.agentId || !!magicbricksSettings.apiKey);
  const isHousingActive = housingSettings.enabled && (!!housingSettings.mobileNumber || !!housingSettings.profileId);
  const isWhatsappActive = whatsappSettings.enabled;
  const isGoogleFormActive = googleFormSettings.enabled;
  const isGoogleSheetActive = googleSheetSettings.enabled;
  const isWebsiteActive = websiteSettings.enabled;
  const isMetaCapiConfigured = !!(metaCapiSettings.pixelId && metaCapiSettings.accessToken);
  const isMetaCapiActive = metaCapiSettings.enabled && isMetaCapiConfigured;
  const isGoogleConversionActive = googleConversionSettings.enabled && !!googleConversionSettings.conversionActionId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Plug className="text-slate-400" /> Platform Integrations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Connect external advertising platforms to import leads directly into your CRM.</p>
      </div>

      {!webhookSecret && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Preparing your webhook token… wait a moment before copying any webhook URL below.
            If this message stays, refresh the page.
          </span>
        </div>
      )}

      {/* Grid of integrations cards */}
      <div className="space-y-8 pt-4">
        {/* Social Media Category */}
        <div>
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Social Media</h2>
          <div className="flex flex-wrap gap-6 mt-4">
            <div 
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('meta')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMetaActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMetaActive ? 'bg-emerald-500' : isMetaConnected ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

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
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('whatsapp')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWhatsappActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isWhatsappActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

              <div className="w-16 h-16 bg-[#E8F8F0] rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/whatsApp.webp" 
                  alt="WhatsApp Integration" 
                  className="w-11 h-11 object-contain"
                />
              </div>
              
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 leading-tight">
                WhatsApp API & Auto Messaging
              </span>
              {whatsappSettings.autoWelcomeEnabled && (
                <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded-full mt-1">
                  Auto Welcome ON
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Google Apps Category */}
        <div>
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Google Apps</h2>
          <div className="flex flex-wrap gap-6 mt-4">
            <div 
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('google')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

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
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('googleForm')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleFormActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleFormActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

              <div className="w-16 h-16 bg-[#F3F7FF] rounded-2xl flex items-center justify-center overflow-hidden">
                <img src="/images/google_form.webp" alt="Google Forms" className="w-12 h-12 object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 leading-tight">
                Google Forms
              </span>
            </div>

            {/* Google Sheet Integration Card */}
            <div
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('googleSheet')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleSheetActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleSheetActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

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
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('nineNineAcres')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNineNineActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isNineNineActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

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
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('magicbricks')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMagicbricksActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMagicbricksActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

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
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('housing')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-40 h-44 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHousingActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isHousingActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

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

        {/* Website & Custom Forms Webhooks */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                Website & Custom Webhooks
              </h2>
              <span className="text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                Universal Inbound
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Capture inquiries from WordPress, Elementor forms, custom landing pages, Webflow, or HTML forms directly into your CRM.
          </p>

          <div className="flex flex-wrap gap-6 mt-4">
            {/* Website Webhook Card */}
            <div 
              onClick={isFreePlan ? () => toast.info("Auto lead capture integrations are a Pro feature. Please upgrade your plan.") : () => setActiveModal('website')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-44 h-48 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWebsiteActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isWebsiteActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

              <div className="w-16 h-16 bg-gradient-to-tr from-sky-50 to-blue-100 dark:from-sky-950/40 dark:to-blue-900/30 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100 dark:border-blue-900/40">
                <Globe className="w-9 h-9 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 leading-tight">
                Website Form Webhook
              </span>
              <span className={`text-[10px] font-semibold mt-1 ${isWebsiteActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {isWebsiteActive ? 'Active & Ready' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Ad Optimization & Conversion Tracking (CAPI) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Conversion Tracking & Optimization (CAPI)
              </h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> High ROI
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Send offline lead milestones (Qualified Leads, Site Visits, Won Deals with Revenue) back to Meta & Google Ads so AI algorithms find more buyers and reduce ad spend.
          </p>

          <div className="flex flex-wrap gap-6 mt-4">
            {/* Meta CAPI Card */}
            <div 
              onClick={isFreePlan ? () => toast.info("Conversion API tracking is a Pro feature. Please upgrade your plan.") : () => setActiveModal('metaCapi')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-44 h-48 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMetaCapiActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMetaCapiActive ? 'bg-emerald-500' : isMetaCapiConfigured ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

              <div className="w-16 h-16 bg-[#ECF2FF] rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100 dark:border-blue-900/30">
                <Facebook className="w-10 h-10 text-[#1877F2]" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 leading-tight">
                Meta Conversions API (CAPI)
              </span>
              <span className={`text-[10px] font-semibold mt-1 ${isMetaCapiActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {isMetaCapiActive ? 'Active & Firing' : 'Server Events'}
              </span>
            </div>

            {/* Google Enhanced Conversions Card */}
            <div 
              onClick={isFreePlan ? () => toast.info("Conversion tracking is a Pro feature. Please upgrade your plan.") : () => setActiveModal('googleConversion')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 w-44 h-48 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden"
            >
              {/* Status Dot */}
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGoogleConversionActive ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isGoogleConversionActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
              </span>

              {/* Lock Badge */}
              {isFreePlan && (
                <div className="absolute top-3 left-3 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/10" title="Pro Feature">
                  <Lock size={12} />
                </div>
              )}

              <div className="w-16 h-16 bg-[#F8FAFC] dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/google_ads.webp" 
                  alt="Google Enhanced Conversions" 
                  className="w-11 h-11 object-contain"
                />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 leading-tight">
                Google Enhanced Conversions
              </span>
              <span className={`text-[10px] font-semibold mt-1 ${isGoogleConversionActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {isGoogleConversionActive ? 'Active & Firing' : 'GCLID Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Modal Overlay */}
      {activeModal === 'meta' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Facebook className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">Meta Lead Ads Configuration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMetaHelp(!showMetaHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showMetaHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0"
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
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <svg className="w-6 h-6 text-red-500 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.111 4.113-3.41 0-6.19-2.779-6.19-6.19s2.78-6.19 6.19-6.19c1.483 0 2.825.524 3.878 1.547l3.123-3.124C19.046 2.372 15.824 1 12.24 1 5.756 1 .5 6.256.5 12.74s5.256 11.74 11.74 11.74c7.17 0 11.24-5.02 11.24-11.44 0-.771-.06-1.5-.2-2.19H12.24z"/>
                </svg>
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">Google Ads Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGoogleHelp(!showGoogleHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showGoogleHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    setShowGoogleHelp(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0"
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
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/99acres.webp" alt="99acres" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">99acres Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNineNineHelp(!showNineNineHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showNineNineHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0">
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
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/magicbricks.webp" alt="Magicbricks" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Magicbricks Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMagicbricksHelp(!showMagicbricksHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showMagicbricksHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0">
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
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 bg-white border border-slate-100 dark:border-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/hosing.webp" alt="Housing.com" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Housing.com Webhook Configuration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowHousingHelp(!showHousingHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showHousingHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 bg-[#E8F8F0] dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/images/whatsApp.webp" alt="WhatsApp" className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      WhatsApp Business API & Auto Messaging
                    </h2>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      Cloud API & Automated Welcome
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Connect WhatsApp API to automatically welcome new leads from Ads, Website & Portals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWhatsappHelp(!showWhatsappHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showWhatsappHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-1 px-6 pt-3 pb-1 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 flex-shrink-0">
              <button
                type="button"
                onClick={() => setWhatsappActiveTab('api_setup')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  whatsappActiveTab === 'api_setup'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1. API Connection
              </button>
              <button
                type="button"
                onClick={() => setWhatsappActiveTab('auto_welcome')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  whatsappActiveTab === 'auto_welcome'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>2. Auto Messaging (मैसेज ड्राफ्टर)</span>
                {whatsappSettings.autoWelcomeEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setWhatsappActiveTab('test')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  whatsappActiveTab === 'test'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                3. Test Dispatch
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {showWhatsappHelp ? (
                <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp Business API Setup Guide</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">🚀 How to Connect Meta WhatsApp Cloud API (Free & Official):</h4>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <li>Visit <strong>developers.facebook.com</strong> and open or create your Business App.</li>
                        <li>Under products, add <strong>WhatsApp</strong> and open <strong>API Setup</strong>.</li>
                        <li>Copy the <strong>Phone number ID</strong> and <strong>WhatsApp Business Account ID</strong> into the fields below.</li>
                        <li>Generate a <strong>System User Permanent Access Token</strong> in Meta Business Settings with <code>whatsapp_business_messaging</code> permission.</li>
                        <li>Paste your token below and click <strong>"Send Test Verification WhatsApp"</strong> to confirm!</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[10px]">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Inbound Webhook URL (For Inbound Chat Inquiries):</span>
                        <code className="block p-1 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-850 break-all select-all text-blue-500 mt-1">{whatsappWebhookUrl}</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex justify-end">
                    <Button variant="neutral" onClick={() => setShowWhatsappHelp(false)}>
                      Back to Configuration
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* TAB 1: API Connection Setup */}
                  {whatsappActiveTab === 'api_setup' && (
                    <div className="space-y-4">
                      {/* Enable Switch */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable WhatsApp Integration</h4>
                          <p className="text-xs text-gray-500">Master switch for WhatsApp lead capture and automated messaging.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={whatsappSettings.enabled}
                            onChange={(e) => setWhatsappSettings({ ...whatsappSettings, enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {/* Provider Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Select WhatsApp Provider
                        </label>
                        <Select
                          value={whatsappSettings.provider}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, provider: e.target.value as any })}
                          options={[
                            { label: 'Meta WhatsApp Cloud API (Official Direct - Recommended)', value: 'meta_cloud' },
                            { label: 'WATI.io (WhatsApp Team Inbox)', value: 'wati' },
                            { label: 'AiSensy', value: 'aisensy' },
                            { label: 'Interakt / DoubleTick', value: 'interakt' },
                            { label: 'Inbound Webhook Only (Custom)', value: 'custom' }
                          ]}
                        />
                      </div>

                      {/* Meta Cloud API Fields */}
                      {whatsappSettings.provider === 'meta_cloud' && (
                        <div className="space-y-3 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <Sparkles size={14} /> Meta WhatsApp Cloud API Credentials
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Phone Number ID *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 102948291029381"
                                value={whatsappSettings.phoneNumberId}
                                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phoneNumberId: e.target.value.trim() })}
                                className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                WhatsApp Business Account ID (WABA ID)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 293840192847192"
                                value={whatsappSettings.wabaId}
                                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, wabaId: e.target.value.trim() })}
                                className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                System User Permanent Access Token *
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowWhatsAppToken(!showWhatsAppToken)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                {showWhatsAppToken ? <EyeOff size={12} /> : <Eye size={12} />}
                                {showWhatsAppToken ? 'Hide Token' : 'Show Token'}
                              </button>
                            </div>
                            <input
                              type={showWhatsAppToken ? 'text' : 'password'}
                              placeholder="EAAG..."
                              value={whatsappSettings.accessToken}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, accessToken: e.target.value.trim() })}
                              className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              Generate a permanent system user token in Meta Business Settings with <code>whatsapp_business_messaging</code>.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* WATI / AiSensy Fields */}
                      {(whatsappSettings.provider === 'wati' || whatsappSettings.provider === 'aisensy') && (
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              API Endpoint URL *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. https://live-mt-server.wati.io/XXXXX"
                              value={whatsappSettings.bspEndpoint}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, bspEndpoint: e.target.value.trim() })}
                              className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              API Access Key / Secret *
                            </label>
                            <input
                              type="password"
                              placeholder="Enter your BSP API Key"
                              value={whatsappSettings.bspApiKey}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, bspApiKey: e.target.value.trim() })}
                              className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Lead Assignment Rule */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Inbound Lead Assignment Rule
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

                      {/* Inbound Webhook Box */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          Inbound Lead Push Webhook:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 break-all select-all text-emerald-600 text-[11px]">
                            {whatsappWebhookUrl}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(whatsappWebhookUrl);
                              toast.success('Inbound WhatsApp Webhook URL copied!');
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Auto-Welcome Messaging & Drafter */}
                  {whatsappActiveTab === 'auto_welcome' && (
                    <div className="space-y-4">
                      {/* Auto-Welcome Master Toggle */}
                      <div className="flex items-center justify-between p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles size={16} className="text-emerald-600" />
                            Enable Auto-Welcome WhatsApp on New Lead
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Automatically sends personalized WhatsApp greeting as soon as a lead enters CRM (from Meta Ads, Google Ads, Website Forms, or Portals).
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={whatsappSettings.autoWelcomeEnabled}
                            onChange={(e) => setWhatsappSettings({ ...whatsappSettings, autoWelcomeEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {/* Template Chooser */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Meta Approved Template Structure
                        </label>
                        <Select
                          value={whatsappSettings.welcomeTemplateName}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, welcomeTemplateName: e.target.value })}
                          options={[
                            { label: 'RealSalePro Standard Real Estate Greeting (Default Meta Approved)', value: 'realsalepro_lead_welcome' },
                            { label: 'Brochure & Project Catalog Share Template', value: 'realsalepro_brochure_share' },
                            { label: 'Custom Meta Template (Your Own Approved Template)', value: 'custom_template' },
                          ]}
                        />
                      </div>

                      {whatsappSettings.welcomeTemplateName === 'custom_template' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Your Custom Template Name (from Meta WhatsApp Manager)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. custom_lead_ack"
                            value={whatsappSettings.welcomeTemplateName === 'custom_template' ? '' : whatsappSettings.welcomeTemplateName}
                            onChange={(e) => setWhatsappSettings({ ...whatsappSettings, welcomeTemplateName: e.target.value.trim() })}
                            className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono"
                          />
                        </div>
                      )}

                      {/* Message Variable Drafter */}
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          ✍️ Customize Message Variables & Content:
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Salutation / Greeting
                            </label>
                            <input
                              type="text"
                              value={whatsappSettings.customGreeting}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, customGreeting: e.target.value })}
                              placeholder="e.g. Namaste / Hello"
                              className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Company Display Name
                            </label>
                            <input
                              type="text"
                              value={whatsappSettings.companyDisplayName || tenant?.name || ''}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, companyDisplayName: e.target.value })}
                              placeholder="e.g. Anuj Corp"
                              className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Property Consultant / Representative Title
                            </label>
                            <input
                              type="text"
                              value={whatsappSettings.representativeName}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, representativeName: e.target.value })}
                              placeholder="e.g. Our Senior Property Consultant"
                              className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Brochure / Website Link (Sent to Customer)
                            </label>
                            <input
                              type="text"
                              value={whatsappSettings.brochureUrl}
                              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, brochureUrl: e.target.value })}
                              placeholder="e.g. https://yourcompany.com/brochure.pdf"
                              className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live WhatsApp Mobile Chat Preview */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Smartphone size={14} className="text-emerald-600" />
                          Live WhatsApp Chat Preview (Customer Mobile View)
                        </label>

                        <div className="bg-[#EFEAE2] dark:bg-slate-950 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 max-w-md mx-auto shadow-inner">
                          {/* Chat Bubble */}
                          <div className="bg-white dark:bg-[#1F2C34] text-slate-800 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-xs shadow-md text-xs space-y-2 leading-relaxed">
                            <div className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px] border-b pb-1 border-slate-100 dark:border-white/5">
                              {whatsappSettings.companyDisplayName || tenant?.name || 'Company Name'}
                            </div>

                            <p>
                              {whatsappSettings.customGreeting || 'Namaste'} <strong>Saurav Verma</strong>!
                            </p>
                            <p>
                              Thank you for inquiring regarding <strong>Sunrise Sky Villas</strong> with <strong>{whatsappSettings.companyDisplayName || tenant?.name || 'our team'}</strong>.
                            </p>
                            <p>
                              Our property specialist (<em>{whatsappSettings.representativeName || 'Our Property Consultant'}</em>) will connect with you shortly to share floor plans, pricing & schedule your site visit.
                            </p>

                            {whatsappSettings.brochureUrl && (
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-[11px]">
                                <span className="font-semibold block text-emerald-800 dark:text-emerald-300">📄 Download Project Brochure:</span>
                                <span className="text-blue-600 dark:text-blue-400 break-all underline text-[10px]">
                                  {whatsappSettings.brochureUrl}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                              <span>10:45 AM</span>
                              <span className="text-blue-500 font-bold">✓✓</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Test Dispatch Tool */}
                  {whatsappActiveTab === 'test' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs space-y-2">
                        <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                          <Send size={16} className="text-emerald-600" /> Send Test WhatsApp Message
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Test your WhatsApp API connection right now. Enter your personal mobile number (with country code e.g. <code>919876543210</code>) to verify that messages are delivering smoothly before activating live auto-welcome.
                        </p>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Your Test Mobile Number (with Country Code) *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 919876543210 or 9876543210"
                            value={testWhatsAppPhone}
                            onChange={(e) => setTestWhatsAppPhone(e.target.value.trim())}
                            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleTestWhatsApp}
                            disabled={isTestingWhatsApp || !testWhatsAppPhone}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Send size={13} className={isTestingWhatsApp ? "animate-spin" : ""} />
                            {isTestingWhatsApp ? "Sending Verification Message..." : "Send Test WhatsApp Message"}
                          </button>
                        </div>

                        {/* Test Result Feedback */}
                        {whatsAppTestResult && (
                          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            whatsAppTestResult.success
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          }`}>
                            {whatsAppTestResult.success ? (
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-bold">
                                {whatsAppTestResult.success ? "Verification Successful!" : "Delivery Failed"}
                              </div>
                              <p className="text-[11px] mt-0.5">{whatsAppTestResult.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2 flex-shrink-0">
              <Button variant="neutral" onClick={() => setActiveModal(null)}>Cancel</Button>
              {!showWhatsappHelp && (
                <Button onClick={handleSaveWhatsappSettings} isLoading={savingWhatsapp} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save size={16} /> Save WhatsApp Configuration
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
            <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <img src="/images/google_form.webp" alt="Google Forms" className="w-7 h-7 object-contain shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Google Forms Webhook Integration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGoogleFormHelp(!showGoogleFormHelp)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5"
                >
                  <span className="shrink-0">📋</span>
                  <span className="whitespace-nowrap">{showGoogleFormHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg shrink-0">
                  <X size={20} />
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
            <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <img src="/images/Googlesheet.webp" alt="Google Sheets" className="w-7 h-7 object-contain shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Google Sheets Webhook Integration</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGoogleSheetHelp(!showGoogleSheetHelp)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5"
                >
                  <span className="shrink-0">📋</span>
                  <span className="whitespace-nowrap">{showGoogleSheetHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg shrink-0">
                  <X size={20} />
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

      {/* Website & Landing Page Webhook Modal */}
      {activeModal === 'website' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                  <Globe className="text-blue-600 dark:text-blue-400" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Website & Landing Page Webhook
                    </h2>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      Direct Inbound
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">Capture leads from WordPress, Elementor, Webflow, or custom forms</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWebsiteHelp(!showWebsiteHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showWebsiteHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {showWebsiteHelp ? (
                <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 whitespace-nowrap">
                      <Code size={16} className="text-blue-600 shrink-0" /> Choose Integration Method:
                    </span>
                    <div className="flex gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg flex-wrap sm:flex-nowrap shrink-0">
                      <button
                        type="button"
                        onClick={() => setWebsiteActiveTab('elementor')}
                        className={`px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${websiteActiveTab === 'elementor' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        Elementor / WP
                      </button>
                      <button
                        type="button"
                        onClick={() => setWebsiteActiveTab('html')}
                        className={`px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${websiteActiveTab === 'html' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        HTML / JS
                      </button>
                      <button
                        type="button"
                        onClick={() => setWebsiteActiveTab('php')}
                        className={`px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${websiteActiveTab === 'php' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        PHP
                      </button>
                      <button
                        type="button"
                        onClick={() => setWebsiteActiveTab('zapier')}
                        className={`px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${websiteActiveTab === 'zapier' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        Zapier / Make
                      </button>
                    </div>
                  </div>

                  {websiteActiveTab === 'elementor' && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">🚀 How to Connect Elementor Form in 3 Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1.5 leading-normal">
                        <li>Open your WordPress page in the <strong>Elementor Editor</strong>.</li>
                        <li>Click on your <strong>Form widget</strong> to edit its settings in the left panel.</li>
                        <li>In the <strong>Content</strong> tab, expand <strong>"Actions After Submit"</strong> and add <strong>"Webhook"</strong>.</li>
                        <li>An extra <strong>"Webhook"</strong> section will appear below. Paste your Webhook URL into the <strong>Webhook URL</strong> field.</li>
                        <li>Under your Form Fields, ensure your input names / IDs match: <code>name</code>, <code>phone</code> (or <code>mobile</code>), <code>email</code>, <code>city</code>.</li>
                        <li>Click <strong>Update / Publish</strong>. Your website form is now directly piped into RealSalePro!</li>
                      </ol>
                    </div>
                  )}

                  {websiteActiveTab === 'html' && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">💻 JavaScript (Fetch / AJAX) Snippet:</h4>
                      <p>Add this inside your custom landing page form submission handler:</p>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">{`fetch("${websiteWebhookUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    city: document.getElementById("city").value,
    budget: document.getElementById("budget").value,
    message: document.getElementById("message").value
  })
})
.then(res => res.json())
.then(data => console.log("Lead sent to RealSalePro:", data));`}</pre>
                      <button
                        type="button"
                        onClick={() => {
                          const code = `fetch("${websiteWebhookUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    city: document.getElementById("city").value,
    budget: document.getElementById("budget").value,
    message: document.getElementById("message").value
  })
})
.then(res => res.json())
.then(data => console.log("Lead sent to RealSalePro:", data));`;
                          navigator.clipboard.writeText(code);
                          toast.success('JavaScript code copied!');
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                      >
                        <Copy size={13} /> Copy JavaScript Code
                      </button>
                    </div>
                  )}

                  {websiteActiveTab === 'php' && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">🐘 PHP / Contact Form 7 Snippet:</h4>
                      <p>Use in WordPress <code>functions.php</code> or standalone PHP handler:</p>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">{`$lead_data = [
    'name'    => $_POST['name'] ?? '',
    'phone'   => $_POST['phone'] ?? '',
    'email'   => $_POST['email'] ?? '',
    'city'    => $_POST['city'] ?? '',
    'message' => $_POST['message'] ?? ''
];

wp_remote_post('${websiteWebhookUrl}', [
    'headers' => ['Content-Type' => 'application/json'],
    'body'    => json_encode($lead_data),
    'timeout' => 10
]);`}</pre>
                    </div>
                  )}

                  {websiteActiveTab === 'zapier' && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">⚡ Zapier / Make.com / Pabbly:</h4>
                      <ol className="list-decimal list-inside space-y-1.5 leading-normal">
                        <li>Trigger: Choose your form app (e.g. Typeform, Wix, Webflow, Jotform).</li>
                        <li>Action: Select <strong>"Webhooks by Zapier"</strong> &gt; Action Event: <strong>POST</strong>.</li>
                        <li>In <strong>URL</strong>, paste: <code>{websiteWebhookUrl}</code></li>
                        <li>Payload Type: <strong>JSON</strong>.</li>
                        <li>Map Data fields: <code>name</code>, <code>phone</code>, <code>email</code>, <code>city</code>, <code>message</code>.</li>
                        <li>Test &amp; Turn on Zap!</li>
                      </ol>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowWebsiteHelp(false)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Back to Configuration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Webhook Endpoint Display */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Your Inbound Webhook Endpoint URL
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(websiteWebhookUrl);
                          toast.success('Website Webhook URL copied to clipboard!');
                        }}
                        className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Copy size={12} className="shrink-0" /> Copy URL
                      </button>
                    </div>
                    <code className="block p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                      {websiteWebhookUrl}
                    </code>
                    <p className="text-[11px] text-slate-500">
                      Send HTTP <code>POST</code> requests with JSON or Form Data to this URL whenever a client submits a form on your website.
                    </p>
                  </div>

                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Website Webhook</h4>
                      <p className="text-xs text-gray-500">Allow incoming leads from website and landing page forms.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={websiteSettings.enabled}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, enabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Assignment Rule */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Lead Assignment Rule</h4>
                    <p className="text-xs text-gray-500">How should incoming website leads be assigned?</p>
                    <select
                      value={websiteSettings.assignmentRule}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, assignmentRule: e.target.value as 'manual' | 'round_robin' })}
                      className="w-full p-2.5 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Manual Assignment (Admin assigns)</option>
                      <option value="round_robin">Round Robin (Auto-distribute equally to sales executives)</option>
                    </select>
                  </div>

                  {/* Live Test Tool */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Activity size={15} className="text-blue-500 shrink-0" /> Test Your Webhook Live
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Send a sample test lead right now to verify that CRM captures it correctly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendTestWebsiteLead}
                        disabled={isTestingWebsiteLead || !webhookSecret}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
                      >
                        {isTestingWebsiteLead ? (
                          <>
                            <RefreshCw size={13} className="animate-spin shrink-0" /> Sending...
                          </>
                        ) : (
                          <>
                            <Activity size={13} className="shrink-0" /> Send Test Lead
                          </>
                        )}
                      </button>
                    </div>

                    {websiteTestResult && (
                      <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${websiteTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'}`}>
                        {websiteTestResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />}
                        <span className="font-semibold">{websiteTestResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Supported Field Names Cheat Sheet */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      💡 Supported Form Field Names (Auto-Mapped):
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <div>• <strong>Name:</strong> <code>name</code>, <code>full_name</code>, <code>customer_name</code></div>
                      <div>• <strong>Phone:</strong> <code>phone</code>, <code>mobile</code>, <code>contact_number</code></div>
                      <div>• <strong>Email:</strong> <code>email</code>, <code>email_address</code></div>
                      <div>• <strong>City:</strong> <code>city</code>, <code>location</code></div>
                      <div>• <strong>Budget:</strong> <code>budget</code>, <code>budget_range</code></div>
                      <div>• <strong>Message:</strong> <code>message</code>, <code>notes</code>, <code>query</code></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWebsiteSettings}
                disabled={savingWebsite}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingWebsite ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta Conversions API (CAPI) Modal */}
      {activeModal === 'metaCapi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#ECF2FF] flex items-center justify-center border border-blue-100 dark:border-blue-900/30 shrink-0">
                  <Facebook className="text-[#1877F2]" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Meta Conversions API (CAPI)
                    </h2>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      Server-Side
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">Send qualified milestones and purchases directly to Meta Events Manager</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMetaCapiHelp(!showMetaCapiHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showMetaCapiHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {showMetaCapiHelp ? (
                <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                    <Sparkles size={16} /> Meta CAPI Step-by-Step Setup Guide
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Why CAPI is Critical for Real Estate & High-Ticket Ads:</h4>
                      <p className="mt-1">
                        Browser ad-blockers and iOS 14.5+ block traditional web pixel tracking. With Meta CAPI, your CRM server directly transmits events (like when a lead is <em>Qualified</em>, a <em>Site Visit</em> is conducted, or a <em>Unit is Sold</em>) to Meta's AI with hashed customer details (phone, email, city). This trains Meta to show your ads to people who actually buy, not just casual clickers.
                      </p>
                    </div>

                    <div className="border-t border-blue-100 dark:border-blue-900/40 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Step 1: Get your Pixel ID / Dataset ID</h4>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>Go to <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Meta Events Manager</a>.</li>
                        <li>Click on your <strong>Data Sources</strong> (Pixel or Dataset) on the left sidebar.</li>
                        <li>Under the Dataset name, copy the numeric <strong>Dataset ID / Pixel ID</strong> (e.g. <code>123456789012345</code>) and paste it into the Pixel ID field.</li>
                      </ol>
                    </div>

                    <div className="border-t border-blue-100 dark:border-blue-900/40 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Step 2: Generate Conversions API Access Token</h4>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>In Events Manager, click the <strong>Settings</strong> tab of your Pixel/Dataset.</li>
                        <li>Scroll down to the <strong>Conversions API</strong> section.</li>
                        <li>Find <em>"Set up direct integration"</em> and click <strong>"Generate access token"</strong>.</li>
                        <li>Copy the generated token string (starts with <code>EAAB...</code>) and paste it into the Access Token field.</li>
                      </ol>
                    </div>

                    <div className="border-t border-blue-100 dark:border-blue-900/40 pt-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Step 3: Test Real-Time Event Delivery</h4>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>Click the <strong>Test Events</strong> tab in your Meta Events Manager.</li>
                        <li>Under <em>"Confirm your server events are set up correctly"</em>, copy the <strong>Test Code</strong> (e.g. <code>TEST12345</code>).</li>
                        <li>Paste it into the <strong>Test Event Code</strong> input below and click <strong>"Send Test Event to Meta"</strong>.</li>
                        <li>Switch back to your Meta Events Manager screen - you will see the test event arrive instantly!</li>
                      </ol>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMetaCapiHelp(false)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Back to Configuration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Meta Conversions API</h4>
                      <p className="text-xs text-gray-500">Automatically stream conversion stages to your Meta Pixel.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={metaCapiSettings.enabled}
                      onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, enabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Pixel ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Meta Pixel / Dataset ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={metaCapiSettings.pixelId}
                      onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, pixelId: e.target.value })}
                      placeholder="e.g. 123456789012345"
                      className="w-full p-2.5 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Access Token */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        CAPI Access Token <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowMetaCapiToken(!showMetaCapiToken)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {showMetaCapiToken ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showMetaCapiToken ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showMetaCapiToken ? "text" : "password"}
                        value={metaCapiSettings.accessToken}
                        onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, accessToken: e.target.value })}
                        placeholder="EAAB... (Paste System User or Direct Integration Token)"
                        className="w-full p-2.5 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Encrypted and kept strictly private to your tenant organization.
                    </p>
                  </div>

                  {/* Test Event Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Test Event Code (Optional)</span>
                      <span className="text-[11px] text-slate-400 font-normal">Found in Events Manager &gt; Test Events</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={metaCapiSettings.testEventCode}
                        onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, testEventCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. TEST12345"
                        className="flex-1 p-2.5 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestMetaCapi}
                        disabled={isTestingCapi || !metaCapiSettings.pixelId || !metaCapiSettings.accessToken}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        {isTestingCapi ? (
                          <>
                            <RefreshCw size={13} className="animate-spin shrink-0" /> Testing...
                          </>
                        ) : (
                          <>
                            <Activity size={13} className="shrink-0" /> Send Test Event to Meta
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Test Result Banner */}
                  {capiTestResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${capiTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'}`}>
                      {capiTestResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />}
                      <div className="space-y-1">
                        <p className="font-semibold">{capiTestResult.message}</p>
                        {capiTestResult.data && (
                          <p className="font-mono text-[11px] opacity-80">
                            Events Received: {capiTestResult.data.events_received || 1} | Trace ID: {capiTestResult.data.fbtrace_id}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Milestone Triggers */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Automatic Conversion Triggers
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Choose which pipeline milestones trigger server events to Meta:
                    </p>

                    <div className="space-y-2.5 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={metaCapiSettings.sendQualified}
                          onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, sendQualified: e.target.checked })}
                          className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Qualified Leads (<code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Qualified_Lead</code>)
                          </span>
                          <p className="text-[11px] text-slate-500">Fires when lead status moves to Qualified.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={metaCapiSettings.sendSiteVisit}
                          onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, sendSiteVisit: e.target.checked })}
                          className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Site Visit Done (<code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Site_Visit_Done</code>)
                          </span>
                          <p className="text-[11px] text-slate-500">Fires when a client visits the property site.</p>
                        </div>
                        {metaCapiSettings.sendSiteVisit && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">Value (₹):</span>
                            <input
                              type="number"
                              value={metaCapiSettings.siteVisitValue}
                              onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, siteVisitValue: Number(e.target.value) })}
                              className="w-20 p-1 text-xs border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-right"
                            />
                          </div>
                        )}
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={metaCapiSettings.sendSale}
                          onChange={(e) => setMetaCapiSettings({ ...metaCapiSettings, sendSale: e.target.checked })}
                          className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Won Sale / Purchase (<code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Purchase</code>)
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Fires with actual booking value (e.g. ₹75,00,000) when converted to a Sale.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Security & Hashing Note */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-500">
                    <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                    <span>
                      Customer phone numbers and emails are normalized and SHA-256 hashed before transmission in compliance with Meta's Privacy & GDPR standards.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetaCapiSettings}
                disabled={savingMetaCapi}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingMetaCapi ? 'Saving...' : 'Save CAPI Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Ads Offline Conversions Modal */}
      {activeModal === 'googleConversion' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0">
                  <img src="/images/google_ads.webp" alt="Google Ads" className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Google Ads Offline Conversions
                  </h2>
                  <p className="text-xs text-slate-500 truncate">Track won sales and qualified leads tied to Google Click IDs (GCLID)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGoogleConversionHelp(!showGoogleConversionHelp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Info size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{showGoogleConversionHelp ? "Hide Help" : "Setup Help Guide"}</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {showGoogleConversionHelp ? (
                <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">🎯 Google Ads Offline Tracking Guide</h3>
                  <p>
                    When buyers click your Google Ads, Google appends a <code>gclid</code> parameter to the landing page. RealSalePro automatically captures and stores this <code>gclid</code> with the inbound lead.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">How to configure:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to <strong>Google Ads &gt; Goals &gt; Conversions &gt; Summary</strong>.</li>
                      <li>Click <strong>+ New Conversion Action</strong> &gt; Select <strong>Import</strong> &gt; <strong>CRMs, files or other data sources</strong>.</li>
                      <li>Select <strong>Track conversions from clicks</strong>.</li>
                      <li>Copy the <strong>Conversion Action Name / ID</strong> and paste it below.</li>
                    </ol>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowGoogleConversionHelp(false)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Back to Configuration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable Google Offline Tracking</h4>
                      <p className="text-xs text-gray-500">Record conversions against stored Google Click IDs (GCLID).</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={googleConversionSettings.enabled}
                      onChange={(e) => setGoogleConversionSettings({ ...googleConversionSettings, enabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Google Ads Customer ID
                    </label>
                    <input
                      type="text"
                      value={googleConversionSettings.customerId}
                      onChange={(e) => setGoogleConversionSettings({ ...googleConversionSettings, customerId: e.target.value })}
                      placeholder="e.g. 123-456-7890"
                      className="w-full p-2.5 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Conversion Action ID / Name
                    </label>
                    <input
                      type="text"
                      value={googleConversionSettings.conversionActionId}
                      onChange={(e) => setGoogleConversionSettings({ ...googleConversionSettings, conversionActionId: e.target.value })}
                      placeholder="e.g. qualified_lead_import"
                      className="w-full p-2.5 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Milestones to Sync
                    </h4>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={googleConversionSettings.sendQualified}
                        onChange={(e) => setGoogleConversionSettings({ ...googleConversionSettings, sendQualified: e.target.checked })}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <span className="text-xs text-slate-800 dark:text-slate-200">
                        Upload when Lead is marked <strong>Qualified</strong>
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={googleConversionSettings.sendSale}
                        onChange={(e) => setGoogleConversionSettings({ ...googleConversionSettings, sendSale: e.target.checked })}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <span className="text-xs text-slate-800 dark:text-slate-200">
                        Upload when Lead is marked <strong>Converted to Sale</strong>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoogleConversionSettings}
                disabled={savingGoogleConversion}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingGoogleConversion ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
