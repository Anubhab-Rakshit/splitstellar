import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WalletModal from './components/WalletModal';
import ToastContainer from './components/Toast';
import ProfileModal from './components/ProfileModal';
import Notchbar from './components/Notchbar';
import InitialLoader from './components/InitialLoader';
import SmoothScroll from './components/SmoothScroll';
import { useStellarStore, initializeStellarKit } from './hooks/useStellar';

import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';

function App() {
  const [loading, setLoading] = useState(true);
  const theme = useStellarStore((state) => state.theme);

  useEffect(() => {
    initializeStellarKit();
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
      {loading && <InitialLoader onComplete={() => setLoading(false)} />}
      
      {!loading && (
        <SmoothScroll>
          <Notchbar />
          <ToastContainer />
          <WalletModal />
          <ProfileModal />

          <Routes>
            <Route path="/" element={<ErrorBoundary fallback="landing"><Landing /></ErrorBoundary>} />
            <Route path="/dashboard" element={<ErrorBoundary fallback="dashboard"><Dashboard /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary fallback="profile"><Profile /></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary fallback="analytics"><Analytics /></ErrorBoundary>} />
          </Routes>
        </SmoothScroll>
      )}
    </BrowserRouter>
  );
}

export default App;
