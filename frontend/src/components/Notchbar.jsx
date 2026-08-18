import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Loader2, Sun, Moon, Menu, X, ChevronRight } from 'lucide-react';
import { useStellarStore } from '../hooks/useStellar';
import { triggerToast } from '../services/toast';

export default function Notchbar() {
  const { address, balance, isConnecting, profileName, theme, toggleTheme, setWalletModalOpen, disconnect } = useStellarStore();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navBlur = useTransform(scrollY, [0, 100], [0, 10]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const disconnectWallet = () => {
    disconnect();
    triggerToast("Wallet disconnected", "info");
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/guide', label: 'Guide' },
    { path: '/dashboard', label: 'App' },
    ...(address ? [
      { path: '/profile', label: 'Profile' },
      { path: '/analytics', label: 'Analytics' },
    ] : []),
  ];

  return (
    <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[780px] px-2 sm:px-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="flex items-center justify-between p-2 pl-4 sm:pl-6 pr-2 rounded-full border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-2xl transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.02)]"
        style={{ 
          backgroundColor: isScrolled ? 
            (theme === 'dark' ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.6)') : 
            (theme === 'dark' ? 'rgba(5,5,5,0.4)' : 'rgba(255,255,255,0.4)')
        }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-serif italic text-xl text-black dark:text-white transition-colors duration-500">
              SS.
            </span>
          </Link>

          {/* Live System Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-500">
              SYS.ONLINE
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 px-4">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`relative font-mono text-[10px] uppercase tracking-widest transition-colors ${location.pathname === link.path ? 'text-black dark:text-white font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
            >
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -bottom-1 left-0 right-0 h-[1px] bg-black dark:bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Menu Toggle */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full border border-white/50 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Theme Toggle */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/50 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {!address ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWalletModalOpen(true)}
              disabled={isConnecting}
              className="btn-primary"
            >
              {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 sm:gap-2 md:gap-3 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/50 dark:border-white/10 transition-colors duration-500 group"
            >
              {profileName ? (
                <span className="text-[10px] font-mono uppercase text-black dark:text-white max-w-[50px] sm:max-w-[60px] md:max-w-none truncate">{profileName}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-black dark:text-white">{balance ? `${parseFloat(balance).toFixed(1)} XLM` : "..."}</span>
                </div>
              )}
              <div className="w-[1px] h-3 bg-[#CCC] dark:bg-[#222] transition-colors duration-500" />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={disconnectWallet} 
                aria-label="Disconnect wallet"
                className="text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute top-full left-2 sm:left-4 right-2 sm:right-4 mt-2 bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-4 shadow-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Link 
                    onClick={() => setIsMenuOpen(false)} 
                    to={link.path} 
                    className={`flex items-center justify-between px-4 py-3 rounded-none text-xs font-mono uppercase tracking-widest transition-colors ${location.pathname === link.path ? 'text-black dark:text-white bg-[#F7F7F7] dark:bg-[#111] font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#111]'}`}
                  >
                    {link.label}
                    {location.pathname === link.path && (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
