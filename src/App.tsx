import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
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

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <DialogProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
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
                path="/reports"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ReportsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DialogProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
