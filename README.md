# SplitStellar

Decentralized expense splitting on the Stellar network using Soroban smart contracts.

## Architecture

```
stellar-project/
├── contracts/
│   └── expense-pool/         # Soroban smart contract (Rust)
│       └── src/
│           ├── lib.rs    # 6 exported functions + events
│           └── test.rs   # 14 tests
├── frontend/                  # React + Vite + Tailwind v4
│   └── src/
│       ├── components/        # WalletModal, ExpenseLogger, Toast, etc.
│       ├── hooks/             # useStellar (Zustand store + wallet kit)
│       ├── pages/             # Dashboard, Profile, Landing
│       └── services/          # db.js (Supabase + localStorage fallback), toast.js
├── scripts/
│   └── deploy.sh              # Contract deployment to testnet/mainnet
├── .github/workflows/ci.yml   # GitHub Actions: test, lint, build, deploy
├── Makefile                    # Common commands
└── .env.example
```

## Quick Start

```bash
# Install dependencies
make setup

# Start dev server
make dev

# Run all tests
make test
```

## Smart Contract

**Deployed on Testnet:** `CAG5MXEQORC4ZP57WI4WJVXWHP5CZHXXMA77VV63JVSW42GNMJYAMUCJ`

### Functions

| Function | Description | Events |
|----------|-------------|--------|
| `create_pool` | Create a new expense pool | `PoolCreated` |
| `get_pool` | Read pool by ID | — |
| `log_expense` | Log an expense in a pool | `ExpenseLogged` |
| `get_pool_expenses` | List all expenses in a pool | — |
| `get_expense` | Get a single expense by ID | — |
| `verify_balance` | Inter-contract call: check token balance | — |

### Events

- **PoolCreated** — emitted when `create_pool` succeeds
- **ExpenseLogged** — emitted when `log_expense` succeeds

### Error Codes

| Code | Error |
|------|-------|
| 1 | PoolNotFound |
| 2 | NotPoolCreator |
| 3 | InsufficientBalance |
| 4 | AmountZero |

### Inter-Contract Communication

`verify_balance` calls the standard Stellar token interface (`balance` entry point) to check whether an address holds sufficient tokens.

### Tests

```bash
# Contract tests (14 tests)
cd contracts/expense-pool && cargo test

# Frontend tests (13 tests)
cd frontend && npx vitest run

# All tests
make test
```

## Frontend

- **Stack:** React 19, Vite 8, Tailwind v4, Zustand, Framer Motion
- **Wallet:** Freighter, Albedo, xBull, WalletConnect via `@creit.tech/stellar-wallets-kit`
- **Build:** `npx vite build`

## Deployment

### Contract

```bash
# Deploy to testnet (default)
./scripts/deploy.sh

# Deploy to mainnet
./scripts/deploy.sh mainnet
```

### Frontend

Auto-deployed to GitHub Pages via CI (`main` branch).

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. **Contract** — `cargo fmt --check`, `cargo clippy`, `cargo test`
2. **Frontend** — `npm run lint`, `vitest run`, `vite build`
3. **Deploy** — GitHub Pages (on `main` push)

## Environment Variables

Copy `.env.example` to `frontend/.env`:

```env
VITE_SOROBAN_CONTRACT_ID=CAG5MXEQORC4ZP57WI4WJVXWHP5CZHXXMA77VV63JVSW42GNMJYAMUCJ
VITE_STELLAR_NETWORK=testnet
VITE_SUPABASE_URL=           # optional, mock fallback used when blank
VITE_SUPABASE_ANON_KEY=      # optional
```
