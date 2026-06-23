# SplitStellar
> The standard for decentralized settlement.

SplitStellar is an award-winning, Awwwards-caliber frontend application built to interface with Soroban smart contracts on the Stellar network. It provides a stark, architectural interface for managing cross-border shared expenses with cryptographic certainty and sub-second finality.

![Landing Page](./docs/landing-dark.png) *(Insert Dark Mode Landing Screenshot here)*

---

## 🏛 Architectural Purity

SplitStellar abandons the generic "Web3 neon" aesthetic in favor of **High-Contrast Editorial Precision**. 
- **Typography Tension**: We pair the luxurious `Playfair Display` serif with the raw, technical `Space Mono` to create an interface that feels like a high-end financial product rather than a startup template.
- **Strict Grids**: No tilted cards or floating gradients. The interface relies entirely on $1px$ hairline borders and perfect alignment to represent immutable ledger data.
- **Motion Physics**: Powered by Framer Motion and `@studio-freight/lenis`, every scroll, hover, and page transition operates on heavy, expensive feeling custom spring physics.

## ⚙️ Tech Stack

- **Frontend Framework**: React + Vite
- **Styling**: Tailwind CSS v4 (Strict Monochrome Palette)
- **Motion**: Framer Motion & Lenis Smooth Scroll
- **State Management**: Zustand
- **Web3 Integration**: `@creit.tech/stellar-wallets-kit` & `@stellar/stellar-sdk`
- **Database**: Supabase (PostgreSQL)

---

## 🚀 Features

1. **Decentralized Settlement on Soroban**
   - Seamlessly connect Freighter, Albedo, or xBull wallets.
   - Initialize expense partitions (pools) stored directly on the ledger.
   - Execute Rust-based smart contracts to simplify complex debt structures.

2. **The Ledger Interface**
   - A dedicated `/profile` and `/dashboard` built to mimic architectural blueprints.
   - Live synchronization of Testnet XLM balances.
   - View immutable transaction hashes with extreme clarity.

3. **Flawless Light / Dark Physics**
   - A perfectly engineered theme system that inverts the entire application between "Pitch Black" and "Stark White" in a seamless `500ms` transition.

---

## 🛠 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/splitstellar.git
   cd splitstellar/frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_SOROBAN_CONTRACT_ID=your_deployed_contract_id_here
   VITE_STELLAR_NETWORK=TESTNET
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

## 📸 Gallery

| Dark Mode | Light Mode |
| :---: | :---: |
| ![Dashboard Dark](./docs/dashboard-dark.png) | ![Dashboard Light](./docs/dashboard-light.png) |
| ![Profile Dark](./docs/profile-dark.png) | ![Profile Light](./docs/profile-light.png) |
| ![Wallet Modal](./docs/wallet-modal.png) | ![Loader](./docs/loader.png) |

---
*Engineered for scale. Built on Stellar.*
