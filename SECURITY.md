# SplitStellar Security Checklist

This checklist records security controls verified against the current source tree. It is implementation evidence for the production testnet MVP; it is not a substitute for an independent security audit or a mainnet readiness review.

## Scope

- Web client: `frontend/src/**`
- Soroban contract: `contracts/expense-pool/src/lib.rs`
- Supabase migrations: `supabase/migrations/**`
- Deployment and CI: `scripts/deploy.sh`, `.github/workflows/ci.yml`
- Configuration hygiene: `.gitignore`, `.env.example`

**SplitStellar has no backend server.** The architecture is a client-side React SPA that communicates directly with Stellar Horizon RPC, Stellar Soroban RPC, and Supabase (using a public anon key). Wallet signing is handled by browser extensions (Freighter, Albedo, xBull) or WalletConnect. This fundamentally limits the server-side attack surface but shifts security responsibility to the smart contract, Supabase Row Level Security, and client-side validation.

## Current testnet controls

| Control | Status | Implementation evidence |
|---------|--------|------------------------|
| Wallet-based authentication | Implemented | `@creit.tech/stellar-wallets-kit` connects to Freighter, Albedo, xBull, or WalletConnect. No passwords, no server sessions, no JWTs. Address is the sole identity. |
| Contract write authorization | Implemented | `require_auth()` enforced on `create_pool` (lib.rs:98), `add_pool_member` (lib.rs:157), and `log_expense` (lib.rs:202). No unsigned state transitions. |
| Creator-only pool management | Implemented | `add_pool_member` checks `pool.creator != caller` (lib.rs:166) and returns error for non-creators. |
| Member-only expense logging | Implemented | `log_expense` verifies `is_pool_member` (lib.rs:226-233) before allowing expense writes. |
| Pool name length validation | Implemented | `MAX_POOL_NAME_LEN = 64` enforced on-chain (lib.rs:8, 101-103). Client-side: `sanitizeInput()` + length check (Dashboard.jsx:307-318). |
| Expense description validation | Implemented | `MAX_DESCRIPTION_LEN = 128` enforced on-chain (lib.rs:9, 210-212). Client-side: `sanitizeInput()` + length check (ExpenseLogger.jsx:173-184). |
| Expense amount validation | Implemented | On-chain: `amount <= 0` returns `ContractError::AmountZero` (lib.rs:205-207). Client-side: NaN, `<=0`, `!isFinite`, max 1B XLM checks (ExpenseLogger.jsx:187-204). |
| Pool expense cap | Implemented | `MAX_EXPENSES_PER_POOL = 1000` enforced on-chain (lib.rs:10, 221-223). Prevents unbounded storage growth. |
| Overflow protection | Implemented | `overflow-checks = true` in release profile (Cargo.toml:19). Arithmetic overflow panics in debug and release. |
| Client-side input sanitization | Implemented | `sanitizeInput()` strips `<>` characters (ExpenseLogger.jsx:173-175, Dashboard.jsx:307-309). Applied to pool names, expense descriptions, and notes. |
| CSV injection prevention | Implemented | `escapeHtml()` escapes special characters; cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prefixed with `'` (export.js:31-33). |
| HTML escaping in exports | Implemented | `escapeHtml()` applied to all user data in HTML-based PDF report generation (export.js:21-28, 111, 128, 167-170). |
| Environment variable hygiene | Implemented | Root `.gitignore` covers `.env` (line 4). `.env.example` committed with placeholder values only. Live `.env` is not tracked by git. |
| No hardcoded secrets | Implemented | Deploy script uses local `stellar` CLI identity (`splitstellar-deployer`), not hardcoded keys (deploy.sh:9). No private keys or seeds in any source file. |
| CI contract checks | Implemented | `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` (ci.yml:30-40). |
| CI frontend checks | Implemented | `eslint`, `vitest run`, `vite build` (ci.yml:60-67). |
| React XSS protection | Implemented | No `dangerouslySetInnerHTML`, `eval()`, or `Function()` anywhere in the codebase. React auto-escapes all `{expression}` text nodes. |
| Activity logging | Implemented | `console.error` / `console.warn` used for error reporting in browser console. Analytics events written to Supabase and localStorage. |
| Cryptographically secure invite codes | Implemented | `generateInviteCode()` uses `crypto.getRandomValues()` (db.js:65-70) instead of `Math.random()`. 8-char codes from 31-character alphabet. |
| CI dependency auditing | Implemented | `npm audit --omit=dev --audit-level=high` (ci.yml:61) and `cargo audit` (ci.yml:44-47) run on every push and PR. |
| Server-side Supabase validation | Implemented | Database triggers enforce input validation on all tables: profiles, expenses, pool_members, join_requests, expense_pools, activities, analytics_events (`supabase/migrations/001_server_side_validation.sql`). |

## Authentication and authorization

### Wallet-based identity

SplitStellar uses wallet addresses as the sole form of identity. There are no passwords, no server-side sessions, and no JWT tokens.

- `frontend/src/hooks/useStellar.js:11-36`: Zustand store holds `address` in memory only. Not persisted to localStorage by the app itself.
- `frontend/src/hooks/useStellar.js:74-90`: `hydrateWalletSession()` reads the persisted address from the wallet kit's internal signals (which the kit persists in localStorage) and restores the Zustand store on page refresh.
- `frontend/src/components/WalletModal.jsx:49-51`: `kit.fetchAddress()` retrieves the address from the wallet extension. The app trusts the wallet extension's report — there is no additional cryptographic challenge to prove private key possession beyond what the wallet extension already enforces.
- `frontend/src/hooks/useStellar.js:30-35`: `disconnect()` calls `kitInstance.disconnect()` to clear the kit's localStorage and resets the Zustand store.

### Smart contract authorization

All state-mutating contract functions require cryptographic authorization from the caller:

| Function | Auth check | Line |
|----------|-----------|------|
| `create_pool` | `creator.require_auth()` | lib.rs:98 |
| `add_pool_member` | `caller.require_auth()` | lib.rs:157 |
| `log_expense` | `payer.require_auth()` | lib.rs:202 |

Read-only functions (`get_pool`, `get_pool_expenses`, `get_expense`, `get_pool_members`, `is_pool_member`, `verify_balance`) do not require auth — this is correct as they expose no private state.

### Pool-level access control

- **Member addition**: Only the pool creator can add members (lib.rs:166-168). The check compares `pool.creator` against the authenticated `caller`.
- **Expense logging**: Only pool members can log expenses (lib.rs:226-233). The check uses the `Member(pool_id, address)` storage key.
- **Duplicate prevention**: `add_pool_member` checks if the address is already a member before adding (lib.rs:170-179).

## Smart contract security

### Input validation on-chain

| Validation | Enforced at | Error type |
|-----------|-------------|------------|
| Pool name length > 64 | lib.rs:101-103 | `panic!()` |
| Expense description length > 128 | lib.rs:210-212 | `ContractError::DescriptionTooLong` |
| Expense amount <= 0 | lib.rs:205-207 | `ContractError::AmountZero` |
| Pool full (>= 1000 expenses) | lib.rs:221-223 | `ContractError::PoolFull` |
| Caller not pool member | lib.rs:226-233 | `ContractError::NotPoolMember` |
| Caller not pool creator | lib.rs:166-168 | `panic!()` |
| Pool not found | lib.rs:159-163, 214-218 | `expect("Pool not found")` / `ContractError::PoolNotFound` |

### Storage safety

- `overflow-checks = true` in release profile (Cargo.toml:19) prevents arithmetic overflow on `pool.total_expenses += 1` and `pool.member_count += 1`.
- `panic = "abort"` in release profile (Cargo.toml:23) prevents unwinding.
- `MAX_EXPENSES_PER_POOL = 1000` caps the `Vec<Expense>` growth per pool (lib.rs:10, 221-223).
- Pool IDs are sequential `u64` values, making enumeration trivial on-chain (by design for testnet).

### Events for audit trail

Two events are emitted for off-chain indexing:
- `PoolCreatedEvent` (lib.rs:28-34): Emitted on pool creation with `pool_id`, `name`, and `creator`.
- `ExpenseLoggedEvent` (lib.rs:36-44): Emitted on expense logging with `expense_id`, `pool_id`, `description`, `amount`, and `payer`.

### Test coverage

- `contracts/expense-pool/src/test.rs` (365 lines): 20 tests covering pool creation, name length, membership, unauthorized access, expense logging, amount validation, description length, pool not found, expense not found, balance verification, and multiple pools.
- Tests use `env.mock_all_auths()` (standard for Soroban unit tests) — authorization is verified by code review rather than test execution.

## Input validation and data protection

### Client-side sanitization

- **`sanitizeInput()`** (ExpenseLogger.jsx:173-175, Dashboard.jsx:307-309): Strips `<` and `>` characters and trims whitespace. Applied to pool names, expense descriptions, and notes on submit.
- **Amount validation** (ExpenseLogger.jsx:187-204): Checks `isNaN`, `<= 0`, `!isFinite`, and caps at 1,000,000,000 XLM.
- **Pool name length** (Dashboard.jsx:307-318): Enforces 1-64 characters after sanitization.
- **Invite code format** (Dashboard.jsx:140-143): Regex `/^[A-Z0-9]{8}$/` validated before submission.
- **Profile alias** (ProfileModal.jsx:34, 81): `trim()` and `maxLength={20}` HTML attribute.

### Export protection

- **CSV injection** (export.js:31-33): Cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are prefixed with `'` to prevent formula injection in spreadsheet applications.
- **HTML escaping** (export.js:21-28): `escapeHtml()` escapes `&`, `<`, `>`, `"`, and `'` in all user data before insertion into HTML-based PDF reports.

### React safety

- No `dangerouslySetInnerHTML` usage anywhere in the codebase.
- No `eval()` or `Function()` constructor usage.
- No `document.write()` calls.
- All user-supplied text rendered via `{expression}` in JSX is automatically escaped by React.

## Supabase and off-chain data

### Architecture

SplitStegasus uses Supabase as an optional off-chain data store for profiles, expenses, pool membership, join requests, activities, and analytics. The Supabase client is initialized with the public anon key (db.js:3-6).

- **Tables**: `profiles`, `expenses`, `pool_members`, `join_requests`, `activities`, `analytics_events`
- **Graceful degradation**: If Supabase is unavailable or tables don't exist, the app falls back to localStorage mock storage (db.js:17-34, `withFallback()` pattern).

### Known limitation: No Row Level Security

Supabase RLS policies are not configured. The Supabase anon key is by design public, but without RLS, any client with the anon key can read and write all tables. This is the most significant security gap in the project.

**Mitigation**: Server-side validation triggers (`supabase/migrations/001_server_side_validation.sql`) enforce input validation on all tables regardless of which client is writing. This prevents malformed data but does not restrict which rows a client can access.

**Required before mainnet**: Configure RLS policies on every table.

### Data flow

```
Browser ──→ Wallet Extension (signs transactions)
    │
    ├──→ Stellar Horizon RPC (account queries, public)
    │
    ├──→ Stellar Soroban RPC (contract calls)
    │       └──→ On-chain contract (pool/expense state)
    │
    └──→ Supabase (profiles, membership, analytics)
            └── anon key; no RLS configured
```

## Secrets and configuration

| Secret/config | Treatment | Evidence |
|--------------|-----------|----------|
| Stellar deployer private key | Stored in local `stellar` CLI config, never in source | deploy.sh:9 uses `--source "splitstellar-deployer"` identity |
| Supabase URL + anon key | In `frontend/.env` (gitignored); anon keys are public by design | `.gitignore:4` covers `.env`; `.env.example` has placeholders |
| WalletConnect Project ID | In `frontend/.env` as `VITE_WALLETCONNECT_PROJECT_ID`; public by design | `.env.example:20` documents it |
| Contract ID | Hardcoded in `.env.example`, `ci.yml`, `ARCHITECTURE.md`, `README.md` | Testnet-only; not a secret |

### Git hygiene

- `.gitignore` covers `.env` (root level, line 4) — confirmed not tracked: `git ls-files | rg "\.env"` returns only `.env.example`.
- No `.pem` files, `secret.txt`, or build artifacts tracked.
- `LEVEL4_IDEA.md` is gitignored (line 10) to prevent accidental commits of draft ideas.

## Dependency and CI security

### CI pipeline

| Job | Checks | Evidence |
|-----|--------|----------|
| `contract` | `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`, `cargo audit` | ci.yml:30-47 |
| `frontend` | `eslint`, `vitest run`, `vite build`, `npm audit --omit=dev --audit-level=high` | ci.yml:60-75 |
| `deploy` | GitHub Pages deploy (main branch only) | ci.yml:82-98 |

### Actions hygiene

- `actions/checkout@v4`, `actions/setup-node@v4`, `dtolnay/rust-toolchain@stable` — pinned to major versions (ci.yml:14, 16, 51).
- Deploy job uses least-privilege permissions: `pages: write`, `id-token: write` (ci.yml:81-83).
- Cargo and npm caches keyed on lockfile hashes (ci.yml:22-28, 53-55).

### Known limitations

- `npm install --legacy-peer-deps` (ci.yml:58) bypasses peer dependency resolution.

## Secrets and environment

### Production secrets treatment

| Secret | Required treatment |
|--------|-------------------|
| Stellar deployer key | Must remain in local CLI config only; never commit, never paste into issues or PRs |
| Supabase anon key | Public by design; rotate if leaked beyond intended scope |
| WalletConnect Project ID | Public by design; scoped to project domain |
| `VITE_*` env vars | Embedded in client bundle at build time; not secrets — verify no sensitive data is prefixed with `VITE_` |

### Environment templates

- `.env.example` is documentation only — must be replaced with deployment-specific values.
- `.env` is gitignored and must never be committed.
- No `.pem`, `secret.txt`, or credential files are tracked.

## Frontend security

### XSS prevention

| Vector | Mitigation | Status |
|--------|-----------|--------|
| React text nodes | Auto-escaped by React | Protected |
| `dangerouslySetInnerHTML` | Not used anywhere | N/A |
| `eval()` / `Function()` | Not used anywhere | N/A |
| `document.write()` | Not used anywhere | N/A |
| CSS injection | All styles via Tailwind utility classes; no dynamic CSS | N/A |
| URL injection | External URLs are hardcoded constants | N/A |
| HTML in PDF export | `escapeHtml()` applied to all user data | Protected |

### Content Security

- No Content-Security-Policy headers configured in `vercel.json` or `_headers` file.
- All external resources are from known CDNs (Google Fonts, Vercel Analytics).
- No inline scripts or styles beyond what Vite bundling produces.

## Known limitations

These items are acknowledged gaps in the current testnet MVP. They do not block testnet submission but must be addressed before mainnet.

| # | Limitation | Severity | Impact | Recommended fix |
|---|-----------|----------|--------|----------------|
| 1 | Supabase RLS not configured | HIGH | Any client can read/write all Supabase tables | Add RLS policies to every table; require authenticated reads |
| 2 | Contract uses `panic!()` for some errors | MEDIUM | `create_pool` and `add_pool_member` panic instead of returning `ContractError`, consuming all gas | Return typed errors: `ContractError::PoolNameTooLong`, `ContractError::NotPoolCreator` |
| 3 | Soroban SDK is pre-release (27.0.0-rc.1) | MEDIUM | Release candidate may have undiscovered bugs | Pin to stable release when available |
| 4 | No Content-Security-Policy headers | LOW | No defense-in-depth against XSS or data injection | Add CSP via `vercel.json` or `_headers` |
| 5 | `get_pool_members` returns empty Vec | LOW | On-chain member enumeration not functional; must use Supabase | Acceptable for MVP; document limitation |
| 6 | `console.error` in production | LOW | Error details visible in browser console | Remove or gate behind dev mode |
| 7 | `frontend/.gitignore` missing `.env` | LOW | Relies on root `.gitignore` to protect `.env` | Add `.env` to `frontend/.gitignore` as defense-in-depth |

## Mainnet release gates

These items are **not** marked complete. They are required before moving from testnet to a production mainnet environment.

| Gate | Required action |
|------|----------------|
| Supabase RLS | Configure Row Level Security on all tables: profiles, expenses, pool_members, join_requests, activities, analytics_events |
| Contract error handling | Replace `panic!()` with proper `ContractError` returns for gas efficiency and consistent UX |
| Stable SDK | Pin `soroban-sdk` to stable release (not RC) |
| CSP headers | Add Content-Security-Policy via `vercel.json` headers config |
| Independent review | Perform smart contract and frontend security audit before handling mainnet value |
| Secret rotation | Rotate Supabase anon key if it was exposed beyond intended scope |
| `.env` defense-in-depth | Add `.env` to `frontend/.gitignore` |

## Verification commands

Run these from the repository root before a release:

```bash
# Confirm no tracked environment files
git ls-files | rg "(^|/)\.env($|\.)"
# Expected: only .env.example

# Contract checks
cd contracts/expense-pool
cargo fmt --check
cargo clippy -- -D warnings
cargo test

# Frontend checks
cd frontend
npm run lint
npx vitest run
npx vite build

# Dependency audit (if tools installed)
npm audit --omit=dev
cargo audit
```

Expected result: only `.env.example` tracked, formatting clean, all tests pass, no known production dependency vulnerabilities. Before mainnet, also confirm Supabase RLS is configured and all mainnet gates are complete.

## Final status

**Testnet MVP**: The controls documented above are implemented in source and verified against the current testnet deployment. Known limitations are acknowledged and documented.

**Mainnet**: Not approved by this checklist alone. Complete every mainnet release gate and obtain an independent review first.

## Related documentation

- [README.md](README.md) — Project overview, features, and tester results
- [CONTRACT_INTEGRATION.md](CONTRACT_INTEGRATION.md) — Contract function reference and frontend integration guide
- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture diagram and component relationships
