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
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  disconnect: () => {
    if (kitInstance) {
      kitInstance.disconnect().catch(() => {});
    }
    set({ address: null, balance: null, profileName: null, error: null });
  },
}));

export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

let kitInstance = null;

export const initializeStellarKit = () => {
  if (!kitInstance) {
    const modules = [
      new FreighterModule(),
      new AlbedoModule(),
      new xBullModule(),
    ];

    if (WALLETCONNECT_PROJECT_ID) {
      modules.push(new WalletConnectModule({
        projectId: WALLETCONNECT_PROJECT_ID,
        allowedChains: ['stellar:testnet'],
        metadata: {
          name: 'SplitStellar',
          description: 'Split expenses with friends on the Stellar network',
          url: 'https://splitstellar.vercel.app',
          icons: ['https://splitstellar.vercel.app/favicon.ico'],
        },
      }));
    }

    StellarWalletsKit.init({
      network: Networks.TESTNET,
      selectedWalletId: 'freighter',
      modules,
    });
    kitInstance = StellarWalletsKit;
    useStellarStore.getState().setKit(StellarWalletsKit);
  }
  return kitInstance;
};

export const hydrateWalletSession = async () => {
  try {
    const kit = StellarWalletsKit;
    const { address } = await kit.getAddress();
    if (address) {
      useStellarStore.getState().setAddress(address);
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (res.ok) {
        const data = await res.json();
        const nativeBalance = data.balances?.find((b) => b.asset_type === 'native')?.balance;
        useStellarStore.getState().setBalance(nativeBalance || '0');
      }
    }
  } catch (_) {
    // No wallet was previously connected
  }
};
