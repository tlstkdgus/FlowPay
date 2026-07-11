import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PGPayment from './components/PGPayment';
import ReceiptUpload from './components/ReceiptUpload';
import Analytics from './components/Analytics';
import InvoiceGenerator from './components/InvoiceGenerator';
import Sidebar from './components/Sidebar';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  // Flow ID를 앱 전역에서 일관되게 사용하도록 최초 1회 초기화
  useEffect(() => {
    if (!localStorage.getItem('flowId')) {
      localStorage.setItem('flowId', 'XK8P2M');
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Sidebar />
        <main className="lg:pl-64 pb-24 lg:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/payment" element={<PGPayment />} />
            <Route path="/receipt" element={<ReceiptUpload />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/invoice" element={<InvoiceGenerator />} />
          </Routes>
        </main>
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App;
