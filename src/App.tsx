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
                    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
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
                    <ProtectedRoute>
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
                    <ProtectedRoute>
                      <DashboardLayout>
                        <IncentivesPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crm"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <CRMDashboardPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/crm/pipeline"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <PipelinePage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ReportsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute>
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
              </Routes>
            </TutorialProvider>
          </DialogProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
