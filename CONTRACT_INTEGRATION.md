# Contract–Frontend Integration Mapping

## Network & Contract

| Property | Value |
|----------|-------|
| Network | **Testnet** (`Test SDF Network ; September 2015`) |
| Contract ID | `CAG5MXEQORC4ZP57WI4WJVXWHP5CZHXXMA77VV63JVSW42GNMJYAMUCJ` |
| RPC URL | `https://soroban-testnet.stellar.org` |

## SDK

`@stellar/stellar-sdk` v16 is used throughout `frontend/src/services/soroban.js`.

**Imported APIs:**
```
Contract, nativeToScVal, scValToNative, rpc, TransactionBuilder,
Networks, BASE_FEE, Account, Operation, Asset
```

**Usage pattern:**
- **Reads** (`get_pool`, `get_pool_expenses`, `get_expense`): `simulateCall(publicKey, method, args)` → builds a `TransactionBuilder` with `contract.call(method, ...scValArgs)`, simulates, parses `scValToNative`.
- **Writes** (`create_pool`, `log_expense`, `verify_balance`): `buildAndSubmit(publicKey, kit, method, args)` → simulates → `rpc.assembleTransaction` → `kit.signTransaction` → submits → polls for success.

---

## Function Mapping

### 1. `create_pool`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:84`) | `fn create_pool(env: Env, name: String, creator: Address) -> Pool` |
| **ScVal** (`soroban.js:45`) | `nativeToScVal(args.name, { type: 'string' })`, `nativeToScVal(args.creator, { type: 'address' })` |
| **Frontend call** | `buildAndSubmit(address, kit, 'create_pool', { name, creator })` |
| **Called from** | `Dashboard.jsx:312` — create pool form submit handler |
| **Parser** (`soroban.js:77`) | `parseNative('create_pool')` → `{ id, name, creator, total_expenses, created_at }` |
| **Event** | `PoolCreatedEvent { pool_id, name, creator }` |

### 2. `get_pool`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:119`) | `fn get_pool(env: Env, pool_id: u64) -> Option<Pool>` |
| **ScVal** (`soroban.js:57`) | `nativeToScVal(BigInt(args.poolId), { type: 'u64' })` |
| **Frontend call** | `simulateCall(address, 'get_pool', { poolId })` |
| **Called from** | `Dashboard.jsx:57` — `fetchPoolById()`, `Dashboard.jsx:72` — pool discovery scan |
| **Parser** (`soroban.js:77`) | `parseNative('get_pool')` → `{ id, name, creator, total_expenses, created_at }` |

### 3. `log_expense`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:124`) | `fn log_expense(env: Env, pool_id: u64, description: String, amount: i128, payer: Address) -> Result<Expense, ContractError>` |
| **ScVal** (`soroban.js:50`) | `[nativeToScVal(BigInt(args.poolId), 'u64'), nativeToScVal(args.description, 'string'), nativeToScVal(BigInt(args.amount), 'i128'), nativeToScVal(args.payer, 'address')]` |
| **Frontend call** | `buildAndSubmit(address, kit, 'log_expense', { poolId, description, amount, payer })` |
| **Called from** | `ExpenseLogger.jsx:65` — expense form submit handler |
| **Parser** (`soroban.js:108`) | `parseNative('log_expense')` → `{ id, pool_id, description, amount, payer, created_at }` |
| **Event** | `ExpenseLoggedEvent { expense_id, pool_id, description, amount, payer }` |

### 4. `get_pool_expenses`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:199`) | `fn get_pool_expenses(env: Env, pool_id: u64) -> Vec<Expense>` |
| **ScVal** (`soroban.js:57`) | `nativeToScVal(BigInt(args.poolId), { type: 'u64' })` |
| **Frontend call** | `simulateCall(address, 'get_pool_expenses', { poolId })` |
| **Called from** | `ExpenseLogger.jsx:30` — `fetchExpenses()`, polls every 8s |
| **Parser** (`soroban.js:88`) | `parseNative('get_pool_expenses')` → `[{ id, pool_id, description, amount, payer, created_at }]` |

### 5. `get_expense`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:207`) | `fn get_expense(env: Env, expense_id: u64) -> Option<Expense>` |
| **ScVal** (`soroban.js:60`) | `nativeToScVal(BigInt(args.expenseId), { type: 'u64' })` |
| **Frontend call** | `simulateCall(address, 'get_expense', { expenseId })` |
| **Parser** (`soroban.js:97`) | `parseNative('get_expense')` → `{ id, pool_id, description, amount, payer, created_at }` |

### 6. `verify_balance`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:184`) | `fn verify_balance(env: Env, token_id: Address, owner: Address, required: i128) -> Result<bool, ContractError>` |
| **ScVal** (`soroban.js:62`) | `[nativeToScVal(args.tokenId, 'address'), nativeToScVal(args.owner, 'address'), nativeToScVal(BigInt(args.required), 'i128')]` |
| **Frontend call** | `simulateCall(address, 'verify_balance', { tokenId, owner, required })` |
| **Purpose** | Inter-contract balance verification (cross-contract invocation) |

---

## Parameter Type Alignment

| Contract Type | ScVal Type | JS Type |
|--------------|------------|---------|
| `u64` | `{ type: 'u64' }` | `BigInt(number)` |
| `i128` | `{ type: 'i128' }` | `BigInt(number)` |
| `String` | `{ type: 'string' }` | `string` |
| `Address` | `{ type: 'address' }` | `string` (G-prefixed) |

---

## Error Codes

| Code | Contract Constant | Frontend Handling |
|------|------------------|-------------------|
| 1 | `PoolNotFound` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 2 | `NotPoolCreator` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 3 | `InsufficientBalance` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 4 | `AmountZero` | Validated in `ExpenseLogger.jsx:56` before submission |

---

## Events

| Event | Topic Fields | Emitted By |
|-------|-------------|------------|
| `PoolCreatedEvent` | `pool_id, name, creator` | `create_pool()` |
| `ExpenseLoggedEvent` | `expense_id, pool_id, description, amount, payer` | `log_expense()` |

Events are polled in `Dashboard.jsx:97` (`pollEvents()` via `fetchEvents`/`convertEventTopics`) at 10-second intervals.

---

## File Reference

| File | Role |
|------|------|
| `contracts/expense-pool/src/lib.rs` | Smart contract (6 functions + 2 events + 14 tests) |
| `frontend/src/services/soroban.js` | Soroban RPC layer (simulate, build/submit, parse) |
| `frontend/src/hooks/useStellar.js` | Zustand store + wallet kit initialization |
| `frontend/src/services/db.js` | Supabase/localStorage persistence layer |
| `frontend/src/services/analytics.js` | Event tracking (localStorage + Supabase) |
| `frontend/src/pages/Dashboard.jsx` | Pool creation, discovery, join/approve UI |
| `frontend/src/components/ExpenseLogger.jsx` | Expense logging form + ledger display |
| `frontend/src/components/SettleUp.jsx` | Balance calculator + on-chain XLM settlement |
| `frontend/src/services/toast.js` | Toast notification system |
