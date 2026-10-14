# 🪣 Bucket Budget

A fast, offline-first envelope budgeting tool built on an opinionated **3-tier hierarchy**. Direct your income into structured buckets with explicit fee accounting, inline PEMDAS math, and zero server dependencies.

![Bucket Budget Preview](./beautified-screenshot.png)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)

---

## 🧭 Financial Philosophy & Core Assumptions

Bucket Budget is intentionally **opinionated and prescriptive**. It is built on five financial management assumptions:

1. **Finite, Zero-Sum Allocation**: Money is limited. Every dollar assigned to a bucket directly claims a portion of the shared pool. You allocate funds before spending, not as an afterthought.
2. **Strict 3-Tier Structure (Not Infinite)**: Unbounded nesting breeds chaos; flat lists obscure hierarchy. Exactly three tiers (Tier 1: Master Pillar ➔ Tier 2: Category ➔ Tier 3: Line Item) enforce discipline and prevent decision fatigue.
3. **Intentional Planning Over Bookkeeping**: This is a forward-looking allocation engine, not a receipt-tracking log. It rejects tedious transaction queues in favor of high-level fund distribution and inter-bucket transfers.
4. **Explicit Overhead & Fees**: Hidden transaction fees, escrow, and administrative overhead must be isolated alongside allocations rather than buried inside net line items.
5. **Dynamic Solvency Testing**: Budgets must adapt to adversity. Buckets can be muted on the fly to simulate "what-if" cutbacks and emergency scenarios without dismantling your baseline plan.

---

## 💡 Practical Use Cases

- **Individuals & Households**: Zero-based envelope budgeting, sinking funds for annual obligations, fee-separated living expenses, and "what-if" contingency modeling.
- **Freelancers & Solopreneurs**: Partitioning variable client invoices into tax reserves, operational overhead, and owner compensation (Profit First).
- **Small Teams & Projects**: Managing departmental allotments or event/renovation cost scopes under a hard financial ceiling.
- **Nonprofits**: Ring-fencing restricted donor funds with auditable administrative fee ratios and offline JSON exports.

---

## ✨ Key Features

- **3-Tier Tree**: Master pillars, sub-categories, and leaf line items with automatic rollup totals.
- **Live Pool Balance**: Real-time visibility into allocated funds, dedicated fees, and unallocated surplus or deficit.
- **Inline PEMDAS Arithmetic**: Type math expressions directly into any amount field (e.g., `(1200 - 150) * 0.9` or `450 + 25 * 3`).
- **Drag-and-Drop Rebalancing**: Shift funds between buckets seamlessly or use the quick transfer dialog.
- **100% Offline & Private**: Debounced `localStorage` autosave, unload flush protection, and single-file `.json` backup/restore.

---

## 🚀 Quickstart

Run locally or compile into a **single, portable `.html` file** that works anywhere without a web server:

```bash
# Clone & install
git clone https://github.com/your-username/bucket-budget.git
cd bucket-budget
npm install

# Start local dev server (port 3000)
npm run dev

# Build standalone distribution
npm run build
```

---

## 📄 License

Distributed under the MIT License.
