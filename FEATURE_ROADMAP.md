# SplitStellar — Premium Feature Roadmap

## Current State Analysis

**What exists:**
- Basic pool creation and joining
- Equal-split expense logging
- Simple settlement calculator
- XLM-only payments
- Dark/light theme
- Basic toast notifications

**What's missing for "premium":**
- No expense categorization
- Only equal splits (no percentage/exact/shares)
- No real-time collaboration
- No smart suggestions
- No export/reporting
- No multi-currency
- No keyboard shortcuts
- No command palette
- No skeleton loading states
- No undo/redo
- No expense comments

---

## TIER 1: Immediate Premium UX (Week 1-2)

### 1. Command Palette (Cmd+K)
**What:** Spotlight-style command palette for power users
- Quick navigate: "Go to pool X"
- Quick action: "Log expense", "Settle up"
- Search: Find expenses by description, payer, amount
- Keyboard-first: No mouse needed

**Why premium:** Linear, Vercel, Raycast all have this. It signals "built for professionals."

### 2. Skeleton Loading States
**What:** Replace generic spinners with content-shaped skeletons
- Pool list skeleton (3-4 cards)
- Expense list skeleton (5-6 rows)
- Profile skeleton
- Dashboard skeleton

**Why premium:** Shows attention to detail. Feels faster even when loading.

### 3. Expense Categories with Icons
**What:** Categorize expenses with visual icons
- Food & Dining 🍕
- Transport 🚗
- Accommodation 🏨
- Entertainment 🎬
- Shopping 🛒
- Bills & Utilities 💡
- Health 🏥
- Other 📦

**Why premium:** Users can see spending breakdown at a glance. Enables analytics.

### 4. Smart Split Types
**What:** Beyond equal splits
- **Equal** — Split evenly (current)
- **Percentage** — 60/40, 70/30 etc.
- **Exact** — User specifies exact amounts
- **Shares** — 2 shares vs 1 share etc.

**Why premium:** Real-world flexibility. Covers all splitting scenarios.

### 5. Expense Comments/Notes
**What:** Add context to expenses
- "This was for the AirBnB deposit"
- "Includes tip"
- "Paid via card, will settle later"

**Why premium:** Reduces confusion. Creates audit trail.

### 6. Undo/Redo for Expense Logging
**What:** Cmd+Z to undo last expense
- Toast with "Undo" action button
- 5-second window to undo
- Visual confirmation

**Why premium:** Removes anxiety of making mistakes.

---

## TIER 2: Smart Features (Week 3-4)

### 7. Smart Settlement Algorithm
**What:** Minimize number of transactions
- Currently: A owes B $10, B owes C $10, C owes A $10 → 3 transactions
- Smart: A pays C $10 → 1 transaction

**Algorithm:** Debt simplification using maximum flow / minimum transactions
- Calculate net balance per person
- Match largest debtor to largest creditor
- Repeat until all settled

**Why premium:** Saves time and transaction fees. Shows intelligence.

### 8. Real-Time Collaboration
**What:** Live updates when others add expenses
- WebSocket/SSE for instant updates
- "X just logged an expense" notification
- Live balance updates
- Member activity indicators

**Why premium:** Feels alive. Competitive with Venmo/Zelle.

### 9. Currency Selector with Live Rates
**What:** Log expenses in any currency
- XLM, USDC, EURC, BTC, ETH
- Live exchange rates from Stellar DEX
- Convert and display in user's preferred currency
- Show conversion before logging

**Why premium:** True cross-border capability. Solves real problem.

### 10. Expense Receipts/Attachments
**What:** Attach photos to expenses
- Camera capture
- Image upload
- Store on IPFS or Supabase Storage
- View in expense detail

**Why premium:** Proof of purchase. Professional expense tracking.

### 11. Pool Templates
**What:** Pre-configured pool setups
- "Trip to Bali" template (categories, split type)
- "Monthly Rent" template (recurring, fixed amounts)
- "Team Project" template (percentage splits)
- Custom templates

**Why premium:** Saves setup time. Power user feature.

### 12. Export to CSV/PDF
**What:** Generate expense reports
- CSV for spreadsheets
- PDF for receipts/invoices
- Filtered by date, category, payer
- Formatted with totals and breakdowns

**Why premium:** Business use case. Tax preparation.

---

## TIER 3: Premium Analytics (Week 5-6)

### 13. Spending Insights Dashboard
**What:** Visual analytics beyond raw data
- Spending by category (pie chart)
- Spending over time (line chart)
- Top spenders (bar chart)
- Average expense size
- Most frequent categories
- Monthly/yearly trends

**Why premium:** Data-driven decisions. Personal finance insights.

### 14. Pool Health Score
**What:** gamified pool status
- Settlement rate (% settled vs outstanding)
- Average time to settle
- Member activity score
- "Health: Excellent" / "Needs attention"

**Why premium:** Gamification. Encourages prompt settlement.

### 15. Member Profiles with Stats
**What:** Rich member information
- Total contributed
- Total owed/owes
- Settlement history
- Average expense size
- Member since date
- Activity badges

**Why premium:** Social proof. Trust building.

### 16. Achievement Badges
**What:** Gamification elements
- "First Expense" — Logged first expense
- "Settler" — Settled all debts
- "Streak" — 7-day activity streak
- "Big Spender" — Logged 10+ expenses
- "Early Adopter" — Joined in first month

**Why premium:** Engagement. Fun factor.

---

## TIER 4: Advanced Features (Week 7-8)

### 17. Recurring Expenses
**What:** Automated recurring entries
- Monthly rent
- Weekly subscriptions
- Annual memberships
- Auto-log on schedule
- Reminder notifications

**Why premium:** automation. Reduces manual work.

### 18. Budget Limits per Pool
**What:** Set spending limits
- Pool-level budget
- Category-level budgets
- Alerts when approaching limit
- Block expenses over limit

**Why premium:** Financial control. Prevents overspending.

### 19. Payment Reminders
**What:** Gentle nudges for unsettled debts
- Configurable reminder schedule
- Email/push notifications
- Escalating urgency
- "X has been waiting for 3 days"

**Why premium:** Gets money moving. Reduces awkwardness.

### 20. QR Code Pool Joining
**What:** Scan to join
- Generate QR code for pool
- Mobile camera scanning
- Instant join on scan
- Works offline

**Why premium:** Physical world integration. Event-friendly.

### 21. Dark/Light Theme Improvements
**What:** Enhanced theme system
- System preference detection
- Automatic switching based on time
- Custom accent colors
- High contrast mode
- Theme preview in settings

**Why premium:** Personalization. Accessibility.

### 22. Keyboard Shortcuts
**What:** Power user navigation
- `⌘+K` — Command palette
- `⌘+N` — New expense
- `⌘+Shift+S` — Settle up
- `⌘+/` — Help/shortcuts
- `Esc` — Close modal

**Why premium:** Speed. Professional feel.

### 23. Toast Notifications with Actions
**What:** Interactive notifications
- "Expense logged. [Undo]"
- "New join request. [Approve]"
- "Settlement received. [View]"
- Swipe gestures on mobile

**Why premium:** Context-aware. Actionable.

---

## TIER 5: Business/Pro Features (Future)

### 24. Invoice Generation
**What:** Professional invoices
- PDF invoices with branding
- Line items from expenses
- Tax calculations
- Payment terms

### 25. Receipt Scanning (OCR)
**What:** Camera → auto-fill
- Point camera at receipt
- Auto-extract amount, date, merchant
- Suggest category
- Attach original image

### 26. Integration with Accounting
**What:** Export to QuickBooks/Xero
- API integration
- Auto-categorize for tax
- Expense reports
- Audit trail

### 27. Multi-Language Support
**What:** i18n
- English, Spanish, French, German, Japanese
- RTL support
- Localized currencies
- Cultural formatting

### 28. PWA + Offline Mode
**What:** Installable app
- Add to home screen
- Offline expense logging
- Sync when online
- Background updates

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Command Palette | High | Medium | P0 |
| Skeleton Loading | Medium | Low | P0 |
| Expense Categories | High | Low | P0 |
| Smart Split Types | High | Medium | P0 |
| Expense Comments | Medium | Low | P1 |
| Smart Settlement | High | High | P1 |
| Real-Time Collab | High | High | P1 |
| Currency Selector | High | Medium | P1 |
| Spending Insights | High | Medium | P2 |
| Achievement Badges | Medium | Medium | P2 |
| Recurring Expenses | High | Medium | P2 |
| Budget Limits | Medium | Medium | P2 |
| QR Code Joining | Medium | Low | P2 |
| Keyboard Shortcuts | Medium | Low | P2 |
| Export CSV/PDF | High | Medium | P2 |
| Receipt Scanning | Medium | High | P3 |
| PWA/Offline | High | High | P3 |

---

## Premium UX Micro-Interactions

### 1. Hover Effects
- Pool cards: Subtle scale + shadow
- Buttons: Color shift + underline
- Icons: Rotation on hover
- Links: Underline animation

### 2. Transitions
- Page transitions: Slide + fade
- Modal: Scale + blur background
- Toast: Slide in from right
- Skeleton: Shimmer animation

### 3. Loading States
- Buttons: Spinner replaces text
- Cards: Skeleton placeholders
- Data: Progressive loading
- Images: Blur-up effect

### 4. Feedback
- Success: Green toast + checkmark
- Error: Red toast + retry button
- Warning: Amber toast + info
- Info: Blue toast + link

### 5. Personalization
- Remember last split type
- Remember preferred currency
- Recent pools quick access
- Favorite categories

---

## Technical Implementation Notes

### For Command Palette
- Use `cmdk` library (same as Vercel)
- Keyboard event handling
- Fuzzy search with `fuse.js`
- Recent commands history

### For Skeleton Loading
- Create skeleton components per layout
- Match exact dimensions of content
- Shimmer animation with CSS
- Conditional rendering based on loading state

### For Real-Time
- Supabase Realtime (already using Supabase)
- Or WebSocket with custom server
- Optimistic updates for instant feedback
- Conflict resolution for concurrent edits

### For Smart Settlement
- Implement min-transactions algorithm
- Graph theory: Maximum matching
- Visual debt simplification diagram
- Step-by-step settlement guide
