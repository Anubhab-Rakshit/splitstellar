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

const fuse = new Fuse(COMMANDS, { keys: ['name', 'description', 'category'] });

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
          useStellarStore.getState().setAddress(null);
          useStellarStore.getState().setKit(null);
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
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] sm:w-full max-w-lg"
            >
              <Command className="bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] shadow-2xl" shouldFilter={false}>
                <div className="flex items-center border-b border-[#E5E5E5] dark:border-[#333] px-4">
                  <Search className="w-4 h-4 text-[#666] dark:text-[#888]" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Type a command..."
                    className="flex-1 bg-transparent px-3 py-4 font-mono text-sm outline-none text-black dark:text-white placeholder:text-[#666] dark:placeholder:text-[#888]"
                    autoFocus
                  />
                  <button
                    onClick={() => setOpen(false)}
                    className="text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2" data-lenis-prevent>
                  <Command.Empty className="py-6 text-center font-mono text-xs text-[#666] dark:text-[#888]">
                    No results found.
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
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
                            {category}
                          </span>
                        }
                      >
                        {categoryCommands.map((command) => (
                          <Command.Item
                            key={command.id}
                            value={command.name}
                            onSelect={() => handleSelect(command)}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded font-mono text-sm text-black dark:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#222] transition-colors data-[selected=true]:bg-[#F7F7F7] dark:data-[selected=true]:bg-[#222]"
                          >
                            <command.icon className="w-4 h-4 text-[#666] dark:text-[#888]" />
                            <div className="flex-1">
                              <div>{command.name}</div>
                              <div className="text-[10px] text-[#666] dark:text-[#888]">
                                {command.description}
                              </div>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    );
                  })}
                </Command.List>

                <div className="border-t border-[#E5E5E5] dark:border-[#333] px-4 py-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                    {filteredCommands.length} commands
                  </span>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 text-[10px] border border-[#E5E5E5] dark:border-[#333] font-mono text-[#666] dark:text-[#888]">
                      ↑↓
                    </kbd>
                    <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">navigate</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] border border-[#E5E5E5] dark:border-[#333] font-mono text-[#666] dark:text-[#888]">
                      ↵
                    </kbd>
                    <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">select</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] border border-[#E5E5E5] dark:border-[#333] font-mono text-[#666] dark:text-[#888]">
                      esc
                    </kbd>
                    <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">close</span>
                  </div>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
