# AGENTS.md — Bucket Budget Engineering & Token-Efficiency Spec

Client-side, offline-first React + TypeScript + Vite + Tailwind v4 app for **3-tier hierarchical envelope budgeting**. No backend, no transaction queue, no infinite nesting.

---

## 1. Styling & UI Specification (Strict)

### Color Palette (4 Neutrals + 1 Accent)
- **Lightest Neutral**: `#F0EDE5` — App canvas, header, metric cards, Level 1 cards, inputs, modals, primary button ink.
- **Lighter Mid Tone**: `#C5C3BE` — Borders, dividers, Level 2 (`bg-[#C5C3BE]/22`) & Level 3 (`bg-[#C5C3BE]/40`) card surfaces, inset wells, unallocated bar segment, disabled text.
- **Darker Mid Tone**: `#2E2E2C` — Secondary text, uppercase field labels, action icons, Level 3 headings, Dedicated Fees bar segment, primary button hover.
- **Darkest Neutral**: `#1A1A18` — Primary headings/ink, primary buttons, modal headers, tooltips, drop indicators, active focus rings.
- **Single Accent (`#ed3f1c`)**: Reserved **exclusively** for the allocated portion of the pool allocation bar (and its legend dot) in `src/components/HeaderPoolBar.tsx`.
- **Forbidden**: Do **not** use `emerald-*`, `amber-*`, `rose-*`, `indigo-*`, `slate-*`, `bg-white`, or `text-white` anywhere in UI components.

### Typography
- Use **`Inter`** on every element (`index.html` Google Fonts + `src/index.css` `--font-sans` and `--font-mono` mapped to `Inter`).
- Never use `font-mono`; use `tabular-nums` for aligned numbers and formula previews.

### Icons & Buttons
- **No app icon** in the header and **no bucket icons** (`Layers`, `Layers3`, `Tag`, `Wallet`, etc.) on cards or empty states.
- **Addition buttons**: Text-only `"+ Action"` (e.g., `+ Root Bucket`, `+ Sub`, `+ Create First Root Bucket`). Never pair a `+` / `PlusCircle` icon with `+` text.

---

## 2. Architecture Map (Read Before Searching)

| File | Responsibility |
| :--- | :--- |
| `src/App.tsx` | Root state via `useBudgetHistory`, global `Ctrl+Z`/`Ctrl+Y` listener, autosave, modal orchestration |
| `src/hooks/useBudgetHistory.ts` | Undo/redo stacks (`MAX_HISTORY = 100`), `coalesceKey` session batching, `HistoryRevisionContext` |
| `src/utils/budgetCalculations.ts` | Pure tree ops (`calculateBucketTotals`, `addChildBucketToTree` w/ leaf explosion, `moveBucketInTree`, `removeBucketFromTree`) |
| `src/utils/mathParser.ts` | PEMDAS math expression evaluator (`evaluateMathExpression`, `hasMathExpression`, `cleanFloat`) |
| `src/utils/storage.ts` | `localStorage` persistence (`loadStoredData`, `saveBudgetData`), `.json` export/import, baseline reset |
| `src/components/HeaderPoolBar.tsx` | Branding, autosave badge, Undo/Redo buttons, `+ Root Bucket`, Data Backup menu, pool metrics & `#ed3f1c` bar |
| `src/components/BucketTree.tsx` | Search filter, level counts, expand/collapse all, root drop target |
| `src/components/BucketCard.tsx` | Recursive 3-tier card, inline rename, `MathInput` fields, drag-and-drop, mute/transfer/inspect/delete |
| `src/components/MathInput.tsx` | Formula-capable numeric input with `liveHistoryKey` coalescing & `HistoryRevisionContext` sync |
| `src/components/BucketModal.tsx` | Inspector modal; saves metadata + parent move atomically via `onSave(node, newParentId)` |
| `src/components/QuickTransferModal.tsx` | Inter-bucket fund transfer modal |
| `src/types.ts` | `BucketLevel` (`1 \| 2 \| 3`), `BucketNode`, `BudgetPreset`, `OverallTotals` |
| `src/data/initialData.ts` | Default baseline budget template |

### Critical Behavioral Invariants
1. **3-Tier Cap**: Depth is strictly `1 | 2 | 3`. Never allow Level 4.
2. **Leaf Explosion**: Adding the first child to a leaf bucket (`addChildBucketToTree(..., true)`) transfers the parent's `allocated` into the child and resets the parent's `allocated` to `0`.
3. **Undo/Redo Integrity**: Route every persistent mutation through `commitChange(updater, label, coalesceKey?)`. Live `MathInput` fields outside modals must pass `liveHistoryKey`.

---

## 3. Token Use Efficiency Protocol for Agents

1. **Skip Discovery Overhead**: Use the Architecture Map above to open only the exact file(s) needed. Do not run `list_dir` or broad codebase scans unless files were added or renamed.
2. **Never Read Heavy/Generated Files**: Exclude `package-lock.json`, `bun.lock`, `dist/`, `node_modules/`, and binary assets (`beautified-screenshot.png`) from reads and searches (`--exclude-dir=node_modules --exclude-dir=dist`).
3. **Single-Pass Reads**: Files in `src/` are small (30–515 lines). Read a needed file whole in one tool call rather than paging in small line slices.
4. **Surgical Edits Only**: Use `replace_file_content` or `multi_replace_file_content` on existing files; avoid full-file rewrites unless >60% of lines change.
5. **Parallelize Independent Calls**: Batch independent file reads, edits to different files, and final verification commands in the same turn.
6. **Defer Verification**: Complete all edits before verifying. Run `npm run lint` (`tsc --noEmit`) and `npm run build` once at the end. For style compliance, use one combined check:
   `grep -rnE "emerald|amber|rose|indigo|slate|bg-white|text-white|font-mono|PlusCircle|Wallet" src/`
7. **Concise Output**: Do not narrate tool calls, echo file contents, or restate unchanged behavior. Summarize only changes made and verification results.
