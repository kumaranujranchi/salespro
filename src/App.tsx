import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterCompanyPage } from './pages/RegisterCompanyPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlatformDashboard } from './pages/PlatformDashboard';
import { PlatformSupportPage } from './pages/PlatformSupportPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { TargetsPage } from './pages/TargetsPage';
import { SiteVisitsPage } from './pages/SiteVisitsPage';
import { SalesPage } from './pages/SalesPage';
import { IncentivesPage } from './pages/IncentivesPage';
import { ReportsPage } from './pages/ReportsPage';
import { MyPerformancePage } from './pages/MyPerformancePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { SupportPage } from './pages/SupportPage';
import { LeadsPage } from './pages/LeadsPage';
import { CRMDashboardPage } from './pages/CRMDashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { RefundPolicy } from './pages/RefundPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { PricingPage } from './pages/PricingPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ReferralManagementPage } from './pages/admin/ReferralManagementPage';
import { RolesPage } from './pages/RolesPage';
import { AccountsPage } from './pages/AccountsPage';
import { AccountantDashboard } from './components/dashboards/AccountantDashboard';
import { ReferralProgramPage } from './pages/ReferralProgramPage';
import { TenantsPage } from './pages/admin/TenantsPage';
import { AffiliateRegistrationPage } from './pages/affiliates/AffiliateRegistrationPage';
import { AffiliateDashboardPage } from './pages/affiliates/AffiliateDashboardPage';
import { AffiliateTermsPage } from './pages/affiliates/AffiliateTermsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminIntegrationsPage } from './pages/admin/AdminIntegrationsPage';
import { ServerHealthPage } from './pages/admin/ServerHealthPage';
import { WhatsAppCommandCenterPage } from './pages/admin/WhatsAppCommandCenterPage';
import { AdminRoleSwitcherBar } from './components/admin/AdminRoleSwitcherBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FreeCRMPage } from './pages/FreeCRMPage';
import { ExcelTemplatePage } from './pages/ExcelTemplatePage';
import { BrokersCRMPage } from './pages/BrokersCRMPage';
import { IndiaCRMPage } from './pages/IndiaCRMPage';
import { LeadManagementFeaturePage } from './pages/LeadManagementFeaturePage';
import { SitemapPage } from './pages/SitemapPage';
import { NotFoundPage } from './pages/NotFoundPage';


import { ThemeProvider } from './contexts/ThemeContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <DialogProvider>
            <TutorialProvider>
              <ErrorBoundary>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/free-real-estate-crm" element={<FreeCRMPage />} />
                <Route path="/templates/real-estate-crm-excel-template" element={<ExcelTemplatePage />} />
                <Route path="/crm-for-real-estate-brokers" element={<BrokersCRMPage />} />
                <Route path="/real-estate-crm-india" element={<IndiaCRMPage />} />
                <Route path="/features/lead-management" element={<LeadManagementFeaturePage />} />
                <Route path="/sitemap" element={<SitemapPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterCompanyPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/data-deletion" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/referral-program" element={<ReferralProgramPage />} />
                
                {/* Public Affiliate Registration */}
                <Route path="/affiliate/register" element={<AffiliateRegistrationPage />} />
                <Route path="/affiliate/terms" element={<AffiliateTermsPage />} />

                {/* Affiliate Routes - Protected */}
                <Route path="/affiliate/dashboard" element={
                  <ProtectedRoute>
                    <AffiliateDashboardPage />
                  </ProtectedRoute>
                } />

                <Route path="/accountant-dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
            
            {/* Platform Admin Routes */}
            <Route path="/referral-management" element={
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <DashboardLayout>
                  <ReferralManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/platform/referrals" element={<Navigate to="/referral-management" replace />} />

                <Route path="/contact" element={<ContactUsPage />} />
                <Route path="/integration" element={<IntegrationsPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <DashboardPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* SaaS Owner Route */}
                <Route
                  path="/platform/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['platform_admin']}>
                      <DashboardLayout>
                        <PlatformDashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/platform/tenants"
                  element={
                    <ProtectedRoute allowedRoles={['platform_admin']}>
                      <DashboardLayout>
                        <TenantsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/platform/support"
                  element={
                    <ProtectedRoute allowedRoles={['platform_admin']}>
                      <DashboardLayout>
                        <PlatformSupportPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/platform/server-health"
                  element={
                    <ProtectedRoute allowedRoles={['platform_admin']}>
                      <DashboardLayout>
                        <ServerHealthPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/platform/whatsapp"
                  element={
                    <ProtectedRoute allowedRoles={['platform_admin', 'super_admin']}>
                      <DashboardLayout>
                        <WhatsAppCommandCenterPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuration/whatsapp"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'director', 'platform_admin', 'team_leader', 'sales_manager', 'sales_executive', 'crm_staff']}>
                      <DashboardLayout>
                        <WhatsAppCommandCenterPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/settings/whatsapp" element={<Navigate to="/configuration/whatsapp" replace />} />
                <Route path="/platform/aws" element={<Navigate to="/platform/server-health" replace />} />

                <Route
                  path="/performance"
                  element={
                    <ProtectedRoute permissionKey="sales">
                      <DashboardLayout>
                        <MyPerformancePage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/directory"
                  element={
                    <ProtectedRoute permissionKey="directory">
                      <DashboardLayout>
                        <DirectoryPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <ProtectedRoute permissionKey="users">
                      <DashboardLayout>
                        <UsersPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute permissionKey="roles">
                      <DashboardLayout>
                        <RolesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute permissionKey="departments">
                      <DashboardLayout>
                        <DepartmentsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute permissionKey="inventory" requiredFeature="inventory">
                      <DashboardLayout>
                        <ProjectsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute permissionKey="inventory" requiredFeature="inventory">
                      <DashboardLayout>
                        <InventoryPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/announcements"
                  element={
                    <ProtectedRoute permissionKey="announcements">
                      <DashboardLayout>
                        <AnnouncementsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/targets"
                  element={
                    <ProtectedRoute permissionKey="incentives">
                      <DashboardLayout>
                        <TargetsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/site-visits"
                  element={
                    <ProtectedRoute permissionKey="site_visits" requiredFeature="site_visits">
                      <DashboardLayout>
                        <SiteVisitsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute permissionKey="accounts" allowedRoles={['super_admin', 'admin', 'director', 'accountant']}>
                      <DashboardLayout>
                        <AccountsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/payments" element={<Navigate to="/accounts" replace />} />

                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute permissionKey="sales">
                      <DashboardLayout>
                        <SalesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/incentives"
                  element={
                    <ProtectedRoute permissionKey="incentives" requiredFeature="incentives">
                      <DashboardLayout>
                        <IncentivesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crm"
                  element={
                    <ProtectedRoute permissionKey="crm" requiredFeature="crm">
                      <DashboardLayout>
                        <CRMDashboardPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crm/pipeline"
                  element={
                    <ProtectedRoute permissionKey="crm" requiredFeature="crm">
                      <DashboardLayout>
                        <PipelinePage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute permissionKey="reports" requiredFeature="reports">
                      <DashboardLayout>
                        <ReportsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute permissionKey="crm" requiredFeature="crm">
                      <DashboardLayout>
                        <LeadsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/support"
                  element={
                    <ProtectedRoute permissionKey="support">
                      <DashboardLayout>
                        <SupportPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute permissionKey="subscription">
                      <DashboardLayout>
                        <SubscriptionPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <DashboardLayout>
                        <SettingsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/integrations"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <DashboardLayout>
                        <AdminIntegrationsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-All Route for Unknown URLs */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </ErrorBoundary>
            </TutorialProvider>
          </DialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
