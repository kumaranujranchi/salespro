import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from '../lib/reactive';
import { api, Id } from '../lib/api-endpoints';
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
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Users,
  CheckCircle2,
  FileText,
  Lock,
  Database
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ImageCropper } from '../components/ImageCropper';
import { useToast } from '../contexts/ToastContext';
import { UpgradeToProModal } from '../components/ui/UpgradeToProModal';

// Helper to normalize amount from either paise (e.g. 150000) or rupees (e.g. 1500)
function normalizeAmountInRupees(amount: any): number {
  const num = Number(amount || 0);
  if (num > 50000) return num / 100;
  return num;
}

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
  
  // Backend queries
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const initialLoadDone = useRef(false);

  // Backend mutations
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
      // 1. Generate upload URL
      const postUrl = await generateUploadUrl();

      // 2. Post file to storage
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
    const primaryColor = '#0A1C37'; // Deep Navy

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 25);

    // --- Seller Details (Platform: RealSalePro) ---
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('RealSalePro CRM', 14, 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Patna, Bihar, India', 14, 44);
    doc.text('Email: support@realsalepro.com', 14, 49);
    doc.text('Website: https://realsalepro.com', 14, 54);

    // Invoice Details (Right Side)
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const rightColX = 135;
    const invDate = new Date(record.created_at || record._creationTime || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const invId = (record.id || record._id || 'INV').slice(0, 8).toUpperCase();
    doc.text(`Invoice Date: ${invDate}`, rightColX, 38);
    doc.text(`Invoice #: INV-${invId}`, rightColX, 44);
    doc.text(`Payment ID: ${record.razorpay_payment_id || record.payment_id || 'pay_online'}`, rightColX, 49);
    doc.setTextColor(0, 150, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: PAID`, rightColX, 54);

    // --- Bill To (Buyer: Tenant Company Profile) ---
    const companyProfile = (tenant as any)?.settings?.company_profile;
    const companyName = profileForm.name || tenant?.name || 'Valued Customer';
    const billToY = 68;

    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO (CUSTOMER):', 14, billToY);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(companyName, 14, billToY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    let currentBillToY = billToY + 11;

    const address = profileForm.address || companyProfile?.address;
    if (address) {
      doc.text(address, 14, currentBillToY);
      currentBillToY += 5;
    }

    const contactInfo = [];
    const email = profileForm.email || companyProfile?.email || (tenant as any)?.email;
    const phone = profileForm.phone || companyProfile?.phone;
    if (email) contactInfo.push(email);
    if (phone) contactInfo.push(phone);
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), 14, currentBillToY);
      currentBillToY += 5;
    }

    const taxId = profileForm.tax_id || companyProfile?.tax_id;
    if (taxId) {
      doc.text(`GSTIN / Tax ID: ${taxId}`, 14, currentBillToY);
    }

    // Calculations
    const totalAmount = normalizeAmountInRupees(record.amount);
    const baseAmount = totalAmount / 1.18;
    const gstAmount = totalAmount - baseAmount;

    // Table
    autoTable(doc, {
      startY: Math.max(currentBillToY + 8, billToY + 28),
      head: [['Description', 'Qty', 'Base Amount', 'GST (18%)', 'Total Amount']],
      body: [
        [
          record.description || 'RealSalePro Pro Plan Subscription',
          '1',
          `INR ${baseAmount.toFixed(2)}`,
          `INR ${gstAmount.toFixed(2)}`,
          `INR ${totalAmount.toFixed(2)}`
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [10, 28, 55] }, // Dark Navy #0A1C37
      styles: { fontSize: 9, cellPadding: 5 },
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
    doc.text(`INR ${baseAmount.toFixed(2)}`, 195, finalY, { align: 'right' });
    doc.text(`INR ${gstAmount.toFixed(2)}`, 195, finalY + 6, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 180, 70);
    doc.text(`INR ${totalAmount.toFixed(2)}`, 195, finalY + 14, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    const pageHeight = doc.internal.pageSize.height;
    doc.text('This is an official computer-generated GST tax invoice and does not require a physical signature.', 14, pageHeight - 20);

    // Save
    doc.save(`Invoice_INV-${invId}.pdf`);
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

  // Calculate generic next billing date if not in DB
  const getNextBillingDate = () => {
    if (tenant.next_billing_date) return new Date(tenant.next_billing_date);

    // Fallback based on last update or creation
    const baseDate = new Date();
    if (tenant.billing_cycle === 'yearly') {
      return new Date(baseDate.setFullYear(baseDate.getFullYear() + 1));
    } else if (tenant.billing_cycle === 'semi_annual') {
      return new Date(baseDate.setMonth(baseDate.getMonth() + 6));
    } else {
      return new Date(baseDate.setMonth(baseDate.getMonth() + 1));
    }
  };

  const billingCycleLabel = tenant.billing_cycle === 'yearly' ? 'Yearly' : tenant.billing_cycle === 'semi_annual' ? 'Every 6 Months' : 'Monthly';
  const billingAmount = tenant.billing_cycle === 'yearly' ? 12000 : tenant.billing_cycle === 'semi_annual' ? 7200 : 1500;
  const nextBillingDateObj = tenant.next_billing_date ? new Date(tenant.next_billing_date) : null;
  const formattedRenewalDate = nextBillingDateObj 
    ? nextBillingDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : getNextBillingDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const leadsCount = Number((tenant as any)?.leads_count || 0);
  const maxLeads = isPro ? 200000 : 1000;
  const leadsPercent = Math.min(100, Math.round((leadsCount / maxLeads) * 100));
  const remainingLeads = Math.max(0, maxLeads - leadsCount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1A15] py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings &amp; Subscription
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Manage your workspace subscription, billing cycle, usage quotas, and tax invoices.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-surface-dark p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'subscription' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                Subscription &amp; Billing
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                Company Profile
              </button>
            </div>
            {!isPro ? (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] hover:from-[#00C853] hover:to-[#00B048] px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-current text-[#0A1C37]" />
                <span>Upgrade to Pro</span>
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border border-slate-200 dark:border-white/10"
              >
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Change Plan / Cycle</span>
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Hero Plan Banner */}
            {!isPro ? (
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0A1C37] via-[#0E2544] to-[#0A1C37] text-white border border-emerald-500/20 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E576]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/10">
                        <Shield className="w-3.5 h-3.5 text-slate-300" />
                        Free Forever Plan
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ● Active Workspace
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Unlock Full CRM Scale with <span className="bg-gradient-to-r from-[#00E576] to-[#69F0AE] bg-clip-text text-transparent">RealSalePro Pro</span>
                      </h2>
                      <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                        You are currently on the Free Starter plan (capped at 1,000 leads). Upgrade your workspace to unlock 2,00,000 leads storage, unlimited team accounts, DeepSeek AI Copilot, automated Meta webhooks, and priority WhatsApp support.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200">
                        <Zap className="w-4 h-4 text-[#00E576] shrink-0" />
                        <span>2,00,000 Leads</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200">
                        <Users className="w-4 h-4 text-[#00E576] shrink-0" />
                        <span>Unlimited Users</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200">
                        <Sparkles className="w-4 h-4 text-[#00E576] shrink-0" />
                        <span>AI Sales Copilot</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200">
                        <ShieldCheck className="w-4 h-4 text-[#00E576] shrink-0" />
                        <span>Live Meta Sync</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto shrink-0 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 sm:p-6 text-center lg:text-left flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                        Starting from
                      </span>
                      <div className="flex items-baseline justify-center lg:justify-start gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-white">₹1,000</span>
                        <span className="text-sm text-slate-300 font-medium">/ mo</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        ₹12,000 billed yearly (Save 33%) • Or ₹1,500/mo
                      </p>
                    </div>

                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00E576] to-[#00C853] hover:from-[#00C853] hover:to-[#00B048] text-[#0A1C37] font-extrabold text-sm shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
                    >
                      <span>Upgrade to Pro Now</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="flex items-center justify-center lg:justify-start gap-1.5 text-[11px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Instant In-App Activation • Razorpay Secured</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#062417] via-[#0A3622] to-[#062417] text-white border border-emerald-500/30 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E576]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        PRO Workspace Active
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-300">
                        ● Active Subscription
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        RealSalePro <span className="text-[#00E576]">Pro Plan</span>
                      </h2>
                      <p className="text-emerald-100/90 text-sm sm:text-base mt-1 leading-relaxed">
                        Your workspace is active with 2,00,000 leads quota, unlimited users, AI Copilot, and automated portal sync.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 pt-1">
                      <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        Billed {billingCycleLabel} ({formatCurrency(billingAmount)})
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Next Renewal: <strong className="text-white ml-0.5">{formattedRenewalDate}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="py-3 px-6 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Change Plan / Cycle</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Key Status Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tile 1: Plan Tier */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPro ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {isPro ? 'Pro Active' : 'Free Active'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Current Plan
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {isPro ? 'Pro Workspace' : 'Free Forever Plan'}
                  </h3>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{isPro ? `Billed ${billingCycleLabel}` : 'Free Starter Tier'}</span>
                  {!isPro && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Upgrade →
                    </button>
                  )}
                </div>
              </div>

              {/* Tile 2: Next Billing Date & Renewal */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5">
                      {isPro ? 'Auto-Renewal' : 'No Expiry'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Next Billing Date
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {isPro ? formattedRenewalDate : 'No Renewals'}
                  </h3>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Upcoming Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {isPro ? formatCurrency(billingAmount) : '₹0'}
                  </span>
                </div>
              </div>

              {/* Tile 3: Leads Quota */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                      <Database className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${leadsPercent >= 90 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : leadsPercent >= 75 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {leadsPercent}% Used
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Leads Storage Limit
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {leadsCount.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-400">/ {maxLeads.toLocaleString('en-IN')}</span>
                  </h3>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${leadsPercent >= 90 ? 'bg-rose-500' : leadsPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.max(leadsPercent, 3)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{remainingLeads.toLocaleString('en-IN')} leads remaining</span>
                    {!isPro && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline" onClick={() => setShowUpgradeModal(true)}>
                        Expand →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Feature Capabilities Comparison Matrix */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Workspace Capabilities &amp; Limits
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Compare features available in your current plan vs RealSalePro Pro.
                  </p>
                </div>
                {!isPro && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="self-start sm:self-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    Unlock All Pro Features →
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Feature / Module</th>
                      <th className="px-6 py-3.5 text-center">Free Forever Plan</th>
                      <th className="px-6 py-3.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                        Pro Plan (Recommended)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        Leads Storage Capacity
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Total customer leads stored in your workspace</p>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300 font-medium">1,000 Leads</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        2,00,000 Leads (200x)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        Team Member Accounts
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Admins, sales managers, telecallers, and executives</p>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300 font-medium">Up to 5 Users</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        Unlimited Team Users
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        DeepSeek AI Sales Copilot
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">AI lead qualification, follow-up suggestions &amp; intelligence</p>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400 font-medium">
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs"><Lock className="w-3.5 h-3.5" /> Locked</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        Unlimited AI Responses
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        Meta Ads &amp; Portal Integrations
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Facebook, Instagram, 99acres, Housing.com webhooks</p>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300 font-medium">Basic / Manual</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        Automated Live Webhooks
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        Bulk Data Export &amp; Lead Deletion
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Export to Excel/CSV and permanent lead cleanup</p>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400 font-medium">Restricted</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        Full Admin Privileges
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        Customer &amp; Technical Support
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Response time and support channels</p>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300 font-medium">Standard Email</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        Dedicated WhatsApp &amp; Priority
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!isPro && (
                <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Ready to empower your team? Upgrade starts at just <strong>₹1,000 / month</strong>.
                  </span>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00E576] to-[#00C853] hover:from-[#00C853] hover:to-[#00B048] text-[#0A1C37] font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Upgrade Workspace Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Billing History & Official Tax Invoices */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-500" />
                    Billing History &amp; Tax Invoices
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official GST-compliant tax invoices for all subscription payments and renewals.
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                {billingHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-base mb-1">
                      No invoices generated yet
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mb-4 leading-relaxed">
                      When you upgrade to Pro or renew your plan, official GST-compliant tax invoices will appear here for instant PDF download.
                    </p>
                    {!isPro && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Upgrade to Pro Plan
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Invoice # &amp; Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Payment Ref</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Tax Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {billingHistory.map((record: any) => {
                        const invId = (record.id || record._id || 'INV').slice(0, 8).toUpperCase();
                        const invDate = new Date(record.created_at || record._creationTime || Date.now()).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        });
                        const amountInRupees = normalizeAmountInRupees(record.amount);

                        return (
                          <tr key={record._id || record.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">#INV-{invId}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{invDate}</div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                              {record.description || 'RealSalePro Pro Plan'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {record.razorpay_payment_id || record.payment_id || 'pay_online'}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              ₹{amountInRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 capitalize">
                                <CheckCircle2 className="w-3 h-3" />
                                {record.status || 'Paid'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => generateInvoice(record)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                                title="Download PDF Tax Invoice"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
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
          aspect={1}
          cropShape="rect"
        />
      )}

      {/* In-App Direct Upgrade Modal */}
      <UpgradeToProModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="RealSalePro Pro Plan"
        description="Upgrade your workspace directly via UPI or cards to unlock 2,00,000 leads, unlimited users, and AI Copilot."
      />
    </div>
  );
}
