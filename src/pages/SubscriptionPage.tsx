import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import {
  Check,
  Zap,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Calendar,
  Shield,
  Download,
  Receipt,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ImageCropper } from '../components/ImageCropper';
import { useToast } from '../contexts/ToastContext';

// Helper to resolve logo URL
function LogoPreview({ storageId }: { storageId: string }) {
  const url = useQuery(api.files.getUrl, storageId.length > 20 ? { storageId: storageId as Id<"_storage"> } : "skip");
  
  if (storageId.startsWith('http')) return <img src={storageId} alt="Logo" className="max-w-[85%] max-h-[85%] object-contain" />;
  if (!url) return <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700" />;
  
  return <img src={url} alt="Logo" className="max-w-[85%] max-h-[85%] object-contain" />;
}

interface TenantSettings {
  company_profile?: {
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    tax_id?: string;
    logo_url?: string;
  };
}

export function SubscriptionPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Convex Queries
  const billingHistory = useQuery(api.tenants.listBillingHistory, 
    tenant?._id ? { tenant_id: tenant._id as Id<"tenants"> } : "skip"
  ) || [];

  const [activeTab, setActiveTab] = useState<'subscription' | 'profile'>('subscription');
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    tax_id: '',
    logo_url: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const initialLoadDone = useRef(false);

  // Convex Mutations
  const updateTenant = useMutation(api.tenants.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Logo Upload State
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile form with tenant data on load
  useEffect(() => {
     if (tenant && !initialLoadDone.current) {
        const settings = tenant.settings as TenantSettings | undefined;
        setProfileForm({
          name: tenant.name || '',
          address: settings?.company_profile?.address || '',
          email: settings?.company_profile?.email || '',
          phone: settings?.company_profile?.phone || '',
          website: settings?.company_profile?.website || '',
          tax_id: settings?.company_profile?.tax_id || '',
          logo_url: settings?.company_profile?.logo_url || ''
        });
        initialLoadDone.current = true;
     }
  }, [tenant]);

  const _daysRemaining = useMemo(() => {
    if (!tenant?.trial_ends_at) return 0;
    const endDate = new Date(tenant.trial_ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [tenant?.trial_ends_at]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result?.toString() || null);
      setShowCropper(true);
    });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!tenant?._id) return;
    setShowCropper(false);
    setIsUploadingLogo(true);
    
    try {
      // 1. Generate Upload URL from Convex
      const postUrl = await generateUploadUrl();

      // 2. Post file to Convex Storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": croppedBlob.type },
        body: croppedBlob,
      });
      const { storageId } = await result.json();
      
      setProfileForm(prev => ({ ...prev, logo_url: storageId }));
      toast.success('Logo cropped and ready to save!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const generateInvoice = (record: any) => {
    const doc = new jsPDF();

    // Brand Colors
    const primaryColor = '#4F46E5'; // Indigo 600

    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.text('TAX INVOICE', 14, 25);

    // --- Seller Details (Platform: SalesPro) ---
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('SalesPro', 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Patna, Bihar', 14, 46);
    doc.text('Email: support@realsalepro.com', 14, 52);
    doc.text('Website: https://realsalepro.com', 14, 58);

    // Invoice Details (Right Side)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const rightColX = 140;
    doc.text(`Invoice Date: ${new Date(record.created_at || record._creationTime).toLocaleDateString()}`, rightColX, 40);
    doc.text(`Invoice #: ${record._id?.slice(0, 8).toUpperCase()}`, rightColX, 46);
    doc.text(`Payment ID: ${record.razorpay_payment_id}`, rightColX, 52);

    // --- Bill To (Buyer: Tenant Company Profile) ---
    const companyProfile = (tenant as any)?.settings?.company_profile;
    const companyName = tenant?.name || 'Valued Customer';
    const billToY = 75;

    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('BILL TO:', 14, billToY);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, billToY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    let currentBillToY = billToY + 11;

    if (companyProfile?.address) {
      doc.text(companyProfile.address, 14, currentBillToY);
      currentBillToY += 5;
    }

    const contactInfo = [];
    if (companyProfile?.email) contactInfo.push(companyProfile.email);
    if (companyProfile?.phone) contactInfo.push(companyProfile.phone);
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), 14, currentBillToY);
      currentBillToY += 5;
    }

    if (companyProfile?.website) {
      doc.text(companyProfile.website, 14, currentBillToY);
      currentBillToY += 5;
    }

    if (companyProfile?.tax_id) {
      doc.text(`GSTIN: ${companyProfile.tax_id}`, 14, currentBillToY);
    } else if ((tenant as any)?.email) {
      doc.text((tenant as any).email, 14, currentBillToY);
    }

    // Calculations
    const totalAmount = record.amount / 100; // Convert paise to rupees
    const baseAmount = totalAmount / 1.18;
    const gstAmount = totalAmount - baseAmount;

    // Table
    autoTable(doc, {
      startY: billToY + 25,
      head: [['Description', 'Base Amount', 'GST (18%)', 'Total']],
      body: [
        [
          record.description || 'Subscription Plan',
          `INR ${baseAmount.toFixed(2)}`,
          `INR ${gstAmount.toFixed(2)}`,
          `INR ${totalAmount.toFixed(2)}`
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 10, cellPadding: 5 },
    });

    // Total Section
    // @ts-expect-error - lastAutoTable exists on jsPDF instance
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', 130, finalY);
    doc.text('IGST (18%):', 130, finalY + 6);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 130, finalY + 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Align values to the right margin (approx 195mm for A4)
    doc.text(`INR ${baseAmount.toFixed(2)}`, 195, finalY, { align: 'right' });
    doc.text(`INR ${gstAmount.toFixed(2)}`, 195, finalY + 6, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text(`INR ${totalAmount.toFixed(2)}`, 195, finalY + 14, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    const pageHeight = doc.internal.pageSize.height;
    doc.text('This is a computer generated invoice and does not require a signature.', 14, pageHeight - 20);

    // Save
    doc.save(`Invoice_${record._id?.slice(0, 8)}.pdf`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?._id) return;
    setIsSavingProfile(true);

    try {
      const currentSettings = (tenant.settings as TenantSettings) || {};
      const newSettings = {
        ...currentSettings,
        company_profile: {
          address: profileForm.address,
          email: profileForm.email,
          phone: profileForm.phone,
          website: profileForm.website,
          tax_id: profileForm.tax_id,
          logo_url: profileForm.logo_url
        }
      };

      await updateTenant({
        id: tenant._id as Id<"tenants">,
        name: profileForm.name,
        settings: newSettings
      });

      toast.success('Company profile updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isPro = tenant.plan_tier === 'pro';
  const isActive = tenant.subscription_status === 'active';

  const planFeatures = isPro ? [
    'All Pro Features Included',
    'Up to 1,00,000 Leads Limit',
    'Lead Deletion Enabled',
    'Unlimited Users',
    'Real-time Analytics',
    'Priority Email Support',
    'Full CRM Module Access',
    'Lead Management',
    'Sales Tracking',
    'Custom Reports'
  ] : [
    'All Pro Features Included',
    'Up to 1,00,000 Leads (1,000 Max for Free Plan)',
    'Lead Deletion Disabled (Pro Feature)',
    'Unlimited Users',
    'Real-time Analytics',
    'Standard Email Support',
    'Full CRM Module Access',
    'Lead Management',
    'Sales Tracking',
    'Custom Reports'
  ];

  // Calculate generic next billing date if not in DB
  const getNextBillingDate = () => {
    if (tenant.next_billing_date) return new Date(tenant.next_billing_date);

    // Fallback based on last update or creation
    // This is just for display if real data is missing
    const baseDate = new Date();
    if (tenant.billing_cycle === 'yearly') {
      return new Date(baseDate.setFullYear(baseDate.getFullYear() + 1));
    } else if (tenant.billing_cycle === 'semi_annual') {
      return new Date(baseDate.setMonth(baseDate.getMonth() + 6));
    } else {
      return new Date(baseDate.setMonth(baseDate.getMonth() + 1));
    }
  };

  const billingAmount = tenant.billing_cycle === 'yearly' ? 12000 : tenant.billing_cycle === 'semi_annual' ? 7200 : 1500;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1A15] py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Settings & Subscription
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Manage your company profile and subscription details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-surface-dark p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'subscription' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                Company Profile
              </button>
            </div>
            {!isActive && (
              <button
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] hover:from-[#00C853] hover:to-[#00B048] px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-4 h-4" />
                Upgrade
              </button>
            )}
          </div>
        </div>

        {activeTab === 'profile' ? (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Company Profile</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Update your business information for invoices and documents</p>
                </div>
              </div>
              
              <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="e.g., Acme Corporation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Website
                    </label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="e.g., https://www.acme.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Business Email
                    </label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="e.g., contact@acme.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="e.g., +1 234 567 890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Business Address
                  </label>
                  <textarea
                    required
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white resize-none"
                    placeholder="e.g., 123 Business Ave, Suite 400, New York, NY"
                  />
                </div>

                {/* Logo Section */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#10B981]" /> Company Logo
                  </label>
                  <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                    <div className="relative group">
                      <div className="w-32 h-32 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm relative">
                        {profileForm.logo_url ? (
                          <LogoPreview storageId={profileForm.logo_url} />
                        ) : (
                          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        )}
                        
                        {/* Safe Zone Overlay */}
                        <div className="absolute inset-0 pointer-events-none border border-[#10B981]/20 border-dashed m-3 rounded" title="Safe Zone: Keep your logo inside this area for best results on bills." />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-[#10B981] text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-surface-dark transition-transform group-hover:scale-110">
                        <ImageIcon size={16} />
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Upload Business Logo</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                          Transparent PNG or high-quality JPG works best. The <span className="text-[#10B981] font-medium">Safe Zone</span> helps ensure your logo looks perfect on computer-generated bills.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
                        >
                          {isUploadingLogo ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                             <Upload size={18} />
                          )}
                          {profileForm.logo_url ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        
                        {profileForm.logo_url && (
                          <button
                            type="button"
                            onClick={() => setProfileForm(prev => ({ ...prev, logo_url: '' }))}
                            className="px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Tax ID / GSTIN
                    </label>
                    <input
                      type="text"
                      value={profileForm.tax_id}
                      onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="e.g., GST-123456789"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Status Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">

          {/* Card 1: Current Plan */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">
                Current Plan
              </h3>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isPro ? 'Pro Plan' : 'Free Forever Plan'}
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                {isPro
                  ? `Billed ${tenant.billing_cycle === 'yearly' ? 'Yearly' : tenant.billing_cycle === 'semi_annual' ? 'Every 6 Months' : 'Monthly'}`
                  : 'Manage up to 1,000 leads'
                }
              </div>
            </div>
          </div>

          {/* Card 2: Billing Status */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">
                Upcoming Invoice
              </h3>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isPro ? formatCurrency(billingAmount) : '₹0'}
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {isPro 
                    ? `Renewing on ${getNextBillingDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` 
                    : 'No upcoming renewals'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Usage / Stats */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">
                Leads Managed
              </h3>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {((tenant as any).leads_count || 0).toLocaleString()} / {isPro ? '1,00,000' : '1,000'}
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                {isPro ? 'Upgrade custom for more limits' : 'Upgrade to Pro for more leads'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Features List */}
          <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 p-6 h-fit">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Included in your plan
            </h3>
            <ul className="space-y-4">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-2">Upgrade to Pro for more leads</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-3">
                  Manage more than 1,00,000 leads and unlock lead deletion. Upgrade now.
                </p>
                <button onClick={() => navigate('/pricing')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  View Plans →
                </button>
              </div>
            )}
          </div>

          {/* Billing History Table */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-400" />
                Payment History
              </h3>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Download All
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {billingHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-medium mb-1">No payment history yet</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                    Once you make a payment, your invoices and receipts will appear here.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {billingHistory.map((record: any) => (
                      <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {new Date(record._creationTime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                          {record.description || 'Pro Subscription'}
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{record.razorpay_payment_id}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {formatCurrency(record.amount / 100)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                            ${record.status === 'captured' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}
                          `}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => generateInvoice(record)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
            </div>
          </>
        )}
      </div>
      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropImageSrc(null);
          }}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          aspect={1} // Square works best for most logos, but we could make it 3:1 if user wants
          cropShape="rect"
        />
      )}
    </div>
  );
}
