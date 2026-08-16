# SplitStellar

[![CI/CD](https://github.com/Anubhab-Rakshit/splitstellar/actions/workflows/ci.yml/badge.svg)](https://github.com/Anubhab-Rakshit/splitstellar/actions/workflows/ci.yml)

Decentralized expense splitting on the Stellar network powered by Soroban smart contracts. Create expense pools, log transactions on-chain, and settle balances — all directly from your wallet.

- **Live demo:** [splitstellar.vercel.app](https://splitstellar.vercel.app/)
- **Demo video:** [Watch on YouTube](https://youtu.be/1UexAQg4Rbw)
- **User guide:** [splitstellar.vercel.app/guide](https://splitstellar.vercel.app/guide)
- **Testnet contract:** [`CAMFEWTNBPLGOWA5P3TD2GVEGDNE6G4TUVFRNWSZN67ZWNTBBNNUYG25`](https://stellar.expert/explorer/testnet/contract/CAMFEWTNBPLGOWA5P3TD2GVEGDNE6G4TUVFRNWSZN67ZWNTBBNNUYG25)
- **Integration map:** [`CONTRACT_INTEGRATION.md`](./CONTRACT_INTEGRATION.md)

## Quick navigation

- [Screenshots](#screenshots)
- [Level 4 evidence](#level-4--evidence)
- [Level 5 — 50+ user proof](#level-5--user-growth-and-feedback)
- [Feedback → improvements → commits](#feedback--improvements--commits)
- [Recent features](#recent-features)
- [Smart contract](#smart-contract)
- [Workflows](#workflows)
- [Getting started](#getting-started)
- [Submission checklist](#submission-checklist)

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

## Screenshots

### Landing

<img width="1510" alt="Landing" src="pictures/ss-1.png" />

### Dashboard

<img width="1354" alt="Dashboard" src="pictures/ss-2.png" />

### Analytics

<img width="1354" alt="Analytics" src="pictures/ss-3.png" />

---

## Level 4 — Evidence

The Level 4 milestone delivered the full product loop: Soroban contract, wallet integration, pool sharing, on-chain settlement, and mobile responsiveness.

### Key commits

| Commit | Description |
|--------|-------------|
| [`f2f0a0b`](https://github.com/Anubhab-Rakshit/splitstellar/commit/f2f0a0b) | Pool sharing, join by ID, shareable URLs, Settle Up with on-chain XLM settlement |
| [`249008b`](https://github.com/Anubhab-Rakshit/splitstellar/commit/249008b) | Analytics enabled and mobile responsiveness polished |
| [`b400f5b`](https://github.com/Anubhab-Rakshit/splitstellar/commit/b400f5b) | Securities enhanced for pools |
| [`c230238`](https://github.com/Anubhab-Rakshit/splitstellar/commit/c230238) | Security breaches fixed — pools can no longer be intervened |
| [`d0f94c1`](https://github.com/Anubhab-Rakshit/splitstellar/commit/d0f94c1) | Added screenshots, updated README, fixed UI/UX errors |
| [`45ba042`](https://github.com/Anubhab-Rakshit/splitstellar/commit/45ba042) | Light mode errors fixed |

### Onboarded wallets (11 during Level 4 testing)

```
GAG7BIU5EL7KOBVVM4HFD5NOZVIKUT7JK3WYLUGVYMYTJOIST3K27ZJ7
GA72JHQ5C3JDZ3H5RVUNYZ6GGXJWN6V6NHSXU2OJY7JJ2GF3IC5MIFUY
GB2GLZJEOFZXGK3OJTD25B2XOZNP7GLIPKXNJKQ7FC66LIWTHJTHN6EB
GBRZI47KWUCFX64IRERZOWKKMZ5WSKBAPSZ2VVN3DLMTUQIUA6RBA3YX
GBPIWK56OE3Z7Q4ZZCHHWRTGKXWA2IOV3DK2HCEAVW53PITZRVZLC7VJ
GDGZUKLVW5X3U6U4I3JIJLQMJJRAGGDGR3AUYUUYEM2W7OJFV7EIRZXN
GCJ2RC2HZN4D232SFJMLFBUJEZWB6OYCIFAZG6SCYUQP5Z5LB2RG4YEP
GDA7V5EKSYXDO5URT7FQSFQJCLDV3YR4SUXMXCYZ7UWAISAPEVGSCB23
GD4BOUGXDFVYJMT6X6KFGCFRSMPNDSU3W6UGYS22AVZAWCOBVDXOVDFL
GCG34N562IX57PLLVKVC6LYQEK7VNX3HBR5KIECNT22MR5P7MOHN7ECW
GBGEJTLNY3A4BMZGFAWFVVBJZOZLFCLD6Y2FROAYVN26R2EPEJZA7ADF
```

### Example transaction hashes (verified on-chain)

| # | Tx Hash | Explorer |
|---|---------|----------|
| 1 | `24f5270cc06e1bd2627b68a8d2d7dbb0a6e8a7e139dbd119ff7d86c2fb2d17b3` | [View](https://stellar.expert/explorer/testnet/tx/24f5270cc06e1bd2627b68a8d2d7dbb0a6e8a7e139dbd119ff7d86c2fb2d17b3) |
| 2 | `f3dd06701e9abb9f2ff4d5d1b38939e2a4ea54d8522c6b73a5c0a5740882073e` | [View](https://stellar.expert/explorer/testnet/tx/f3dd06701e9abb9f2ff4d5d1b38939e2a4ea54d8522c6b73a5c0a5740882073e) |
| 3 | `f46b38406cffa5835df9577051432f69bbaf56c814a8643cb95058d008ae377d` | [View](https://stellar.expert/explorer/testnet/tx/f46b38406cffa5835df9577051432f69bbaf56c814a8643cb95058d008ae377d) |
| 4 | `959b790bf32a027c081388b7b48b0b4c88a6752e403f66475e81e9811d6c281b` | [View](https://stellar.expert/explorer/testnet/tx/959b790bf32a027c081388b7b48b0b4c88a6752e403f66475e81e9811d6c281b) |
| 5 | `ae094e905aa49d17d62dbada3026d06a0cf4c3575b7ac9ef6daea1334d40cde7` | [View](https://stellar.expert/explorer/testnet/tx/ae094e905aa49d17d62dbada3026d06a0cf4c3575b7ac9ef6daea1334d40cde7) |
| 6 | `5011d841e1999c38dd8cef99f1583aa8b39e77af1eaed192f2adbdc77644f75c` | [View](https://stellar.expert/explorer/testnet/tx/5011d841e1999c38dd8cef99f1583aa8b39e77af1eaed192f2adbdc77644f75c) |

---

## Level 5 — User growth and feedback

**46 responses** collected via the [Google Form](https://forms.gle/2gjEdehQZsiQ1GqY9) with an **average product rating of 8.6/10** (11×10, 15×9, 12×8, 7×7, 1×6). **44 of 46** testers connected their Stellar wallet and tested on-chain features. Email addresses are withheld from this public list for privacy.

| Name | Wallet Address | Rating |
|------|----------------|--------|
| Prajit Bakshi | `GDCRU2LQGDNQNYIVQF4XWPIR3A5ZVVKYL5QHRMQNTCPHO6WER3VV5BU5` | 9 |
| Arin Das | `GDT46JCCBAOVYY6QDJIJOCHCVDEHMPYRIDQODNBBGFLIKVEOI5BIN7QH` | 9 |
| Mukta Das | `GCQQ66RJG7KKMI6DOJ543OKAAHMVL7FH4EBNEHCZRFAKQGJEXROWVHJB` | 8 |
| Vibhan Dutta | `GC5HT6TIRRM4AXLS4FLWEEWWAGXFEWASKNVNQHHEE5MYXAGTVAGOEX4B` | 7 |
| Anantajit Das | `GC6URYNTLGARSFS42EB7KQBKSIX7YT2ZJITHN6MZIF3MBJ4JVZPK6VCD` | 9 |
| SOHANA Ghosh | `GCOYVBZZA6ELZYSHMJ5WKOKMV464E2G72SD2CHIBQSYCEFH6O4DGQ42W` | 9 |
| Subham Bhat | `GDQKOGWV7J3MFLXT3HJUQRHPXFCHKZIVVG6HB556WOLBPRVGSQZQM2EP` | 9 |
| Abhiraj Bhowmick | `GBUMKN5CXHAFJKWBTAKCAULDYHPGRG6G6SY2A57HT5CKBMGORERCSENL` | 8 |
| Ayanika Sen | `GDUIWWJMR7G2F6YPGUB6UDPUTFKPAATPGZA5OW4MG47VTKNUXPQUOSDQ` | 8 |
| Sampad | `GAJXENCVGEH6JZ6WSD6NAOARUKHQ6RTGAKMINWUS7HNEXX7SWN3TIAMW` | 7 |
| Oyshee Ghosh | `GAX7UEXZ2NSFFLVANX4M7M237R4SRZHGTBVEFI25QRKHCCFFKZJ7NVRQ` | 9 |
| Upasana Aditya | `GAEEAUVO7Y7OEWTIQOZFW2IOYD2CO2JTEODIVEGWIRLMPQ3PXQTDAYTB` | 8 |
| Reet | `GCNC2FDUNGYBIRUBQN745JOJBLJRLU362TEH6DFXYKU563PLKJUDJQS3` | 8 |
| Sanjuktta Kundu | `GA2YLNK2P4XKBVMZGN6DFIGA5YRATOYRUHMSQ7KSRHITPUAGO5K26UOW` | 7 |
| R Banik | `GAQ3MNIC2PMY2FUN2NKFL62MJKZTJA6RHJCIPADNFVZDPN436CSS67OD` | 10 |
| Mustafa Colak | `GBUJJIYNPOC57O6CIFKFOBLPNTS6I5IYNGO5XQY7DAIPQ6JCU7ZBV7LN` | 9 |
| Somsankar Mitra | `GDFT47FW4MMOMWNMKB6FCDWBGOES3R5KYLOOYIHJE5LUQHJAZKWNBWMJ` | 7 |
| Siddhu Sarkar | `GBF5SJ57EQO3SG53C57C5OTPQ3ZHJ3TGUOCQHCDIZYBCSU6D2TUNDF` | 8 |
| Saketh Ram | `GBUEMTFOUBFKMDBD5HHUBVEKJOO7AIN7ESVTMAXAQP2WSSAE7KVPF2C3` | 7 |
| Sanbartika Ghosh | `GDVPE2PPOUCMKGWTQ4XC5OALZER2V2XMYYSLXI2W7YWC4IB2G7A5R2V4` | 8 |
| Sanvi Bhowmick | `GB57HBAJYH4MU3UJ3GNIXXJ6YAJX2LMA67ETYYLKCNHG7ACPDM4RPXRG` | 8 |
| Aabes Sarkar | `GCLP2UUYYLSQRSIK4HSTLANIBH2EIG7YG3WBUXZG2VQVBPNAKQ4JCTWF` | 8 |
| Tathagata Ghosh | `GCMMXGDLJDBDMCZ34XK3EV7ZH6BRAFGY2GZIBZT3B42U7M3TCRGMSAVL` | 8 |
| Tamisra Moitra | `GAAMI2GWWYGNZPIYU56JFQ3YH4M73ZKXQNBKSRZZH5J3PG5SLZNAJDFE` | 7 |
| Protaz Sarkar | `GADQGBHBQ3HTZFTJNST6TQ6VIVBN3DB2YVEGUSFV3RZK32PQFVR7KTCY` | 9 |
| Susruta Guha Roy | `GCNJT335CTRY6QWCTX6CMGRLRH3MATGKS475VN6K6Y5ZWFMORJFSFUCH` | 9 |
| Amitava | `GBIDCKYQRC7I4ACZWMLTH6J5T7MHDCBWHBP2ABLXMU6CJDEO3TJ3N3FJ` | 6 |
| praloy sahoo | `GBNSTUJRZO6ULSEVOIVC6KXCUY5H7TTUGSF7R6KDAC7JE5RCY6KTGL6X` | 9 |
| Koyeli Kundu | `GC26LC6RPS567N5LHO3KCW4BONSNPZEMWZ42CNBHUEVXIHINR76ZN6SV` | 10 |
| Antara Bhattacharjee | `GCS2K76FE6RBCOZLNWHNXGZ5SFXEQNLHMVB5A4JRWQIFIOA23RQOD3D5` | 10 |
| Anisha Ghosh | `GCE2KCAREZR3EYNEGVPDZGCE6RMSZRLLSCLHKVGK4YYCA75DIORJPANY` | 10 |
| Aegon | `GC4LVPOA3DVMQYBCPKWJ7I73MTX26C2VEVAYSBXWYP4G3CRFMPXFEMZJ` | 9 |
| Debanjali Chatterjee | `GDWXADIRZSC7L2LVOOVLN4GO74I4CVR4BJNNYPSYXKTLJLNGOFAOV7V7` | 10 |
| Shashi verma | `GAHSOOCF436DFBVUNZZLJLIIT35ZKCDXOMOJARK36O5FU5DUNLAJNVHT` | 10 |
| Suniska Dey | `GBFPA5UH44V3H6HZ4ULYOZ6FSMC4RTZAAKPUG6KCEUKQ7TZ67HV6FLIZ` | 9 |
| Taniya Singh | `GCYXMFCGWEIRT6OV4RD2APYNGEOOEVW5BRXN7HD5Q7TWGJQVRCDBVY3Y` | 10 |
| Snigdha | `GA5QMWDMPSM2KNHDTTL3JCISEZPC7DTNEJQBOBZLBUXRNL2GVCKCKO3L` | 10 |
| Subom Paul | `GCYNEKAM5XY2KW352NCYJBGFZN6GIEKD2IFLYPDZ6IKZBS432IX7WAMT` | 9 |
| Subham Neogi | `GD76QIEKFLGMGP622YWXWWUEXCQCLNLOVQXTJMNJI2KWRHJ2KQSTPKSB` | 7 |
| Pradipto Halder | `GBM32JBOAZVGEHD5DIEOEPA3FB2IHF2CI4QLQSEI6SAXSY7DBERX24HW` | 10 |
| Sarin Sanyal | `GCJVEX7BJIGIJ47IX6DVOUAINBQBTPWF23DPHUGRN3SDRVXNTK74VMQV` | 9 |
| Aritra Sarkar | `GAL4BIKEWF53SEIJLXA5ZDK3AZMDSTIUCKINNWR2FMMI3GJZVL2PSPDM` | 8 |
| Ruparna | `GAKAJ45GBZKL4JPFEID2AW3V2XAAY3WENOVRM2CDZQE2OTWRL7ZLP3CY` | 10 |
| Anushka Sarkar | `GASFWVT2VCWBWW3A2RWZ3UDEE7ATRUFCWVEQAH4RBRU5QWBSZ33EI4J3` | 8 |
| Ritam Ghosh | `GBDYH5YDIP4NMOUHKVUMOVUWNWVHEJLX7WDMBH222CCKKHCG25J4QB6U` | 10 |
| Srinjoy | `GCCKX6ZWNV4CW57FPKSOUSNHLTRPBQNJIDVI2DYPHT75TAD2YLGOE2QK` | 9 |

---

## Feedback → Improvements → Commits

Every actionable theme raised by Level 5 testers was matched to a shipped fix.

| Feedback theme | Reported by | Solution delivered | Commit |
|----------------|-------------|--------------------|--------|
| Security — "could see other pool names", "security need to be upgraded" | Prajit Bakshi, Reet | Invite-code gated access + owner approval for joins; contract membership & input limits; export XSS/CSV-injection hardening | [`cfd7e81`](https://github.com/Anubhab-Rakshit/splitstellar/commit/cfd7e81), [`6e93761`](https://github.com/Anubhab-Rakshit/splitstellar/commit/6e93761), [`cbb194a`](https://github.com/Anubhab-Rakshit/splitstellar/commit/cbb194a), [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| Sharing — "Sharing is not working properly", "Invite friends not working properly" | Abhiraj Bhowmick, Tamisra Moitra | Shareable invite links that survive wallet connection + native Web Share API | [`f2f0a0b`](https://github.com/Anubhab-Rakshit/splitstellar/commit/f2f0a0b), [`5c46904`](https://github.com/Anubhab-Rakshit/splitstellar/commit/5c46904) |
| Refresh — "reloading errors", "ledger not refreshing properly", "live updates", "refresh rate could be faster" | Mukta Das, Sampad, Tathagata Ghosh, Aritra Sarkar, Srinjoy | Visibility-based polling (6s visible / 30s hidden) + on-device expense cache | [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| Onboarding — "A user guide about app", "simple step-by-step guide", "a bit complicated for beginners" | Upasana Aditya, Mustafa Colak, Saketh Ram, Sanbartika Ghosh, Aabes Sarkar | Premium user-guide page + explainer-driven landing page | [`4bab17c`](https://github.com/Anubhab-Rakshit/splitstellar/commit/4bab17c), [`f239526`](https://github.com/Anubhab-Rakshit/splitstellar/commit/f239526) |
| Mobile — "issues in iPhone display", "Some Overflow issues", "black screen" | Subham Bhat, Amitava, Srinjoy, Vibhan Dutta, Somsankar Mitra | Responsive layout + mobile/light-mode polish | [`a2932e3`](https://github.com/Anubhab-Rakshit/splitstellar/commit/a2932e3), [`d0f94c1`](https://github.com/Anubhab-Rakshit/splitstellar/commit/d0f94c1), [`45ba042`](https://github.com/Anubhab-Rakshit/splitstellar/commit/45ba042) |
| Smoother UX — "a bit more smoother", "navigation could be smoother" | Arin Das, Ayanika Sen, Subom Paul | Premium animations + ⌘K command palette | [`6239bcf`](https://github.com/Anubhab-Rakshit/splitstellar/commit/6239bcf), [`f239526`](https://github.com/Anubhab-Rakshit/splitstellar/commit/f239526), [`abfbfe5`](https://github.com/Anubhab-Rakshit/splitstellar/commit/abfbfe5) |
| Feature requests — QR/payment links, AI receipt scanning, auto-mark-paid, emojis, multi-chain | Shashi verma, Anushka Sarkar, Sarin Sanyal, praloy sahoo, Sanjuktta Kundu | Documented in the roadmap for future work | — |

---

## Recent Features

Iterated directly from the feedback loop above:

| Feature | Commit |
|---------|--------|
| **Command palette** — ⌘K fuzzy search over pages and actions (cmdk + fuse.js) | [`abfbfe5`](https://github.com/Anubhab-Rakshit/splitstellar/commit/abfbfe5) |
| **Expense categories** — 20 presets with icons + smart split types (equal/percentage/exact/shares) | [`abfbfe5`](https://github.com/Anubhab-Rakshit/splitstellar/commit/abfbfe5), [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| **Expense notes + undo/redo** — last-5 action history on the ledger | [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| **Currency selector** — XLM / USDC / EURC with stroop conversion for on-chain storage | [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| **CSV + HTML report export** — one-click reports with XSS/CSV-injection escaping | [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| **Real-time collaboration** — visibility-based polling keeps the ledger fresh | [`56694db`](https://github.com/Anubhab-Rakshit/splitstellar/commit/56694db) |
| **Smart settlement** — greedy min-transaction optimization with "N fewer txs" badge | [`6239bcf`](https://github.com/Anubhab-Rakshit/splitstellar/commit/6239bcf) |
| **Spending insights + achievement badges + member profiles** | [`7739bc5`](https://github.com/Anubhab-Rakshit/splitstellar/commit/7739bc5) |
| **Premium animations** — shared motion variants across landing, nav, and lists | [`6239bcf`](https://github.com/Anubhab-Rakshit/splitstellar/commit/6239bcf), [`f239526`](https://github.com/Anubhab-Rakshit/splitstellar/commit/f239526) |

---

## Smart Contract

**Deployed on Testnet:** [`CAMFEWTNBPLGOWA5P3TD2GVEGDNE6G4TUVFRNWSZN67ZWNTBBNNUYG25`](https://stellar.expert/explorer/testnet/contract/CAMFEWTNBPLGOWA5P3TD2GVEGDNE6G4TUVFRNWSZN67ZWNTBBNNUYG25)

> **Integration mapping:** See [`CONTRACT_INTEGRATION.md`](./CONTRACT_INTEGRATION.md) for the complete function-by-function mapping between contract (`lib.rs`) and frontend (`soroban.js`), including ScVal type alignment, parser logic, events, and error codes.

### Functions

| Function | Contract (`lib.rs`) | Frontend Call |
|----------|--------------------|---------------|
| `create_pool(name, creator)` | `lib.rs:97 → Pool` | `buildAndSubmit(address, kit, 'create_pool', ...)` |
| `get_pool(pool_id)` | `lib.rs:145 → Option<Pool>` | `simulateCall(address, 'get_pool', ...)` |
| `is_pool_member(pool_id, member)` | `lib.rs:150 → bool` | `simulateCall(address, 'is_pool_member', ...)` |
| `add_pool_member(pool_id, caller, new_member)` | `lib.rs:158 → ()` | `buildAndSubmit(address, kit, 'add_pool_member', ...)` |
| `log_expense(pool_id, desc, amount, payer)` | `lib.rs:193 → Result<Expense>` | `buildAndSubmit(address, kit, 'log_expense', ...)` |
| `get_pool_expenses(pool_id)` | `lib.rs:261 → Vec<Expense>` | `simulateCall(address, 'get_pool_expenses', ...)` |
| `get_expense(expense_id)` | `lib.rs:269 → Option<Expense>` | `simulateCall(address, 'get_expense', ...)` |
| `verify_balance(token_id, owner, required)` | `lib.rs:277 → Result<bool>` | `simulateCall(address, 'verify_balance', ...)` |

### Security model

- **Pool membership** — only members can log expenses; only the creator can add members
- **Input validation** — pool names (1–64 chars), descriptions (1–128 chars), amounts (>0, max 1B XLM)
- **Invite-code gating** — 8-char alphanumeric codes; owner approval required to join
- **XSS prevention** — inputs sanitized and all exported reports escaped
- **Error codes** — 9 typed contract errors (`PoolNotFound`, `NotPoolCreator`, `NotPoolMember`, `PoolFull`, …)

---

## Workflows

### Development

```bash
make setup        # copy .env, build contract, install frontend deps
make dev          # start Vite dev server with HMR
```

### Testing

```bash
make test         # contract (cargo test, 20) + frontend (vitest, 13)
```

### Contract deployment

```bash
make deploy-testnet    # ./scripts/deploy.sh testnet
./scripts/deploy.sh mainnet
```

### CI/CD (`.github/workflows/ci.yml`)

1. **Contract** — `cargo fmt --check`, `cargo clippy`, `cargo test`
2. **Frontend** — `eslint`, `vitest run`, `vite build`
3. **Deploy** — auto-deploy to Vercel on every push to `main`

---

## Getting Started

```bash
git clone https://github.com/Anubhab-Rakshit/splitstellar.git
cd splitstellar
make setup
make dev
```

### Prerequisites

- Node.js 22+
- Rust (stable) with `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) v27+
- Freighter browser extension (for wallet interaction)

### Environment

Copy `.env.example` to `frontend/.env`:

```env
VITE_SOROBAN_CONTRACT_ID=CAMFEWTNBPLGOWA5P3TD2GVEGDNE6G4TUVFRNWSZN67ZWNTBBNNUYG25
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK=testnet
VITE_SUPABASE_URL=              # optional — falls back to localStorage
VITE_SUPABASE_ANON_KEY=         # optional
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React / Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Dashboard   │  │   Expense    │  │   Settle Up   │  │   Guide    │ │
│  │   (Pools)     │  │   Logger     │  │   Calculator  │  │   (Help)   │ │
│  └───────┬───────┘  └───────┬──────┘  └───────┬──────┘  └────────────┘ │
└──────────┼──────────────────┼─────────────────┼──────────────────────────┘
           │                  │                 │
           │    ┌─────────────┴─────────────────┘
           │    │
           ▼    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Services Layer (soroban.js)                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  simulateCall()   │  │  buildAndSubmit() │  │  sendPayment()       │  │
│  │  (Read ops)       │  │  (Write ops)      │  │  (Settlement)        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
└───────────┼─────────────────────┼───────────────────────┼───────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Stellar Network                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Soroban Contract (Rust)                        │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │  │
│  │  │  create_pool    │  │  log_expense    │  │  verify_balance    │ │  │
│  │  │  get_pool       │  │  get_expenses   │  │  is_pool_member    │ │  │
│  │  │  add_member     │  │  get_expense    │  │                    │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   XLM    │  │   USDC   │  │   EURC   │  │   Anchor Assets      │  │
│  │ (Native) │  │ (Circle) │  │ (Circle) │  │   (MoneyGram, etc.)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘  │
│                                                                          │
│                     + DEX (path payments for multi-currency)             │
└─────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Persistence Layer                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Supabase         │  │  localStorage    │  │  Analytics           │  │
│  │  (Profiles,       │  │  (Fallback)      │  │  (Events, Metrics)   │  │
│  │   Pool Members)   │  │                  │  │                      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Frontend** — React SPA with Zustand state, Tailwind CSS v4, Framer Motion
- **Wallet** — Freighter / Albedo / xBull / WalletConnect via `@creit.tech/stellar-wallets-kit`
- **Contract** — Rust Soroban smart contract on testnet (8 functions, 2 events, 20 tests)
- **Integration** — `@stellar/stellar-sdk` v16; reads via `simulateCall`, writes via `buildAndSubmit` (simulate → assemble → sign → submit → poll)
- **Persistence** — Supabase with localStorage fallback
- **CI/CD** — GitHub Actions → lint, test, build → Vercel deploy

---

## Submission Checklist

- Public GitHub repository
- 55 meaningful commits
- Live deployed application — [splitstellar.vercel.app](https://splitstellar.vercel.app/)
- Demo video — [YouTube](https://youtu.be/1UexAQg4Rbw)
- Proof of 50+ users — 46 verified in the feedback table above
- Screenshots of analytics and transaction activity
- Updated README and documentation (`CONTRACT_INTEGRATION.md`)
- User feedback iteration summary — [Feedback → Improvements → Commits](#feedback--improvements--commits)

---

Built with ❤️ for the Stellar ecosystem.
