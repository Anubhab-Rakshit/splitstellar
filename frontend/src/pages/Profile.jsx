import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStellarStore } from '../hooks/useStellar';
import { Copy, Check, Activity, ExternalLink, Edit2, Loader2 } from 'lucide-react';
import { triggerToast } from '../services/toast';
import { db } from '../services/db';

export default function Profile() {
  const { address, balance, profileName, setProfileName } = useStellarStore();
  const [copied, setCopied] = useState(false);
  const [activities, setActivities] = useState(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleEditName = () => {
    setEditName(profileName || '');
    setIsEditingName(true);
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !address) return;
    setIsSavingName(true);
    try {
      const updatedProfile = await db.updateProfile(address, editName.trim());
      if (updatedProfile) {
        setProfileName(updatedProfile.name);
        triggerToast("Profile updated", "success");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update profile", "error");
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    db.getRecentActivities()
      .then((acts) => {
        if (!cancelled) {
          setActivities(acts.filter((a) => a.wallet_address === address));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load activities:', err);
          triggerToast('Failed to load recent activity', 'error');
          setActivities([]);
        }
      });

    return () => { cancelled = true; };
  }, [address]);

  const handleCopy = () => {
    if (address) {
      try {
        navigator.clipboard.writeText(address);
        setCopied(true);
        triggerToast("Address copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        triggerToast("Could not copy address", "error");
      }
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen pt-40 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-serif italic mb-4">Connect Wallet</h1>
        <p className="text-sm font-mono text-[#888]">Please connect your Stellar wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-32 px-6 lg:px-12 max-w-[1000px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white text-5xl md:text-7xl font-serif italic tracking-tight outline-none w-full max-w-[400px] text-black dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={isSavingName} className="btn-primary px-6 py-3">
                    {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </button>
                  <button type="button" onClick={() => setIsEditingName(false)} className="btn-secondary px-6 py-3">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-4 group">
                <h1 className="text-6xl md:text-8xl font-serif italic tracking-tight">
                  {profileName || 'Anonymous'}
                </h1>
                <button onClick={handleEditName} className="opacity-0 group-hover:opacity-100 transition-opacity p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" title="Edit Alias">
                  <Edit2 className="w-8 h-8 text-[#888] hover:text-black dark:hover:text-white" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-y border-[#E5E5E5] dark:border-[#222] py-6 transition-colors duration-500">
            
            <div className="flex-1">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">Wallet Address</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm sm:text-base break-all">{address}</span>
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                  title="Copy Address"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="w-full sm:w-[1px] h-[1px] sm:h-12 bg-[#E5E5E5] dark:bg-[#222] transition-colors duration-500" />

            <div className="flex-1 sm:text-right">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">Available Balance (Testnet)</span>
              <span className="font-mono text-2xl">{balance ? `${parseFloat(balance).toFixed(2)} XLM` : "0.00 XLM"}</span>
            </div>

          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif italic">Recent Activity</h2>
            <div className="flex items-center gap-2 px-3 py-1 border border-[#E5E5E5] dark:border-[#333] rounded-full transition-colors duration-500">
              <Activity className="w-3 h-3 text-[#888]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">Live Sync</span>
            </div>
          </div>

          {activities === null ? (
            <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black transition-colors duration-500 p-6 text-center">
              <p className="text-sm font-mono text-[#888] animate-pulse">Loading activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black transition-colors duration-500 p-6 text-center">
              <p className="text-sm font-mono text-[#888]">No recent activity yet.</p>
            </div>
          ) : (
          <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black transition-colors duration-500">
            {activities.map((act, index) => (
              <div 
                key={act.id} 
                className={`flex items-center justify-between p-6 ${index !== activities.length - 1 ? 'border-b border-[#E5E5E5] dark:border-[#222]' : ''} transition-colors duration-500 hover:bg-black/5 dark:hover:bg-white/5`}
              >
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block font-mono text-[10px] text-[#888]">{act.timestamp ? new Date(act.timestamp).toLocaleString() : ''}</div>
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider mb-1">{act.type.replace('_', ' ')}</div>
                      <div className="font-mono text-[10px] text-[#888] flex items-center gap-1">
                        {act.details?.pool_name || act.details?.description || ''}
                        {act.details?.tx_hash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${act.details.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400"
                          >
                            tx <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
