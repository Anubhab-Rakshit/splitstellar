import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStellarStore, WALLETCONNECT_PROJECT_ID } from '../hooks/useStellar';
import { X, Anchor, Cloud, Zap, Link2, ExternalLink, AlertTriangle } from 'lucide-react';
import { triggerToast } from '../services/toast';
import { track } from '../services/analytics';

const DOWNLOAD_URLS = {
  freighter: 'https://www.freighter.app/',
  albedo: 'https://albedo.link/',
  xbull: 'https://xbull.app/',
  walletconnect: 'https://walletconnect.com/',
};

const WALLETS = [
  { id: 'freighter', name: 'Freighter', icon: Anchor, recommended: true },
  { id: 'albedo', name: 'Albedo', icon: Cloud },
  { id: 'xbull', name: 'xBull', icon: Zap },
  { id: 'walletconnect', name: 'WalletConnect', icon: Link2 },
];

export default function WalletModal() {
  const { isWalletModalOpen, setWalletModalOpen, kit, setConnecting } = useStellarStore();
  const [notInstalledWallet, setNotInstalledWallet] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isWalletModalOpen) {
        setWalletModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWalletModalOpen, setWalletModalOpen]);

  const isMobile = useMemo(() =>
    /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  []);

  const isExtensionOnlyWallet = (walletId) => walletId === 'freighter' || walletId === 'xbull';

  const handleConnect = async (walletId) => {
    try {
      setConnecting(true);
      setNotInstalledWallet(null);

      if (isMobile && isExtensionOnlyWallet(walletId)) {
        const wallet = WALLETS.find((w) => w.id === walletId);
        setNotInstalledWallet({ ...wallet, unavailable: 'mobile' });
        return;
      }

      if (walletId === 'walletconnect' && !WALLETCONNECT_PROJECT_ID) {
        const wallet = WALLETS.find((w) => w.id === walletId);
        setNotInstalledWallet({ ...wallet, unavailable: 'unconfigured' });
        return;
      }

      await kit.setWallet(walletId);
      const { address } = await kit.fetchAddress();
      useStellarStore.getState().setAddress(address);
      setWalletModalOpen(false);
      triggerToast(`Connected to ${walletId}`, "success");
      
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (res.ok) {
        const data = await res.json();
        const nativeBalance = data.balances?.find(b => b.asset_type === 'native')?.balance;
        useStellarStore.getState().setBalance(nativeBalance || "0");
      } else {
        useStellarStore.getState().setBalance("0");
      }
      track('wallet_connect', { wallet_id: walletId, wallet_address: address });
      
    } catch (err) {
      console.error(err);
      const errString = err.toString().toLowerCase();
      
      if (errString.includes("reject") || errString.includes("cancel") || errString.includes("denied")) {
        useStellarStore.getState().setError("Connection rejected by user");
        triggerToast("Connection rejected by user", "error");
      } else {
        const wallet = WALLETS.find((w) => w.id === walletId);
        if (wallet) {
          setNotInstalledWallet(wallet);
        } else {
          useStellarStore.getState().setError("Connection failed");
          triggerToast("Connection failed", "error");
        }
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {isWalletModalOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="wallet-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWalletModalOpen(false)}
            className="absolute inset-0 bg-black/40 dark:bg-white/10 backdrop-blur-sm transition-colors duration-500"
          />
          
          <motion.div
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) setWalletModalOpen(false);
            }}
            initial={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0, y: 20 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-colors duration-500 overflow-y-auto custom-scrollbar data-lenis-prevent ${
              isMobile ? 'fixed bottom-0 rounded-t-[2rem] pb-10 max-h-[90vh] z-50' : 'max-w-md max-h-[calc(100vh-2rem)] rounded-3xl'
            }`}
          >
            {isMobile && (
              <div className="w-12 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-6" />
            )}
            <div className="flex justify-between items-center mb-8">
              <h2 id="wallet-modal-title" className="text-2xl font-serif italic text-black dark:text-white transition-colors duration-500">Connect Wallet</h2>
              <button 
                onClick={() => setWalletModalOpen(false)}
                aria-label="Close wallet modal"
                className="text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {WALLETS.map((wallet) => {
                const Icon = wallet.icon;
                return (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    className="w-full flex items-center justify-between p-4 border border-[#E5E5E5] dark:border-[#222] hover:border-black dark:hover:border-white transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#F7F7F7] dark:bg-[#111] rounded-sm group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-sm text-black dark:text-white transition-colors duration-500">{wallet.name}</span>
                    </div>
                    {isMobile && wallet.id === 'albedo' && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-sm transition-colors duration-500">
                        Best on mobile
                      </span>
                    )}
                    {!isMobile && wallet.recommended && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-[#F7F7F7] dark:bg-[#111] text-[#666] dark:text-[#888] rounded-sm transition-colors duration-500">
                        Recommended
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {notInstalledWallet && (
              <div className="mt-6 p-4 border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 rounded-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                      {notInstalledWallet.unavailable === 'mobile'
                        ? `${notInstalledWallet.name} needs a browser extension`
                        : notInstalledWallet.unavailable === 'unconfigured'
                          ? 'WalletConnect is not configured yet'
                          : `${notInstalledWallet.name} not found`}
                    </p>
                    <p className="font-mono text-[10px] text-amber-600 dark:text-amber-500 mb-3">
                      {notInstalledWallet.unavailable === 'mobile'
                        ? 'Browser extensions don\u2019t run on mobile. Use Albedo, which works directly in your browser, or WalletConnect.'
                        : notInstalledWallet.unavailable === 'unconfigured'
                          ? 'This deployment has no WalletConnect project ID. Albedo works right now on mobile.'
                          : `Install the ${notInstalledWallet.name} browser extension to connect.`}
                    </p>
                    {notInstalledWallet.unavailable ? (
                      <button
                        onClick={() => handleConnect('albedo')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors"
                      >
                        Use Albedo <Cloud className="w-3 h-3" />
                      </button>
                    ) : (
                      <a
                        href={DOWNLOAD_URLS[notInstalledWallet.id] || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setNotInstalledWallet(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors"
                      >
                        Download {notInstalledWallet.name} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center border-t border-[#E5E5E5] dark:border-[#222] pt-6 transition-colors duration-500">
              <a 
                href="https://laboratory.stellar.org/#account-creator?network=test" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
              >
                Get Testnet XLM ↗
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
