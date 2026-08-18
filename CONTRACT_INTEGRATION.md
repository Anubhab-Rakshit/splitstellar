# Contract–Frontend Integration Mapping

## Network & Contract

| Property | Value |
|----------|-------|
| Network | **Testnet** (`Test SDF Network ; September 2015`) |
| Contract ID | `CDEQF4RFNEXOH2JCI3QGPGBNCZQMRWUQACW522L6OPMSRVT4EBQUNTHJ` |
| RPC URL | `https://soroban-testnet.stellar.org` |

## SDK

`@stellar/stellar-sdk` v16 is used throughout `frontend/src/services/soroban.js`.

**Imported APIs:**
```
Contract, nativeToScVal, scValToNative, rpc, TransactionBuilder,
Networks, BASE_FEE, Account, Operation, Asset
```

**Usage pattern:**
- **Reads** (`get_pool`, `get_pool_expenses`, `get_expense`, `is_pool_member`): `simulateCall(publicKey, method, args)` → builds a `TransactionBuilder` with `contract.call(method, ...scValArgs)`, simulates, parses `scValToNative`.
- **Writes** (`create_pool`, `log_expense`, `add_pool_member`, `verify_balance`): `buildAndSubmit(publicKey, kit, method, args)` → simulates → `rpc.assembleTransaction` → `kit.signTransaction` → submits → polls for success.

---

## Function Mapping

### 1. `create_pool`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:97`) | `fn create_pool(env: Env, name: String, creator: Address) -> Pool` |
| **ScVal** (`soroban.js:45`) | `nativeToScVal(args.name, { type: 'string' })`, `nativeToScVal(args.creator, { type: 'address' })` |
| **Frontend call** | `buildAndSubmit(address, kit, 'create_pool', { name, creator })` |
| **Called from** | `Dashboard.jsx:323` — create pool form submit handler |
| **Parser** (`soroban.js:77`) | `parseNative('create_pool')` → `{ id, name, creator, total_expenses, created_at, member_count }` |
| **Event** | `PoolCreatedEvent { pool_id, name, creator }` |
| **Validation** | Pool name: 1-64 characters |

### 2. `get_pool`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:145`) | `fn get_pool(env: Env, pool_id: u64) -> Option<Pool>` |
| **ScVal** (`soroban.js:57`) | `nativeToScVal(BigInt(args.poolId), { type: 'u64' })` |
| **Frontend call** | `simulateCall(address, 'get_pool', { poolId })` |
| **Called from** | `Dashboard.jsx:56` — `fetchPoolById()`, `Dashboard.jsx:88` — pool discovery scan |
| **Parser** (`soroban.js:77`) | `parseNative('get_pool')` → `{ id, name, creator, total_expenses, created_at, member_count }` |

### 3. `is_pool_member`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:150`) | `fn is_pool_member(env: Env, pool_id: u64, member: Address) -> bool` |
| **ScVal** (`soroban.js`) | `[nativeToScVal(BigInt(args.poolId), { type: 'u64' }), nativeToScVal(args.member, { type: 'address' })]` |
| **Frontend call** | `simulateCall(address, 'is_pool_member', { poolId, member })` |
| **Purpose** | Check if an address is authorized to log expenses in a pool |

### 4. `add_pool_member`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:158`) | `fn add_pool_member(env: Env, pool_id: u64, caller: Address, new_member: Address)` |
| **ScVal** (`soroban.js`) | `[nativeToScVal(BigInt(args.poolId), { type: 'u64' }), nativeToScVal(args.caller, { type: 'address' }), nativeToScVal(args.newMember, { type: 'address' })]` |
| **Frontend call** | `buildAndSubmit(address, kit, 'add_pool_member', { poolId, caller, newMember })` |
| **Authorization** | Only pool creator can add members |

### 5. `log_expense`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:193`) | `fn log_expense(env: Env, pool_id: u64, description: String, amount: i128, payer: Address) -> Result<Expense, ContractError>` |
| **ScVal** (`soroban.js:50`) | `[nativeToScVal(BigInt(args.poolId), 'u64'), nativeToScVal(args.description, 'string'), nativeToScVal(BigInt(args.amount), 'i128'), nativeToScVal(args.payer, 'address')]` |
| **Frontend call** | `buildAndSubmit(address, kit, 'log_expense', { poolId, description, amount, payer })` |
| **Called from** | `ExpenseLogger.jsx:205` — expense form submit handler |
| **Parser** (`soroban.js:108`) | `parseNative('log_expense')` → `{ id, pool_id, description, amount, payer, created_at }` |
| **Event** | `ExpenseLoggedEvent { expense_id, pool_id, description, amount, payer }` |
| **Validation** | Description: 1-128 characters, Amount: >0, Payer must be pool member |

### 6. `get_pool_expenses`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:261`) | `fn get_pool_expenses(env: Env, pool_id: u64) -> Vec<Expense>` |
| **ScVal** (`soroban.js:57`) | `nativeToScVal(BigInt(args.poolId), { type: 'u64' })` |
| **Frontend call** | `simulateCall(address, 'get_pool_expenses', { poolId })` |
| **Called from** | `ExpenseLogger.jsx:66` — `fetchExpensesWithRetry()`, visibility-based polling (6s visible / 30s hidden) |
| **Parser** (`soroban.js:88`) | `parseNative('get_pool_expenses')` → `[{ id, pool_id, description, amount, payer, created_at }]` |

### 7. `get_expense`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:269`) | `fn get_expense(env: Env, expense_id: u64) -> Option<Expense>` |
| **ScVal** (`soroban.js:60`) | `nativeToScVal(BigInt(args.expenseId), { type: 'u64' })` |
| **Frontend call** | `simulateCall(address, 'get_expense', { expenseId })` |
| **Parser** (`soroban.js:97`) | `parseNative('get_expense')` → `{ id, pool_id, description, amount, payer, created_at }` |

### 8. `verify_balance`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:277`) | `fn verify_balance(env: Env, token_id: Address, owner: Address, required: i128) -> Result<bool, ContractError>` |
| **ScVal** (`soroban.js:62`) | `[nativeToScVal(args.tokenId, 'address'), nativeToScVal(args.owner, 'address'), nativeToScVal(BigInt(args.required), 'i128')]` |
| **Frontend call** | `simulateCall(address, 'verify_balance', { tokenId, owner, required })` |
| **Purpose** | Inter-contract balance verification (cross-contract invocation) |

### 9. `get_pool_members`

| Layer | Detail |
|-------|--------|
| **Contract** (`lib.rs:307`) | `fn get_pool_members(env: Env, pool_id: u64) -> Vec<Address>` |
| **ScVal** | Return value parsed as an array of `address` strings |
| **Frontend call** | Not invoked by the frontend; membership UI reads `db.getPoolMembers` (Supabase), while on-chain membership is enforced via `add_pool_member` + `is_pool_member` and tracked by `Pool.member_count` |
| **Purpose** | Read-only membership listing API (reserved for future batch operations) |

---

## Parameter Type Alignment

| Contract Type | ScVal Type | JS Type |
|--------------|------------|---------|
| `u64` | `{ type: 'u64' }` | `BigInt(number)` |
| `i128` | `{ type: 'i128' }` | `BigInt(number)` |
| `String` | `{ type: 'string' }` | `string` |
| `Address` | `{ type: 'address' }` | `string` (G-prefixed) |
| `bool` | `{ type: 'bool' }` | `boolean` |

---

## Error Codes

| Code | Contract Constant | Frontend Handling |
|------|------------------|-------------------|
| 1 | `PoolNotFound` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 2 | `NotPoolCreator` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 3 | `InsufficientBalance` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 4 | `AmountZero` | Validated in `ExpenseLogger.jsx:160` before submission |
| 5 | `NotPoolMember` | Caught in `simulateCall`/`buildAndSubmit` try/catch |
| 6 | `PoolNameTooLong` | Validated in `Dashboard.jsx:316` before submission (max 64 chars) |
| 7 | `DescriptionTooLong` | Validated in `ExpenseLogger.jsx:160` before submission (max 128 chars) |
| 8 | `PoolFull` | Caught in `simulateCall`/`buildAndSubmit` try/catch (max 1000 expenses) |
| 9 | `Unauthorized` | Caught in `simulateCall`/`buildAndSubmit` try/catch |

---

## Events

| Event | Topic Fields | Emitted By |
|-------|-------------|------------|
| `PoolCreatedEvent` | `pool_id, name, creator` | `create_pool()` |
| `ExpenseLoggedEvent` | `expense_id, pool_id, description, amount, payer` | `log_expense()` |

Events are polled in `Dashboard.jsx:98` (`pollEvents()` via `fetchEvents`/`convertEventTopics`) at 12-second intervals.

## Recent Additions (Level 6+)

| Feature | Location |
|---------|----------|
| Expense categories (20 presets) | `frontend/src/services/categories.js` |
| Smart split types (equal/percentage/exact/shares) | `ExpenseLogger.jsx` split-type dropdown |
| Expense notes + undo/redo (last 5) | `ExpenseLogger.jsx` |
| Currency selector (XLM/USDC/EURC, stroop storage) | `frontend/src/services/currency.js` |
| CSV / HTML report export (XSS + formula-injection escaped) | `frontend/src/services/export.js` |
| Real-time collab via visibility polling | `ExpenseLogger.jsx:111-149` |
| Smart settlement (min-tx optimization) | `SettleUp.jsx` |
| Spending insights / badges / member profiles | `frontend/src/services/badges.js`, `SpendingInsights.jsx`, `MemberProfile.jsx` |
| Command palette (⌘K, cmdk + fuse.js) | `frontend/src/components/CommandPalette.jsx` |
| Premium animations | `frontend/src/services/animations.js` |
| Pool invite-link persistence + Web Share API | `Dashboard.jsx` (`pendingCodeRef`, `getShareLink`) |
| Supabase helpers: `getPoolMembers`, `cacheExpenses`, `getCachedExpenses` | `frontend/src/services/db.js` |

---

## Security Features (Level 5)

### Input Validation
- **Pool name**: 1-64 characters, sanitized (no `<` or `>` characters)
- **Expense description**: 1-128 characters, sanitized
- **Amount**: Must be positive, max 1 billion XLM
- **Invite code**: 8 alphanumeric characters, uppercase only

### Access Control
- **Pool membership**: Only pool members can log expenses
- **Member management**: Only pool creator can add members
- **Join requests**: Owner approval required for new members

### Rate Limiting
- **Ledger polling**: 6-second intervals when the tab is visible, 30 seconds when hidden (`ExpenseLogger.jsx`)
- **Event polling**: 12-second intervals (`POLL_MS` in `Dashboard.jsx:12`)
- **Manual retry**: Up to 3 retries with exponential backoff for failed loads

---

## File Reference

| File | Role |
|------|------|
| `contracts/expense-pool/src/lib.rs` | Smart contract (9 functions + 2 events + 20 tests) |
| `contracts/expense-pool/src/test.rs` | Unit tests for all contract functions |
| `frontend/src/services/soroban.js` | Soroban RPC layer (simulate, build/submit, parse) |
| `frontend/src/hooks/useStellar.js` | Zustand store + wallet kit initialization |
| `frontend/src/services/db.js` | Supabase/localStorage persistence layer |
| `frontend/src/services/analytics.js` | Event tracking (localStorage + Supabase) |
| `frontend/src/pages/Dashboard.jsx` | Pool creation, discovery, join/approve UI |
| `frontend/src/components/ExpenseLogger.jsx` | Expense logging form + ledger display |
| `frontend/src/components/SettleUp.jsx` | Balance calculator + on-chain XLM settlement |
| `frontend/src/pages/Guide.jsx` | User guide and documentation |
| `frontend/src/services/toast.js` | Toast notification system |
