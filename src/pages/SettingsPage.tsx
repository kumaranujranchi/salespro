import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMutation } from "../lib/reactive";
import { api } from '../lib/api-endpoints';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Settings, Target, Save, Building2, Image, UploadCloud, Trash2, ShieldCheck, Phone, Lock, Car, CheckCircle2 } from 'lucide-react';

export function SettingsPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const updateTenantMutation = useMutation(api.tenants.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const [settings, setSettings] = useState({
    targetModel: 'area'
  });

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  // Security / Anti-Theft Phone Masking State
  const [maskLeadPhone, setMaskLeadPhone] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Site Visit Visibility (Global vs Private)
  const [globalSiteVisits, setGlobalSiteVisits] = useState(true);
  const [savingSiteVisits, setSavingSiteVisits] = useState(false);

  useEffect(() => {
    if (tenant) {
      setBrandName(tenant.name || '');
      setLogoUrl(tenant.settings?.appearance?.logo_url || null);
      setLogoPreview((tenant.settings?.appearance as any)?.resolved_logo_url || tenant.settings?.appearance?.logo_url || null);
      if (tenant.settings?.security?.mask_lead_phone !== undefined) {
        setMaskLeadPhone(!!tenant.settings.security.mask_lead_phone);
      }
      if (tenant.settings?.site_visits?.global_visibility !== undefined) {
        setGlobalSiteVisits(Boolean(tenant.settings.site_visits.global_visibility));
      } else {
        setGlobalSiteVisits(true);
      }
    }
    if (tenant?.settings?.general?.target_model) {
      setSettings({
        targetModel: tenant.settings.general.target_model
      });
    }
  }, [tenant]);

  const handleSaveBranding = async () => {
    if (!tenant?._id) return;
    setSavingBranding(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        appearance: {
          ...tenant.settings?.appearance,
          logo_url: logoUrl,
          resolved_logo_url: logoUrl
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        name: brandName,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Branding saved successfully!');
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast.error(error.message || 'Failed to save branding.');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      // SVG handling: Read directly as Data URL
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setLogoUrl(result);
          setLogoPreview(result);
          setUploadingLogo(false);
          toast.success('Logo selected! Click Save Branding to apply.');
        };
        reader.onerror = () => {
          setUploadingLogo(false);
          toast.error('Failed to read SVG file.');
        };
        reader.readAsDataURL(file);
        return;
      }

      // Raster images (PNG, JPG, WebP, etc.): optimize client-side using Canvas to keep payload compact and fast
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const maxDimension = 400; // Optimal size for high-res navbar and reports

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              setLogoUrl(rawDataUrl);
              setLogoPreview(rawDataUrl);
              setUploadingLogo(false);
              toast.success('Logo selected! Click Save Branding to apply.');
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const isPng = file.type === 'image/png';
            const optimizedDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);

            setLogoUrl(optimizedDataUrl);
            setLogoPreview(optimizedDataUrl);
            setUploadingLogo(false);
            toast.success('Logo selected! Click Save Branding to apply.');
          } catch (canvasErr) {
            console.warn('Canvas optimization fallback:', canvasErr);
            setLogoUrl(rawDataUrl);
            setLogoPreview(rawDataUrl);
            setUploadingLogo(false);
            toast.success('Logo selected! Click Save Branding to apply.');
          }
        };
        img.onerror = () => {
          setUploadingLogo(false);
          toast.error('Failed to parse image file.');
        };
        img.src = rawDataUrl;
      };
      reader.onerror = () => {
        setUploadingLogo(false);
        toast.error('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo.');
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
    const fileInput = document.getElementById('brand-logo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast.success('Logo removed. Click Save Branding to apply changes.');
  };

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

  const handleSaveSecurity = async () => {
    if (!tenant?._id) return;
    setSavingSecurity(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        security: {
          ...tenant.settings?.security,
          mask_lead_phone: maskLeadPhone
        }
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings
      });

      await refreshTenant();
      toast.success('Lead Data Privacy & Anti-Theft settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      toast.error(error.message || 'Failed to save security settings.');
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSaveSiteVisits = async () => {
    if (!tenant?._id) return;
    setSavingSiteVisits(true);

    try {
      const updatedSettings = {
        ...tenant.settings,
        site_visits: {
          ...tenant.settings?.site_visits,
          global_visibility: globalSiteVisits,
        },
      };

      await updateTenantMutation({
        id: tenant._id as any,
        settings: updatedSettings,
      });

      await refreshTenant();
      toast.success('Site visit visibility settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving site visit settings:', error);
      toast.error(error.message || 'Failed to save site visit settings.');
    } finally {
      setSavingSiteVisits(false);
    }
  };

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'platform_admin';
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Only Company Admins can access organization settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-slate-400" /> Organization Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure global settings and branding for your organization</p>
      </div>

      {/* Brand & Logo Card */}
      <Card>
        <CardHeader className="border-b border-gray-100 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="text-emerald-500" size={20} /> Brand & Logo Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-4">
              <Input
                label="Organization / Brand Name"
                placeholder="Enter organization name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                This name will be displayed in the sidebar navigation header below the logo.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[#0A1C37] dark:text-gray-200">
                Brand Logo
              </label>
              
              <div className="flex items-center gap-6">
                {/* Logo Preview Container */}
                <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 flex items-center justify-center overflow-hidden p-2 shadow-sm shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Brand Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image className="text-slate-400 w-8 h-8" />
                  )}
                </div>

                {/* Upload Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="brand-logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <label
                      htmlFor="brand-logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-sm transition-all duration-200"
                    >
                      <UploadCloud size={16} />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </label>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center justify-center p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl transition-colors duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Supports PNG, JPG, or SVG. Max size 5MB. Recommended size: 200x50px (Landscape) or 200x200px (Square).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <Button
              onClick={handleSaveBranding}
              isLoading={savingBranding}
              variant="secondary"
              className="gap-2 !bg-emerald-600 hover:!bg-emerald-700 !text-white font-bold shadow-md px-5 py-2.5"
            >
              <Save size={18} className="text-white" /> Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Target Configuration Card */}
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

      {/* Lead Data Privacy & Anti-Theft Card */}
      <Card>
        <CardHeader className="border-b border-gray-100 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="text-emerald-500" size={20} /> Lead Data Privacy & Anti-Theft Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mask Lead Phone Numbers for Team
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  maskLeadPhone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {maskLeadPhone ? 'Active (Protected)' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                When enabled, team members (sales executives, telecallers, managers) will not see or copy full lead phone numbers (displayed as <code className="text-indigo-600 font-mono font-bold">98765 •••••</code>).
                To make calls, team members simply tap the phone icon button, which instantly passes the number to their mobile dialer. Full phone numbers remain accessible only to Company Admins.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaskLeadPhone(!maskLeadPhone)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                maskLeadPhone ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                  maskLeadPhone ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Interactive Live Comparison Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600" /> Company Admin View (You)
                </span>
                <span className="text-[10px] bg-indigo-200/60 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-semibold">Full Access</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800/40 text-xs font-medium">
                <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                  <Phone size={12} />
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">+91 98765 43210</span>
                <span className="ml-auto text-emerald-600 text-[10px] font-bold">Unmasked + Copy</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Lock size={14} className="text-amber-600" /> Team Member View
                </span>
                <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {maskLeadPhone ? 'Masked & Protected' : 'Full Numbers'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800/40 text-xs font-medium">
                <span className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Phone size={12} />
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  {maskLeadPhone ? '98765 •••••' : '+91 98765 43210'}
                </span>
                <span className="ml-auto text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {maskLeadPhone ? 'Tap to Call in Dialer' : 'Unmasked'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <Button onClick={handleSaveSecurity} isLoading={savingSecurity} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save size={18} /> Save Privacy Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Site Visit Visibility & Fleet Coordination Card */}
      <Card>
        <CardHeader className="border-b border-gray-100 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="text-emerald-500" size={20} /> Site Visit Visibility & Fleet Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Global Site Visit Visibility
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  globalSiteVisits ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {globalSiteVisits ? 'Global (Company-Wide)' : 'Private (Requester Only)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                When <strong>Global</strong> is enabled, sales executives can see approved company-wide site visits to verify car and driver availability before scheduling, preventing vehicle booking conflicts.
                When <strong>Private</strong>, sales executives strictly see only their own requested visits in isolation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setGlobalSiteVisits(!globalSiteVisits)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                globalSiteVisits ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                  globalSiteVisits ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Comparison Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border transition-all ${
              globalSiteVisits
                ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Global Schedule (ON)
                </span>
                <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-semibold">Recommended</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sales reps see all approved trips, assigned drivers, and real-time vehicle booking calendars to pick open slots without clashes.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${
              !globalSiteVisits
                ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-slate-200 dark:border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Lock size={14} className="text-amber-600" /> Private / Isolated (OFF)
                </span>
                <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-semibold">Isolated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sales reps can only see visits they personally created. Other agents' visits and vehicle schedules remain hidden.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <Button onClick={handleSaveSiteVisits} isLoading={savingSiteVisits} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save size={18} /> Save Site Visit Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
