import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStellarStore } from '../hooks/useStellar';
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

  const handleConnect = async (walletId) => {
    try {
      setConnecting(true);
      setNotInstalledWallet(null);
      await kit.setWallet(walletId);
      const { address } = await kit.fetchAddress();
      useStellarStore.getState().setAddress(address);
      setWalletModalOpen(false);
      triggerToast(`Connected to ${walletId}`, "success");
      
      // Fetch balance...
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      const data = await res.json();
      const nativeBalance = data.balances?.find(b => b.asset_type === 'native')?.balance;
      useStellarStore.getState().setBalance(nativeBalance || "0");
      track('wallet_connect', { wallet_id: walletId, wallet_address: address });
      
    } catch (err) {
      console.error(err);
      let errMsg = "Connection failed";
      const errString = err.toString().toLowerCase();
      
      if (errString.includes("not installed") || errString.includes("no provider")) {
        const wallet = WALLETS.find((w) => w.id === walletId);
        setNotInstalledWallet(wallet || { id: walletId, name: walletId });
        return;
      } else if (errString.includes("reject") || errString.includes("cancel") || errString.includes("denied")) {
        errMsg = "Connection rejected by user";
      } else if (errString.includes("timeout")) {
        errMsg = "Connection timed out";
      }
      
      useStellarStore.getState().setError(errMsg);
      triggerToast(errMsg, "error");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWalletModalOpen(false)}
            className="absolute inset-0 bg-black/40 dark:bg-white/10 backdrop-blur-sm transition-colors duration-500"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-[#050505] border border-[#E5E5E5] dark:border-[#222] p-8 shadow-2xl transition-colors duration-500"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-serif italic text-black dark:text-white transition-colors duration-500">Connect Wallet</h2>
              <button 
                onClick={() => setWalletModalOpen(false)}
                className="text-[#888] hover:text-black dark:hover:text-white transition-colors"
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
                    {wallet.recommended && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-[#F7F7F7] dark:bg-[#111] text-[#888] rounded-sm transition-colors duration-500">
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
                      {notInstalledWallet.name} not found
                    </p>
                    <p className="font-mono text-[10px] text-amber-600 dark:text-amber-500 mb-3">
                      Install the {notInstalledWallet.name} browser extension to connect.
                    </p>
                    <a
                      href={DOWNLOAD_URLS[notInstalledWallet.id] || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setNotInstalledWallet(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors"
                    >
                      Download {notInstalledWallet.name} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center border-t border-[#E5E5E5] dark:border-[#222] pt-6 transition-colors duration-500">
              <a 
                href="https://laboratory.stellar.org/#account-creator?network=test" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-mono uppercase tracking-widest text-[#888] hover:text-black dark:hover:text-white transition-colors"
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
