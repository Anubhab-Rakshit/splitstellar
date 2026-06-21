import { useState, useEffect } from 'react';
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-[#0D1526] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden p-8"
          >
            <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center mb-6 mx-auto">
              <User className="w-8 h-8 text-accent-emerald" />
            </div>
            
            <h2 className="text-2xl font-display font-semibold text-center mb-2">Claim Your Alias</h2>
            <p className="text-text-secondary text-sm text-center mb-8">
              Welcome to SplitStellar. Please choose a public name for your wallet address so friends can recognize you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Satoshi" 
                  className="w-full bg-[#050A14] border border-[rgba(255,255,255,0.1)] rounded-xl px-5 py-4 text-white text-lg focus:outline-none focus:border-accent-emerald focus:ring-1 focus:ring-accent-emerald transition-all text-center placeholder:text-text-tertiary"
                  autoFocus
                  maxLength={20}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || alias.trim().length < 2}
                className="btn-primary w-full py-4 text-lg"
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
