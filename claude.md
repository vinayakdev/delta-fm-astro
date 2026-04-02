## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

## 🗂️ Delta Exchange Fund Manager — Project Plan

### Tech Stack

- **Framework**: SvelteKit
- **UI Components**: shadcn-svelte
- **Styling**: Tailwind CSS
- **Data Storage**: Local JSON file (server-side, `/src/lib/data/accounts.json`)
- **API**: Delta Exchange REST API v2 (`https://api.delta.exchange/v2`)
- **Auth**: None for now (added later)
- **Git**: Local only, no GitHub push

---

### Project Structure

```
fund-manager/
├── src/
│   ├── lib/
│   │   ├── data/
│   │   │   └── accounts.json        ← stores API keys + names
│   │   ├── server/
│   │   │   ├── accounts.ts          ← read/write JSON helpers
│   │   │   └── delta.ts             ← Delta Exchange API client (signs requests)
│   │   └── components/              ← shared UI components
│   ├── routes/
│   │   ├── +layout.svelte           ← sidebar nav shell
│   │   ├── +page.svelte             ← dashboard / overview
│   │   ├── accounts/
│   │   │   └── +page.svelte         ← manage API keys
│   │   ├── positions/
│   │   │   └── +page.svelte         ← open positions per account
│   │   ├── orders/
│   │   │   └── +page.svelte         ← active orders
│   │   └── wallet/
│   │       └── +page.svelte         ← wallet balances
├── .gitignore
└── package.json
```

---

### Phase Roadmap

#### ✅ Phase 1 — Foundation (Build First)

1. Init SvelteKit + shadcn-svelte + Tailwind
2. Admin shell layout with sidebar navigation
3. Git init + first commit

#### ✅ Phase 2 — Account Manager Page

- Add/remove accounts (name + API key + API secret)
- Stored in `accounts.json` via SvelteKit server actions
- Display accounts in a table with edit/delete
- Mask secrets by default (show/hide toggle)

#### 🔲 Phase 3 — Delta API Integration Layer

- Server-side `delta.ts` helper that:
  - Signs requests using HMAC SHA256 (as per Delta Exchange auth docs)
  - Accepts account key to fetch from JSON
  - Wraps common endpoints: wallet, positions, orders

#### 🔲 Phase 4 — Dashboard

- Overview cards per account: total balance, open positions count, PnL
- Account selector / tabs

#### 🔲 Phase 5 — Positions Page

- View open positions per account or all accounts
- Product name, size, entry price, mark price, unrealized PnL

#### 🔲 Phase 6 — Orders Page

- Active orders per account
- Cancel order action

#### 🔲 Phase 7 — Wallet Page

- Wallet balances per asset per account
- Transaction history

#### 🔲 Phase 8 — Auth (Later)

- Add SvelteKit session-based login
- Protect all routes

---

### Git Strategy

- `git init` on project creation, no remote added
- Commit after each phase you verify and approve
- `.gitignore` will include `node_modules`, `.env`, but **not** `accounts.json` (since it's intentionally local-only and there's no remote)
