import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStellarStore } from '../hooks/useStellar';
import { db } from '../services/db';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import { triggerToast } from '../services/toast';

export default function ProfileModal() {
  const { address, profileName, setProfileName } = useStellarStore();
  const [isOpen, setIsOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = useMemo(() =>
    /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  []);

  useEffect(() => {
    const checkProfile = async () => {
      if (address && !profileName) {
        try {
          const profile = await db.getProfile(address);
          if (profile && profile.name) {
            setProfileName(profile.name);
          } else {
            setIsOpen(true);
          }
        } catch (err) {
          console.error("Profile fetch error", err);
        }
      }
    };
    checkProfile();
  }, [address, profileName, setProfileName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alias.trim()) return;

    setIsSubmitting(true);
    try {
      const profile = await db.createProfile(address, alias.trim());
      setProfileName(profile.name);
      setIsOpen(false);
      triggerToast(`Welcome to SplitStellar, ${profile.name}!`, "success");
    } catch {
      triggerToast("Failed to create profile. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="profile-modal-title"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) setIsOpen(false);
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
            <div className="w-16 h-16 rounded-none bg-emerald-50 dark:bg-[rgba(34,197,94,0.1)] border border-emerald-200 dark:border-[rgba(34,197,94,0.2)] flex items-center justify-center mb-6 mx-auto">
              <User className="w-8 h-8 text-accent-emerald" />
            </div>
            
            <h2 id="profile-modal-title" className="text-2xl font-display font-semibold text-center text-black dark:text-white mb-2">Claim Your Alias</h2>
            <p className="text-[#666] dark:text-text-secondary text-sm text-center mb-8">
              Welcome to SplitStellar. Please choose a public name for your wallet address so friends can recognize you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Satoshi" 
                  className="w-full bg-[#F7F7F7] dark:bg-[#111] border border-[#CCC] dark:border-[#222] rounded-none px-5 py-4 text-black dark:text-white text-lg focus:outline-none focus:border-accent-emerald focus:ring-1 focus:ring-accent-emerald transition-all text-center placeholder:text-[#999] dark:placeholder:text-text-tertiary"
                  autoFocus
                  maxLength={20}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || alias.trim().length < 2}
                className="btn-primary w-full py-4 text-lg rounded-none"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Continue <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
