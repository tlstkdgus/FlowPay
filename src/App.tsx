import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PGPayment from './components/PGPayment';
import ReceiptUpload from './components/ReceiptUpload';
import Analytics from './components/Analytics';
import InvoiceGenerator from './components/InvoiceGenerator';
import Sidebar from './components/Sidebar';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/payment" element={<PGPayment />} />
              <Route path="/receipt" element={<ReceiptUpload />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/invoice" element={<InvoiceGenerator />} />
            </Routes>
          </main>
        </div>
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App;
