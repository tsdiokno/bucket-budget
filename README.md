# 🪣 Bucket Budget

A modern, offline-first, single-page application for hierarchical envelope budgeting. Organizes income into nested financial buckets with fee deductions, automated calculations, and zero backend server dependencies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)

---

## ✨ Features

- **Hierarchical Envelope Buckets**: Nest categories infinitely (e.g., *Housing* ➔ *Rent & Utilities* ➔ *Electricity*).
- **Live Allocation Pool**: Instant feedback on allocated funds vs. unallocated pool balances.
- **Local Transaction Ledger**: Log, filter, and assign expenses to specific buckets.
- **Debounced Autosave Engine**: Automatically saves changes locally (`localStorage`) with a live status badge and page unload flush listeners.
- **Data Portability**: Export and import full budget backups as single `.json` files anytime.
- **100% Offline-First**: Runs entirely inside your browser with no remote servers or tracking.

---

## 🚀 Standalone Single-File Distribution

Bucket Budget can be compiled into a **single, portable `.html` file** (`bucket-budget-standalone.html`) containing all React code, styling, and icons.

- **Zero Installation**: Download `bucket-budget-standalone.html` and double-click to run in any web browser.
- **Zero Server Required**: Works offline over `file:///` protocols without Node.js or web server runtime.

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

# Build production single-file distribution (outputs to dist/index.html)
npm run build
```

---

## 🤖 Automated GitHub Release Workflows

This repository includes a pre-configured GitHub Action (`.github/workflows/release-singlefile.yml`). 

Whenever a version tag (e.g., `v1.0.0`) is pushed or a GitHub Release is published, the pipeline automatically:
1. Builds the standalone `dist/index.html`.
2. Attaches `bucket-budget-standalone.html` directly as a downloadable asset on the release page.

---

## 🧰 Built With

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
