# Idea Submission — SplitStellar: Cross-Border Expense Settlement

---

## 1. Problem Statement

Friend groups and remote teams split expenses across borders — a group trip to Bali, a distributed team buying SaaS tools, freelancers sharing project costs. Today they rely on:

- **Manual IOUs** that never get settled
- **Venmo / PayPal** with 3–5% FX fees and 1–3 day bank delays
- **Bank wires** with $25–50 flat fees per transfer

None of these work seamlessly across currencies. A user paying in USD while another owes in EUR means multiple conversions, opaque rates, and days of waiting.

---

## 2. Why Stellar?

Stellar is uniquely built for this exact flow:

- **Native multi-asset payments** — USDC, EURC, and any anchor-issued fiat token can be sent in the same transaction with atomic settlement (no swapping needed)
- **Built-in DEX** — Path payments find the cheapest conversion route across the orderbook automatically
- **Anchor network** — Users deposit / withdraw actual fiat via regulated anchors (MoneyGram, Bridge, etc.) — the app never touches custody
- **Soroban smart contracts** — Custom settlement logic (equal splits, proportional shares, multi-currency netting) runs on-chain transparently
- **~$0.00001 per op, 5s finality** — Actually cheaper and faster than any traditional rail

---

## 3. Target Users

| User Group | Why they need this |
|------------|-------------------|
| **Travel groups** | International trips, shared Airbnbs, rental cars across currencies |
| **Remote teams & DAOs** | Cross-border payroll, shared tooling, conference expenses |
| **Freelancer collectives** | Joint project costs, shared subscriptions |
| **Immigrant remittance users** | Family pools for shared household expenses |

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React / Vite)                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Expense   │  │ Settle Up    │  │ Anchor Deposit /     │  │
│  │ Logger    │  │ Calculator   │  │ Withdraw UI          │  │
│  └─────┬────┘  └──────┬───────┘  └──────────┬───────────┘  │
└────────┼───────────────┼────────────────────┼───────────────┘
         │               │                    │
    SorobanRPC      Horizon API          SEP-24 Anchor API
         │               │                    │
┌────────▼───────────────▼────────────────────▼───────────────┐
│                   Smart Contracts (Rust)                     │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │ Expense Pool       │  │ Settlement Engine            │   │
│  │ • create_pool      │  │ • calculate_net_balances     │   │
│  │ • log_expense      │  │ • execute_multi_currency_pay │   │
│  │ • get_expenses     │  │ • path_payment_settle        │   │
│  └────────┬───────────┘  └──────────────┬───────────────┘   │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
┌───────────▼─────────────────────────────▼───────────────────┐
│                     Stellar Network                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────────┐  │
│  │ USDC    │  │ EURC    │  │ XLM     │  │ Anchor        │  │
│  │ (Circle)│  │ (Circle)│  │ (Native)│  │ Issued Assets │  │
│  └─────────┘  └─────────┘  └─────────┘  └───────────────┘  │
│                     + DEX (path payments)                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Log expense** → Soroban contract writes expense with amount + currency
2. **Settle up** → Contract reads all expenses, computes net balances per currency
3. **Pay** → Either native payment (same currency) or path payment (cross-currency via DEX)
4. **Anchor deposit / withdraw** → SEP-24 flow: user redirected to anchor's KYC, funds appear in wallet

---

## 5. Complexity Evaluation

| Challenge | Why it's hard |
|-----------|--------------|
| **Multi-currency netting** | N participants across M currencies — finding the minimal settlement graph is an NP-hard optimization problem for >3 parties |
| **Path payment integration in Soroban** | Reading DEX liquidity and executing `PathPaymentStrictReceive` from within a Soroban contract requires cross-contract calls with dynamic routing |
| **SEP-24 anchor integration** | Handling the full interactive deposit / withdraw flow (KYC, memo tracking, transaction status polling, callback URL pattern) is non-trivial |
| **Event-sourced state** | Pool state is reconstructed from contract events — handling reorgs, missed events, and cursor management at scale is complex |
| **Real-time FX** | Converting expense amounts at the prevailing DEX rate means the app must display live quotes and handle rate expiration during UX flow |

---

## 6. Roadmap

### MVP — Level 4

- Multi-currency expense logging (USDC, EURC, XLM pools)
- Settlement calculator showing per-person net in each currency
- Single-currency settlement via native XLM / USDC payment from wallet
- Shareable pool links with URL-based discovery

### User Acquisition — Level 5 & 6

- SEP-24 anchor integration (deposit / withdraw fiat via MoneyGram or Bridge)
- Multi-currency path payment settlement (auto-convert via Stellar DEX)
- Push notifications for new expenses and settlement requests
- Mobile-responsive PWA with QR-code pool joining

### Mainnet Vision — Level 7

- Soroban settlement contract with atomic multi-party payment execution
- Recurring expense pools (monthly rent, subscriptions)
- Treasury management for DAOs with contributor expense limits
- Audited, open-source contracts deployed on mainnet with ≥$1M TVL in active settlement pools
- Published integration with 2+ Stellar anchors for real-world fiat on/off ramps
