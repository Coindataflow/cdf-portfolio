# CDF Portfolio

Portfolio module for [CoinDataFlow](https://coindataflow.com). This repository contains the mobile app implementation in JavaScript (Vue 3), designed for smartphones and used together with the CoinDataFlow backend.

---

## Tech stack

- **Vue 3** (composition-friendly, `createApp`, ES modules)
- **ECharts** — charts (historical performance, pie chart, range chart)
- **Vanilla JS** — no separate build in this repo; modules are loaded in the main site’s environment

---

## Project structure

| File | Purpose |
|------|---------|
| `index.js` | Entry point, re-exports the app |
| `app.js` | Vue app init, portfolio widget, charts, state, API calls |
| `api.js` | API layer: portfolios, assets, transactions (create, update, delete) |
| `utils.js` | Utilities (e.g. `myDebounce`) |
| `list.js` | Portfolio list component (Portfolio List) |
| `manage-list.js` | Edit portfolio list (rename, order, delete) |
| `create.js` | Create/edit portfolio (name, description, color) |
| `confirm-delete-portfolio.js` | Confirm portfolio deletion |
| `confirm-delete-asset.js` | Confirm asset deletion |
| `confirm-delete-tx.js` | Confirm transaction deletion |
| `transaction-modal.js` | Add/edit transaction modal (buy/sell) |
| `assets-list.js` | Portfolio assets list and asset picker when adding a transaction |
| `share.js` | Portfolio sharing (enable public link, copy URL) |
| `settings.js` | Portfolio settings modal |
| `datetime-picker.js` | Date/time picker for transactions |

---

## Current features

1. **Multiple portfolios per account** — Create, switch, edit, and delete portfolios; list shown in the “Portfolio List” modal.
2. **Portfolio sharing** — Make a portfolio public and share a link (Sharing button).
3. **Performance summary panel** — Current balance, total profit/loss (Total Profit), realised profit (Realised Profit), unrealised profit (Unrealised Profit), total invested (Total Invested); period selector (24h, 7d, 1m, 3m, 6m, 1y, ytd).
4. **Historical performance chart** — Portfolio value over time with ranges 24h, 7d, 1m, 3m, 6m, 1y, ytd, all; transaction markers (buy/sell); bottom range chart for period selection.
5. **Pie chart** — Visual asset allocation with legend (including “Other assets”).
6. **Portfolio assets list** — Table of assets with price, period change, period profit, invested amount, average price, current profit, holdings; “Small balances” toggle; remove asset.
7. **Portfolio transactions list** — Table of transactions (type, asset, date, quantity, price, total); edit and delete transactions; pagination.
8. **Real-time data updates** — Periodic refresh of portfolio list and assets (30-second interval); on tab focus, chart refresh after long absence.

Additionally: guest mode (token in `localStorage`), public portfolio view by link (`public_key`), and a stub for asset types (e.g. “Stock” when `_portfolioStocksEnabled`).

---

## Planned development

- **New asset types** — Stocks, forex, commodities, etc. (code already has a Crypto/Stock type selector stub in `assets-list.js`).
- **Alerts** — Notifications for portfolio and assets.
- **Tax calculation** — Reporting and calculations for tax purposes.
- **Deep analytics** — Extended analytics for portfolio and assets.

---

## Integration and run

The module is intended to be embedded in the main CoinDataFlow site:

- The page must provide app containers (e.g. `#pf`, `#pf-widget`, and optionally `#pf-widget-mobile`, `#pf-add-asset`).
- Entry scripts (e.g. from `index.js` / `app.js`) are loaded and `initPortfolioApp()` is called (and `initPortfolioWidget()` if needed).
- The backend must expose API at paths like `/en/api/portfolio`, `/en/api/portfolio-asset/`, `/en/api/portfolio-tx/`, `/en/api/portfolio/{id}/chart`, etc.; guest auth via `X-Guest-Token` header.
- Styles, icons (SVG sprite), and portfolio page markup live in the main site project and are not part of this repository.

---

## Links

- Site: [coindataflow.com](https://coindataflow.com)

---

*CDF Portfolio — client-side only; backend and full site build are not included.*
