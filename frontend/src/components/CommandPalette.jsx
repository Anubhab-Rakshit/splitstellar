import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  BarChart3,
  User,
  BookOpen,
  Plus,
  Moon,
  Sun,
  Wallet,
  Copy,
  LogOut,
  ExternalLink,
  X,
} from 'lucide-react';
import { useStellarStore } from '../hooks/useStellar';

const COMMANDS = [
  { id: 'home', name: 'Go to Dashboard', description: 'Navigate to main dashboard', category: 'Navigation', icon: Home, action: 'navigate', path: '/dashboard' },
  { id: 'analytics', name: 'View Analytics', description: 'Check spending insights', category: 'Navigation', icon: BarChart3, action: 'navigate', path: '/analytics' },
  { id: 'profile', name: 'View Profile', description: 'Manage your account', category: 'Navigation', icon: User, action: 'navigate', path: '/profile' },
  { id: 'guide', name: 'Open User Guide', description: 'Learn how SplitStellar works', category: 'Navigation', icon: BookOpen, action: 'navigate', path: '/guide' },
  { id: 'theme-dark', name: 'Switch to Dark Mode', description: 'Toggle dark theme', category: 'Appearance', icon: Moon, action: 'theme', theme: 'dark' },
  { id: 'theme-light', name: 'Switch to Light Mode', description: 'Toggle light theme', category: 'Appearance', icon: Sun, action: 'theme', theme: 'light' },
  { id: 'connect-wallet', name: 'Connect Wallet', description: 'Connect your Stellar wallet', category: 'Wallet', icon: Wallet, action: 'wallet', walletAction: 'connect' },
  { id: 'disconnect-wallet', name: 'Disconnect Wallet', description: 'Disconnect your wallet', category: 'Wallet', icon: LogOut, action: 'wallet', walletAction: 'disconnect' },
  { id: 'copy-address', name: 'Copy Wallet Address', description: 'Copy address to clipboard', category: 'Wallet', icon: Copy, action: 'wallet', walletAction: 'copy' },
  { id: 'view-explorer', name: 'View on Stellar Explorer', description: 'Open account in explorer', category: 'Wallet', icon: ExternalLink, action: 'wallet', walletAction: 'explorer' },
  { id: 'new-pool', name: 'Create New Pool', description: 'Start a new expense pool', category: 'Actions', icon: Plus, action: 'navigate', path: '/dashboard' },
];

const fuse = new Fuse(COMMANDS, { keys: ['name', 'description', 'category'] });

const categories = [...new Set(COMMANDS.map((c) => c.category))];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { address, setTheme, kit, connectWallet } = useStellarStore();

  useEffect(() => {
    fuse.setCollection(COMMANDS);
  }, []);

  const filteredCommands = useMemo(() => {
    if (!search) return COMMANDS;
    return fuse.search(search).map((r) => r.item);
  }, [search]);

  const handleWalletAction = useCallback((action) => {
    switch (action) {
      case 'connect':
        if (!address && kit) {
          connectWallet();
        }
        break;
      case 'disconnect':
        if (address) {
          useStellarStore.getState().disconnect();
        }
        break;
      case 'copy':
        if (address) {
          navigator.clipboard.writeText(address);
        }
        break;
      case 'explorer':
        if (address) {
          window.open(`https://stellar.expert/explorer/testnet/account/${address}`, '_blank');
        }
        break;
      default:
        break;
    }
  }, [address, kit, connectWallet]);

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((command) => {
    setOpen(false);
    setSearch('');

    switch (command.action) {
      case 'navigate':
        navigate(command.path);
        break;
      case 'theme':
        setTheme(command.theme);
        break;
      case 'wallet':
        handleWalletAction(command.walletAction);
        break;
      default:
        break;
    }
  }, [navigate, setTheme, handleWalletAction]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] font-mono text-xs text-[#666] dark:text-[#888] hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all duration-300 shadow-lg"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] border border-[#E5E5E5] dark:border-[#333]">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] sm:w-full max-w-2xl"
            >
              <div 
                className="overflow-hidden rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-3xl border border-white dark:border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    import('../services/AudioEngine').then(m => m.audio.playTick());
                  }
                }}
              >
                <Command className="w-full h-full" shouldFilter={false}>
                  <div className="flex items-center border-b border-black/10 dark:border-white/10 px-4">
                    <Search className="w-5 h-5 text-[#666] dark:text-[#888]" />
                    <Command.Input
                      value={search}
                      onValueChange={setSearch}
                      placeholder="Type a command or search..."
                      className="flex-1 bg-transparent px-4 py-6 font-mono text-base outline-none text-black dark:text-white placeholder:text-[#666] dark:placeholder:text-[#888]"
                      autoFocus
                    />
                    <button
                      onClick={() => setOpen(false)}
                      className="px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-[10px] font-mono text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
                    >
                      ESC
                    </button>
                  </div>

                  <Command.List className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar" data-lenis-prevent>
                    <Command.Empty className="py-12 text-center font-mono text-sm text-[#666] dark:text-[#888]">
                      No commands found.
                    </Command.Empty>

                    {categories.map((category) => {
                      const categoryCommands = filteredCommands.filter(
                        (c) => c.category === category
                      );
                      if (categoryCommands.length === 0) return null;

                      return (
                        <Command.Group
                          key={category}
                          heading={
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] px-3 py-2 block">
                              {category}
                            </span>
                          }
                        >
                          {categoryCommands.map((command, index) => (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              key={command.id}
                            >
                              <Command.Item
                                value={command.name}
                                onSelect={() => handleSelect(command)}
                                onMouseEnter={() => import('../services/AudioEngine').then(m => m.audio.playTick())}
                                className="flex items-center gap-4 px-4 py-3 cursor-pointer rounded-xl font-mono text-sm text-[#444] dark:text-[#ccc] hover:text-black dark:hover:text-white transition-all data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-black dark:data-[selected=true]:text-white"
                              >
                                <div className="p-2 bg-white dark:bg-black rounded-lg shadow-sm border border-black/5 dark:border-white/5">
                                  <command.icon className="w-4 h-4 text-black dark:text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{command.name}</div>
                                  <div className="text-[10px] text-[#666] dark:text-[#888] mt-0.5">
                                    {command.description}
                                  </div>
                                </div>
                              </Command.Item>
                            </motion.div>
                          ))}
                        </Command.Group>
                      );
                    })}
                  </Command.List>

                  <div className="border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                      {filteredCommands.length} commands available
                    </span>
                    <div className="flex items-center gap-4 hidden sm:flex">
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black border border-black/10 dark:border-white/10 text-[10px] font-mono text-[#666] dark:text-[#888] shadow-sm">
                          ↑↓
                        </kbd>
                        <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">navigate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black border border-black/10 dark:border-white/10 text-[10px] font-mono text-[#666] dark:text-[#888] shadow-sm">
                          ↵
                        </kbd>
                        <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">select</span>
                      </div>
                    </div>
                  </div>
                </Command>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
