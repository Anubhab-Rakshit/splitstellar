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
    <div className="fixed top-4 sm:top-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[700px] px-2 sm:px-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="flex items-center justify-between p-1.5 pl-4 sm:pl-6 pr-1.5 rounded-full border border-black dark:border-white bg-white/90 dark:bg-black/90 transition-all duration-500 shadow-xl"
        style={{ 
          backdropFilter: `blur(${navBlur.get()}px)`,
          backgroundColor: isScrolled ? 
            (theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)') : 
            (theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)')
        }}
      >
        <Link to="/" className="flex items-center gap-2 group">
          <motion.span 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="font-serif italic text-lg text-black dark:text-white transition-colors duration-500"
          >
            SS.
          </motion.span>
        </Link>

        <div className="hidden md:flex items-center gap-6 px-4">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`relative text-[10px] font-mono uppercase tracking-widest transition-colors ${location.pathname === link.path ? 'text-black dark:text-white font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
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
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#222] transition-colors text-black dark:text-white"
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
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#222] transition-colors text-black dark:text-white"
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
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80 px-3 sm:px-4 md:px-6 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center gap-2"
            >
              {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 sm:gap-2 md:gap-3 bg-[#F0F0F0] dark:bg-[#111] hover:bg-[#E5E5E5] dark:hover:bg-[#222] px-2 sm:px-3 md:px-4 py-1.5 rounded-full border border-[#DDD] dark:border-[#333] transition-colors duration-500 group"
            >
              {profileName ? (
                <span className="text-[10px] font-mono uppercase text-black dark:text-white max-w-[50px] sm:max-w-[60px] md:max-w-none truncate">{profileName}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-black dark:text-white">{balance ? `${parseFloat(balance).toFixed(1)} XLM` : "..."}</span>
                </div>
              )}
              <div className="w-[1px] h-3 bg-[#CCC] dark:bg-[#333] transition-colors duration-500" />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={disconnectWallet} 
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
            className="md:hidden absolute top-full left-2 sm:left-4 right-2 sm:right-4 mt-2 bg-white dark:bg-black border border-black dark:border-white rounded-2xl p-4 shadow-xl overflow-hidden"
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
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-widest transition-colors ${location.pathname === link.path ? 'text-black dark:text-white bg-[#F7F7F7] dark:bg-[#111] font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#111]'}`}
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
