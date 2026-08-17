import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import WalletModal from './components/WalletModal';
import ToastContainer from './components/Toast';
import ProfileModal from './components/ProfileModal';
import Notchbar from './components/Notchbar';
import CommandPalette from './components/CommandPalette';
import InitialLoader from './components/InitialLoader';
import SmoothScroll from './components/SmoothScroll';
import { useStellarStore, initializeStellarKit, hydrateWalletSession } from './hooks/useStellar';

import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Guide from './pages/Guide';

function App() {
  const [loading, setLoading] = useState(true);
  const theme = useStellarStore((state) => state.theme);

  useEffect(() => {
    initializeStellarKit();
    hydrateWalletSession();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <VercelAnalytics />
      {loading && <InitialLoader onComplete={() => setLoading(false)} />}
      
      {!loading && (
        <SmoothScroll>
          <Notchbar />
          <CommandPalette />
          <ToastContainer />
          <WalletModal />
          <ProfileModal />

          <Routes>
            <Route path="/" element={<ErrorBoundary fallback="landing"><Landing /></ErrorBoundary>} />
            <Route path="/dashboard" element={<ErrorBoundary fallback="dashboard"><Dashboard /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary fallback="profile"><Profile /></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary fallback="analytics"><Analytics /></ErrorBoundary>} />
            <Route path="/guide" element={<ErrorBoundary fallback="guide"><Guide /></ErrorBoundary>} />
          </Routes>
        </SmoothScroll>
      )}
    </BrowserRouter>
  );
}

export default App;
