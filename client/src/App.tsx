import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

// Platform Pages — Real Data Only
import { Dashboard } from './pages/Dashboard';
import { SoftwareCatalog } from './pages/SoftwareCatalog';
import { Repositories } from './pages/Repositories';
import { PullRequests } from './pages/PullRequests';
import { Issues } from './pages/Issues';
import { Commits } from './pages/Commits';
import { Deployments } from './pages/Deployments';
import { DoraMetrics } from './pages/DoraMetrics';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

import { BackgroundWaves } from './components/common/BackgroundWaves';
import { ErrorBoundary } from './components/common/ErrorBoundary';


// Protected Route Guard with Mobile Drawer State
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center space-y-3 relative">
        <BackgroundWaves opacity={0.6} />
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">Authenticating session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#070b19]/90 text-slate-100 flex relative overflow-x-hidden">
      {/* Robotic Cyber Oscilloscope Canvas */}
      <BackgroundWaves opacity={0.85} />

      {/* Sidebar with Mobile Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 pt-16 relative z-10 w-full">
          <ErrorBoundary fallbackLabel="Page failed to load">{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

// Public Route Guard (redirects authenticated users to /dashboard)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center space-y-3 relative">
        <BackgroundWaves opacity={0.6} />
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading Command Center...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Core Protected Routes */}
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/pull-requests" element={<ProtectedLayout><PullRequests /></ProtectedLayout>} />
          <Route path="/repositories" element={<ProtectedLayout><Repositories /></ProtectedLayout>} />
          <Route path="/issues" element={<ProtectedLayout><Issues /></ProtectedLayout>} />
          <Route path="/commits" element={<ProtectedLayout><Commits /></ProtectedLayout>} />
          <Route path="/deployments" element={<ProtectedLayout><Deployments /></ProtectedLayout>} />

          {/* Engineering Intelligence */}
          <Route path="/dora" element={<ProtectedLayout><DoraMetrics /></ProtectedLayout>} />

          {/* AI & Platform */}
          <Route path="/ai" element={<ProtectedLayout><AIAssistant /></ProtectedLayout>} />
          <Route path="/catalog" element={<ProtectedLayout><SoftwareCatalog /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

          {/* Legacy routes → graceful redirect so old bookmarks don't 404 */}
          <Route path="/health" element={<Navigate to="/dashboard" replace />} />
          <Route path="/scorecards" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reports" element={<Navigate to="/ai" replace />} />
          <Route path="/actions" element={<Navigate to="/dashboard" replace />} />
          <Route path="/activity" element={<Navigate to="/dashboard" replace />} />
          <Route path="/teams" element={<Navigate to="/settings" replace />} />
          <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />
          <Route path="/integrations" element={<Navigate to="/settings" replace />} />

          {/* Default Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
