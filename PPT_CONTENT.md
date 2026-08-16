# SplitStellar — Presentation Content (7-8 Slides)

---

## Slide 1: Title Slide

**Title:** SplitStellar
**Subtitle:** Decentralized Expense Settlement on Stellar

**Content:**
- Tagline: "The standard for decentralized settlement."
- Live Demo: splitstellar.vercel.app
- Built on Stellar Testnet with Soroban Smart Contracts
- Your Name / Team Name
- Date

**Image:** Landing page screenshot (`pictures/ss-1.png`)

---

## Slide 2: Problem Statement

**Title:** The Problem

**Content:**
- Friend groups and remote teams split expenses across borders
- Current solutions are broken:
  - **Manual IOUs** — never get settled
  - **Venmo/PayPal** — 3-5% FX fees, 1-3 day delays
  - **Bank wires** — $25-50 flat fees per transfer
- None work seamlessly across currencies
- A user paying in USD while another owes in EUR = multiple conversions, opaque rates, days of waiting

**Visual:** Comparison table or icons showing pain points

---

## Slide 3: Why Stellar?

**Title:** Why Stellar Network?

**Content:**
| Feature | Benefit |
|---------|---------|
| Native multi-asset payments | USDC, EURC, XLM in same transaction |
| Built-in DEX | Cheapest conversion route automatically |
| Anchor network | Fiat deposit/withdraw via MoneyGram, Bridge |
| Soroban contracts | Custom settlement logic on-chain |
| ~$0.00001 per op, 5s finality | Cheaper and faster than any traditional rail |

**Visual:** Stellar network logo + feature icons

---

## Slide 4: Architecture

**Title:** Technical Architecture

**Content:**
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React / Vite)                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Expense   │  │ Settle Up    │  │ User Guide       │  │
│  │ Logger    │  │ Calculator   │  │ (Help)           │  │
│  └─────┬────┘  └──────┬───────┘  └──────────────────┘  │
└────────┼───────────────┼────────────────────────────────┘
         │               │
    SorobanRPC      Horizon API
         │               │
┌────────▼───────────────▼────────────────────────────────┐
│                   Smart Contracts (Rust)                  │
│  ┌────────────────────┐  ┌──────────────────────────┐   │
│  │ Expense Pool       │  │ Settlement Engine         │   │
│  │ • create_pool      │  │ • calculate_net_balances  │   │
│  │ • log_expense      │  │ • execute_payment         │   │
│  │ • get_expenses     │  │ • verify_balance          │   │
│  └────────┬───────────┘  └──────────────┬───────────┘   │
└───────────┼─────────────────────────────┼───────────────┘
            │                             │
┌───────────▼─────────────────────────────▼───────────────┐
│                     Stellar Network                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │
│  │ USDC    │  │ EURC    │  │ XLM     │  │ Anchors   │  │
│  └─────────┘  └─────────┘  └─────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- React SPA with Zustand state management
- Soroban smart contracts in Rust
- Supabase for profiles/activity (localStorage fallback)
- CI/CD via GitHub Actions → Vercel

**Image:** Architecture diagram from README

---

## Slide 5: Core Features

**Title:** Core Features

**Content:**

| Feature | Description |
|---------|-------------|
| **Pool Creation** | Create shared expense pools stored on-chain |
| **Invite Codes** | 8-character alphanumeric codes for access control |
| **Owner Approval** | Pool creators approve/reject join requests |
| **Expense Logging** | Immutable records on Stellar blockchain |
| **Settlement Calculator** | Net balance computation per participant |
| **Direct Payments** | Settle debts via on-chain XLM transfers |
| **Dark/Light Theme** | Premium UI with smooth transitions |
| **User Guide** | In-app documentation for new users |

**Images:** Dashboard screenshot (`pictures/ss-2.png`), Expense logger UI

---

## Slide 6: Security & Smart Contract

**Title:** Security & Smart Contract

**Content:**

**Smart Contract (Rust/Soroban):**
- 8 functions, 2 events, 20 unit tests
- Deployed on Stellar Testnet

**Security Features:**
| Layer | Protection |
|-------|------------|
| **Membership** | Only pool members can log expenses |
| **Input Validation** | Pool names (64 chars), descriptions (128 chars) |
| **Access Control** | Only creator can add members |
| **Invite Codes** | 8-char format validation |
| **Rate Limiting** | Event polling with exponential backoff |
| **XSS Prevention** | Input sanitization on all user inputs |

**Error Codes:**
- PoolNotFound, NotPoolCreator, InsufficientBalance
- AmountZero, NotPoolMember, PoolNameTooLong
- DescriptionTooLong, PoolFull, Unauthorized

**Contract ID:** `CAMFEWTNBPLGOWA5P3TD2GVEGDNE6G4TUVFRNWSZN67ZWNTBBNNUYG25`

---

## Slide 7: User Flow / Workflow

**Title:** User Workflow

**Content:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Connect   │────▶│   Create    │────▶│   Invite    │
│   Wallet    │     │   Pool      │     │   Members   │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Settle    │◀────│   Calculate │◀────│    Log      │
│   Up (XLM)  │     │   Balances  │     │  Expenses   │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Step-by-Step:**
1. **Connect Wallet** — Freighter, Albedo, xBull, WalletConnect
2. **Create Pool** — Name your pool, get invite code
3. **Invite Members** — Share invite code or link
4. **Log Expenses** — Record who paid what (on-chain)
5. **Calculate Balances** — Auto-compute net amounts
6. **Settle Up** — Pay directly via Stellar (5s finality)

**Image:** Dashboard flow screenshots

---

## Slide 8: Results & Future

**Title:** Results & Future Roadmap

**Content:**

**Level 4 Results:**
- 11 unique wallets tested on testnet
- 6 verified on-chain transactions
- Full CI/CD pipeline operational
- Live at splitstellar.vercel.app

**Level 5 Achievements:**
- Security hardening (membership, validation, rate limiting)
- User guide with premium design
- Mobile responsiveness improvements
- Updated smart contract (20 tests passing)

**Future Roadmap (Level 6-7):**
- SEP-24 anchor integration (fiat on/off ramp)
- Multi-currency path payment settlement
- Push notifications for expenses
- Mobile PWA with QR-code joining
- Soroban settlement contract (atomic multi-party)
- Mainnet deployment with $1M+ TVL target

**Image:** Analytics dashboard screenshot (`pictures/ss-3.png`)

---

## Design Notes for PPT

**Color Scheme:**
- Dark mode: #000000 (black), #FFFFFF (white), #666666 (gray)
- Accent: #10B981 (emerald), #F59E0B (amber), #EF4444 (red)
- Fonts: Playfair Display (headings), Space Mono (code/body)

**Images to Include:**
- `pictures/ss-1.png` — Landing page
- `pictures/ss-2.png` — Dashboard
- `pictures/ss-3.png` — Analytics
- Stellar logo
- Soroban logo
- Architecture diagram (from README)

**Slide Layout:**
- Minimalist design (black/white theme)
- Left-aligned headings
- Mono font for technical details
- Generous whitespace
