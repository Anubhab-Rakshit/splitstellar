import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Loader2, Sun, Moon } from 'lucide-react';
import { useStellarStore } from '../hooks/useStellar';
import { triggerToast } from '../services/toast';

export default function Notchbar() {
  const { address, balance, isConnecting, profileName, theme, toggleTheme, setWalletModalOpen, setAddress, setBalance, setProfileName } = useStellarStore();
  const location = useLocation();

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setProfileName(null);
    triggerToast("Wallet disconnected", "info");
  };

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[700px] px-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full border border-black dark:border-white bg-white dark:bg-black transition-colors duration-500 shadow-xl"
      >
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-serif italic text-lg text-black dark:text-white transition-colors duration-500">SS.</span>
        </Link>

        <div className="flex items-center gap-6 px-4">
          <Link to="/" className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${location.pathname === '/' ? 'text-black dark:text-white font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}>Home</Link>
          <Link to="/dashboard" className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${location.pathname === '/dashboard' ? 'text-black dark:text-white font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}>App</Link>
          {address && (
            <Link to="/profile" className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${location.pathname === '/profile' ? 'text-black dark:text-white font-bold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}>Profile</Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#222] transition-colors text-black dark:text-white"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {!address ? (
            <button 
              onClick={() => setWalletModalOpen(true)}
              disabled={isConnecting}
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80 px-6 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center gap-2"
            >
              {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-[#F0F0F0] dark:bg-[#111] hover:bg-[#E5E5E5] dark:hover:bg-[#222] px-4 py-1.5 rounded-full border border-[#DDD] dark:border-[#333] transition-colors duration-500 group">
              {profileName ? (
                <span className="text-[10px] font-mono uppercase text-black dark:text-white">{profileName}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-black dark:text-white">{balance ? `${parseFloat(balance).toFixed(1)} XLM` : "..."}</span>
                </div>
              )}
              <div className="w-[1px] h-3 bg-[#CCC] dark:bg-[#333] transition-colors duration-500" />
              <button onClick={disconnectWallet} className="text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
