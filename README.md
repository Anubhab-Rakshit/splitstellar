# SplitStellar

Decentralized expense splitting on the Stellar network powered by Soroban smart contracts. Create expense pools, log transactions on-chain, and track settlements — all directly from your wallet.

**Live demo:** [splitstellar.vercel.app](https://splitstellar.vercel.app/)

---

## Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-00D4AA?style=for-the-badge&logo=stellar&logoColor=white)
![Stellar](https://img.shields.io/badge/Stellar-0C0E4F?style=for-the-badge&logo=stellar&logoColor=white)

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

---

## Screenshots

### Desktop

<img width="1510" alt="Landing" src="https://github.com/user-attachments/assets/06530e58-2bd3-4d43-8623-1b825ba32df2" />

<img width="1354" alt="Dashboard" src="https://github.com/user-attachments/assets/9373f94d-094d-48ad-bd6c-b56ce270a199" />

### Mobile

<img width="300" alt="Mobile" src="https://github.com/user-attachments/assets/7241b794-0b45-48b2-be29-573472bd54cf" />

---

## Project Structure

```
stellar-project/
├── contracts/
│   └── expense-pool/              # Soroban smart contract (Rust)
│       └── src/
│           ├── lib.rs              # 6 exported functions + contract events
│           └── test.rs             # 14 unit tests
├── frontend/
│   └── src/
│       ├── components/             # WalletModal, ExpenseLogger, Toast, etc.
│       ├── hooks/                  # useStellar (Zustand store + wallet kit)
│       ├── pages/                  # Landing, Dashboard, Profile
│       └── services/               # SorobanRPC client, Toast, DB
├── scripts/
│   └── deploy.sh                   # Contract deployment (testnet/mainnet)
├── .github/workflows/ci.yml        # CI/CD pipeline
└── vercel.json                     # Vercel deployment config
```

---

## Smart Contract

**Deployed on Testnet:** [`CAG5MXEQORC4ZP57WI4WJVXWHP5CZHXXMA77VV63JVSW42GNMJYAMUCJ`](https://stellar.expert/explorer/testnet/contract/CAG5MXEQORC4ZP57WI4WJVXWHP5CZHXXMA77VV63JVSW42GNMJYAMUCJ)

### Functions

| Function | Description |
|----------|-------------|
| `create_pool(name, creator)` | Create a new expense pool |
| `get_pool(pool_id)` | Read pool details by ID |
| `log_expense(pool_id, description, amount, payer)` | Log an expense in a pool |
| `get_pool_expenses(pool_id)` | List all expenses in a pool |
| `get_expense(expense_id)` | Get a single expense by ID |
| `verify_balance(address, amount)` | Inter-contract balance check |

### Error Codes

| Code | Error |
|------|-------|
| 1 | `PoolNotFound` |
| 2 | `NotPoolCreator` |
| 3 | `InsufficientBalance` |
| 4 | `AmountZero` |

### Inter-Contract Communication

`verify_balance` calls the standard Stellar token interface (`balance` entry point) to verify an address holds sufficient tokens — demonstrating cross-contract invocation on Soroban.

---

## On-Chain Transactions

All pool and expense data lives on the Stellar testnet. Below are verified transactions from real usage:

### 1. Pool Creation — "Manali Trip 2026"

```
create_pool("Manali Trip 2026", GBYX...GUSN)
```

| Field | Value |
|-------|-------|
| **ID** | `1` |
| **Creator** | `GBYXCRSBELNKB6EURZ4U4YF6NGZQRUND24R6XE2DRZ2GUSN` |
| **Created At** | `1782203503` |
| **Tx Hash** | [`d41147ddbc0f59a64c56cbe536f279bb95644e9e1ff6debad060600d06e3c443`](https://stellar.expert/explorer/testnet/tx/13906859291381760) |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/13906859291381760#13906859291381761) |

### 2. Expense Logged — "Bus Booking"

```
log_expense(1, "Bus Booking", 5000000, GBYX...GUSN)
```

| Field | Value |
|-------|-------|
| **Pool** | `1` (Manali Trip 2026) |
| **Amount** | `5,000,000` stroops (`0.5 XLM`) |
| **Description** | `Bus Booking` |
| **Payer** | `GBYXCRSBELNKB6EURZ4U4YF6NGZQRUND24R6XE2DRZ2GUSN` |
| **Tx Hash** | [`3f7571a65d320277470e006e885bed111588892854c732e1f802de9fbc178687`](https://stellar.expert/explorer/testnet/tx/13906897946091520) |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/13906897946091520#13906897946091521) |

### 3. Expense Logged — "Hotel Booking"

```
log_expense(1, "Hotel Booking", 10000000, GBYX...GUSN)
```

| Field | Value |
|-------|-------|
| **Pool** | `1` (Manali Trip 2026) |
| **Amount** | `10,000,000` stroops (`1 XLM`) |
| **Description** | `Hotel Booking` |
| **Payer** | `GBYXCRSBELNKB6EURZ4U4YF6NGZQRUND24R6XE2DRZ2GUSN` |
| **Tx Hash** | [`fb9f80e7d2d00b65e0579adc47fa4998b35fcbaec0850e7f2680caef1f9a9104`](https://stellar.expert/explorer/testnet/tx/13907207183691776) |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/13907207183691776#13907207183691777) |

---

## Running Locally

```bash
# Clone and install
git clone https://github.com/Anubhab-Rakshit/splitstellar.git
make setup

# Start dev server
make dev

# Run all tests
make test
```

### Prerequisites

- Node.js 22+
- Rust (stable) with `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) v27+
- Freighter browser extension (for wallet interaction)

### Environment

Copy `.env.example` to `frontend/.env`:

```env
VITE_SOROBAN_CONTRACT_ID=CAG5MXEQORC4ZP57WI4WJVXWHP5CZHXXMA77VV63JVSW42GNMJYAMUCJ
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK=testnet
VITE_SUPABASE_URL=              # optional — falls back to localStorage
VITE_SUPABASE_ANON_KEY=         # optional
```

---

## Testing

```bash
# Contract (Rust) — 14 tests
cd contracts/expense-pool && cargo test

# Frontend (Vitest) — 13 tests
cd frontend && npx vitest run

# All at once
make test
```

---

## Deployment

### Contract

```bash
# Testnet (default)
./scripts/deploy.sh

# Mainnet
./scripts/deploy.sh mainnet
```

### Frontend

Auto-deployed to [Vercel](https://vercel.com) via GitHub integration. Every push to `main` triggers build and deploy.

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Contract** — `cargo fmt --check`, `cargo clippy`, `cargo test`
2. **Frontend** — `eslint`, `vitest run`, `vite build`
3. **Deploy** — to Vercel on `main` push

---

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser │◄───►│  Vite + React │◄───►│ Soroban RPC  │
│ (Wallet) │     │  (Vercel)    │     │  (Testnet)   │
└──────────┘     └──────┬───────┘     └──────┬────────┘
                        │                    │
                        ▼                    ▼
                 ┌────────────┐     ┌──────────────┐
                 │  Supabase  │     │  Soroban     │
                 │ (Profiles, │     │  Contract    │
                 │  Activity) │     │  (Rust)      │
                 └────────────┘     └──────────────┘
```

- **Frontend** — React SPA with Zustand state, Tailwind CSS, Framer Motion
- **Wallet** — Freighter / Albedo / xBull via `@creit.tech/stellar-wallets-kit`
- **Contract** — Rust Soroban smart contract deployed on testnet
- **Events** — Real-time polling (8–10s intervals) for pool discovery
- **Persistence** — Pool IDs in `localStorage`, profiles/activity in Supabase
- **CI/CD** — GitHub Actions → lint, test, build → Vercel deploy

---

Built with ❤️ for the Stellar ecosystem.
