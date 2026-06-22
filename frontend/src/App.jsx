import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout
import Layout from './components/Layout';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Otp2fa from './pages/Otp2fa';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Protected pages
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Settings from './pages/Settings';
import Webhooks from './pages/Webhooks';
import AuditLogs from './pages/AuditLogs';

// Helper component for Route shielding
const PrivateRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-2fa" element={<Otp2fa />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Workspace Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/workspaces/:workspaceId/dashboard" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/workspaces/:workspaceId/boards/:boardId" 
        element={
          <PrivateRoute>
            <Layout>
              <BoardView />
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/workspaces/:workspaceId/analytics" 
        element={
          <PrivateRoute>
            <Layout>
              <AnalyticsDashboard />
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/workspaces/:workspaceId/settings" 
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/workspaces/:workspaceId/webhooks" 
        element={
          <PrivateRoute>
            <Layout>
              <Webhooks />
            </Layout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/workspaces/:workspaceId/audit-logs" 
        element={
          <PrivateRoute>
            <Layout>
              <AuditLogs />
            </Layout>
          </PrivateRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
