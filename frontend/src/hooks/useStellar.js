import { create } from 'zustand';
import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { WalletConnectModule } from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';

export const useStellarStore = create((set) => ({
  address: null,
  balance: null,
  kit: null,
  network: Networks.TESTNET,
  isConnecting: false,
  error: null,
  isWalletModalOpen: false,
  profileName: null,
  theme: 'dark',

  setAddress: (address) => set({ address }),
  setBalance: (balance) => set({ balance }),
  setKit: (kit) => set({ kit }),
  setError: (error) => set({ error }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setWalletModalOpen: (isOpen) => set({ isWalletModalOpen: isOpen }),
  setProfileName: (name) => set({ profileName: name }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }))
}));

let kitInstance = null;

export const initializeStellarKit = () => {
  if (!kitInstance) {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      selectedWalletId: 'freighter',
      modules: [
        new FreighterModule(),
        new AlbedoModule(),
        new xBullModule(),
        new WalletConnectModule({
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'e3f7e8c5a0b4d6f8a2c4e6f8a0b2d4f6',
        }),
      ],
    });
    kitInstance = StellarWalletsKit;
    useStellarStore.getState().setKit(StellarWalletsKit);
  }
  return kitInstance;
};
