import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PGPayment from './components/PGPayment';
import ReceiptUpload from './components/ReceiptUpload';
import Analytics from './components/Analytics';
import InvoiceGenerator from './components/InvoiceGenerator';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { FlowPayProvider } from './store/FlowPayContext';
import { ToastProvider } from './components/ui';

function App() {
  return (
    <FlowPayProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <Sidebar />
            <main className="lg:pl-64 pb-24 lg:pb-0">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/payment" element={<PGPayment />} />
                <Route path="/receipt" element={<ReceiptUpload />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/invoice" element={<InvoiceGenerator />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <PWAInstallPrompt />
          </div>
        </Router>
      </ToastProvider>
    </FlowPayProvider>
  );
}

export default App;
