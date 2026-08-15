import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Settings, Target, Save, Building2, Image, UploadCloud, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    if (tenant) {
      setBrandName(tenant.name || '');
      setLogoUrl(tenant.settings?.appearance?.logo_url || null);
      setLogoPreview((tenant.settings?.appearance as any)?.resolved_logo_url || tenant.settings?.appearance?.logo_url || null);
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
          logo_url: logoUrl
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
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      setLogoUrl(storageId);
      setLogoPreview(URL.createObjectURL(file));
      toast.success('Logo uploaded successfully! Click Save to apply changes.');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
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
            <Button onClick={handleSaveBranding} isLoading={savingBranding} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save size={18} /> Save Branding
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
    </div>
  );
}
