// client/src/app/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading ForgeQuote...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/rfqs" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/rfqs" replace />} />
        <Route path="rfqs" element={<DashboardPage />} />
        <Route path="rates" element={<div className="p-4 bg-white rounded border">Rate Masters Workspace</div>} />
        <Route path="approvals" element={<div className="p-4 bg-white rounded border">Commercial Approvals Inbox</div>} />
        <Route path="history" element={<div className="p-4 bg-white rounded border">Historical Parts Search</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/rfqs" replace />} />
    </Routes>
  );
}
