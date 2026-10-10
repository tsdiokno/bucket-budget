# 🪣 Bucket Budget

A modern, offline-first, single-page application for structured envelope budgeting. Organizes income into an intuitive **3-tier hierarchical bucket tree** with dedicated fee accounting, inline PEMDAS math calculation, inter-bucket fund rebalancing, and zero backend server dependencies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)

---

## ✨ Features

- **3-Tier Hierarchical Buckets**: Structured 3-level envelope tree (Tier 1: Master Pillar ➔ Tier 2: Functional Area ➔ Tier 3: Specific Line Item). Keeps budgeting structured, disciplined, and readable without unbounded, unwieldy nesting.
- **Live Allocation Pool**: Real-time pool bar showing total available funds, allocated amounts, explicit fee deductions, and remaining unallocated balance.
- **Inline PEMDAS Math Engine**: Type arithmetic directly into any numeric field (e.g., `(1200 - 150) * 0.9` or `450 + 25 * 3`) with instant evaluation on Enter or blur.
- **Dynamic Scenario Muting**: Instantly mute or unmute any bucket to exclude its funds from calculations and run "what-if" scenarios.
- **Fund Transfers & Rebalancing**: Transfer funds between buckets via quick drag-and-drop or the transfer dialog.
- **Debounced Autosave Engine**: Automatically persists state to `localStorage` with a 250ms debounce, page unload flush listeners (`beforeunload`, `pagehide`), and a live status badge.
- **Data Portability**: Export and import full budget backups as single `.json` files anytime.
- **100% Offline-First**: Runs entirely in the client browser with zero server dependencies, telemetry, or tracking.

---

## 💡 Practical Financial Management Use Cases

### For Individuals & Households
- **Zero-Based Envelope Budgeting**: Allocate 100% of monthly take-home pay down to zero unallocated dollars across living essentials, debt reduction, savings goals, and discretionary spending.
- **Granular Expense & Fee Tracking**: Separate core expenses from hidden costs by dedicating fee lines to HOA dues, escrow fees, service subscriptions, and banking charges.
- **"What-If" Scenario Planning**: Toggle bucket muting to simulate sudden life changes (e.g., test how eliminating dining out or gym memberships affects emergency fund burn rates during a career transition).
- **Variable Income & Paycheck Distribution**: Freelancers and commission-based earners can enter variable monthly earnings into the pool bar and distribute funds strictly by hierarchy and priority.
- **Savings Goals & Sinking Funds**: Build structured sinking funds (e.g., *Future Planning* ➔ *Annual Expenses* ➔ *Car Insurance / Holiday Travel*) with progress bars and rollups.

### For Others (Freelancers, Small Businesses, Project Managers & Nonprofits)
- **Freelancers & Solopreneurs (Profit First / Tax Reserves)**: Partition gross invoice receipts into fixed business percentages (e.g., Tier 1: *Gross Revenue* ➔ Tier 2: *Tax Withholding / Operating Expenses / Owner Draw* ➔ Tier 3: *Software Tools, CPA, Hardware*).
- **Small Business Departmental Allotments**: Allocate an operating budget across teams (e.g., *Marketing* ➔ *Paid Ads / Creative Production*; *Operations* ➔ *Logistics / Facilities*) within a hard spending ceiling.
- **Project & Event Financial Scoping**: Model clear cost breakdowns for events, client deliverables, or construction/renovation projects with strict tier boundaries and real-time fee tracking.
- **Nonprofits & Grant Allocation**: Ring-fence restricted donor or grant funding into designated program categories and track overhead/administrative fee percentages with offline, auditable `.json` export records.

---

## 🚀 Standalone Single-File Distribution

Bucket Budget can be compiled into a **single, portable `.html` file** (`bucket-budget-standalone.html`) containing all React code, styling, and icons.

- **Zero Installation**: Download `bucket-budget-standalone.html` and double-click to run in any modern web browser.
- **Zero Server Required**: Operates offline over `file:///` protocols without Node.js or web server runtime.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.x or later
- **npm**: v9.x or later

### Installation
```bash
# Clone repository
git clone https://github.com/your-username/bucket-budget.git
cd bucket-budget

# Install dependencies
npm install

# Start local dev server (port 3000)
npm run dev
```

### Build & Lint
```bash
# Verify TypeScript types and code formatting
npm run lint

# Build production distribution
npm run build
```

---

## 🧰 Built With

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
