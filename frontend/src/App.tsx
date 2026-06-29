import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import CustomerDashboard from './pages/CustomerDashboard';
import CreateReturn from './pages/CreateReturn';
import RequestDetail from './pages/RequestDetail';

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* REDIRECT ROOT TO DASHBOARD */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* CUSTOMER PORTAL SHELL */}
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/returns/new" element={<CreateReturn />} />
            <Route path="/returns/:id" element={<RequestDetail />} />
          </Route>
        </Route>


        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
