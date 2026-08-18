import { useState, useEffect } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import WalletModal from './components/WalletModal';
import ToastContainer from './components/Toast';
import ProfileModal from './components/ProfileModal';
import Notchbar from './components/Notchbar';
import CommandPalette from './components/CommandPalette';
import InitialLoader from './components/InitialLoader';
import SmoothScroll from './components/SmoothScroll';
import CustomCursor from './components/CustomCursor';
import CanvasFluidBackground from './components/CanvasFluidBackground';
import { useStellarStore, initializeStellarKit, hydrateWalletSession } from './hooks/useStellar';

import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Guide from './pages/Guide';

function App() {
  const [loading, setLoading] = useState(true);
  const theme = useStellarStore((state) => state.theme);
  const location = useLocation();

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

  // Global mouse tracker for Spotlight Neumorphism
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
    setTimeout(() => {
      const mainEl = document.getElementById('main-content');
      if (mainEl) mainEl.focus();
    }, 100);
  };

  return (
    <>
      <VercelAnalytics />
      
      {/* Skip-to-content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-black font-mono text-xs uppercase tracking-widest border border-black shadow-2xl outline-none"
      >
        Skip to content
      </a>

      <CustomCursor />
      <CanvasFluidBackground />

      {loading && <InitialLoader onComplete={handleLoadingComplete} />}
      
      {!loading && (
        <SmoothScroll>
          <Notchbar />
          <CommandPalette />
          <ToastContainer />
          <WalletModal />
          <ProfileModal />

          <main id="main-content" role="main" tabIndex="-1" className="relative z-10 outline-none">
            <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<ErrorBoundary fallback="landing"><Landing /></ErrorBoundary>} />
                <Route path="/dashboard" element={<ErrorBoundary fallback="dashboard"><Dashboard /></ErrorBoundary>} />
                <Route path="/profile" element={<ErrorBoundary fallback="profile"><Profile /></ErrorBoundary>} />
                <Route path="/analytics" element={<ErrorBoundary fallback="analytics"><Analytics /></ErrorBoundary>} />
                <Route path="/guide" element={<ErrorBoundary fallback="guide"><Guide /></ErrorBoundary>} />
              </Routes>
            </AnimatePresence>
          </main>
          
          <Footer />
        </SmoothScroll>
      )}
    </>
  );
}

export default App;
