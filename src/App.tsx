import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { AccountantDashboard } from './components/dashboards/AccountantDashboard';
import { ReferralProgramPage } from './pages/ReferralProgramPage';
import { TenantsPage } from './pages/admin/TenantsPage';


import { ThemeProvider } from './contexts/ThemeContext';
import { TutorialProvider } from './contexts/TutorialContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <DialogProvider>
            <TutorialProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterCompanyPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/referral-program" element={<ReferralProgramPage />} />
                <Route path="accountant-dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
            
            {/* Platform Admin Routes */}
            <Route path="referral-management" element={
              <ProtectedRoute allowedRoles={['platform_admin', 'super_admin']}>
                <DashboardLayout>
                  <ReferralManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

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
                  path="/performance"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <MyPerformancePage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/directory"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <DirectoryPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                      <DashboardLayout>
                        <UsersPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <DashboardLayout>
                        <RolesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                      <DashboardLayout>
                        <DepartmentsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredFeature="inventory">
                      <DashboardLayout>
                        <ProjectsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/announcements"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <AnnouncementsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/targets"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <TargetsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/site-visits"
                  element={
                    <ProtectedRoute requiredFeature="site_visits">
                      <DashboardLayout>
                        <SiteVisitsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <SalesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/incentives"
                  element={
                    <ProtectedRoute requiredFeature="incentives">
                      <DashboardLayout>
                        <IncentivesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crm"
                  element={
                    <ProtectedRoute requiredFeature="crm">
                      <DashboardLayout>
                        <CRMDashboardPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crm/pipeline"
                  element={
                    <ProtectedRoute requiredFeature="crm">
                      <DashboardLayout>
                        <PipelinePage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute requiredFeature="reports">
                      <DashboardLayout>
                        <ReportsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute requiredFeature="crm">
                      <DashboardLayout>
                        <LeadsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/support"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'director']}>
                      <DashboardLayout>
                        <SupportPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <SubscriptionPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </TutorialProvider>
          </DialogProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
