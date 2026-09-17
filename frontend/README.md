# fundsroom operations workspace

A responsive React + TypeScript prototype for a wholesale/distribution ERP. It currently demonstrates the main internal workflows with local state:

- Dashboard overview with customer, stock, challan, and follow-up summaries
- Customer CRM directory with search and add-customer modal
- Inventory catalogue with low-stock monitoring
- Sales challan list with draft confirmation and stock adjustment feedback
- Responsive desktop and mobile layout

## Run locally

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Current architecture

The repository currently contains the frontend only. Mock records and state live in `src/App.tsx` so the user-facing flow can be reviewed without a database or API server. The next production step is to extract the types and data operations into a Node.js/Express API backed by PostgreSQL, then replace the local state actions with authenticated REST requests.

## Production backend plan

The planned API should include JWT authentication with Admin, Sales, Warehouse, and Accounts roles; validated customer, product, stock movement, and challan resources; pagination and search; and a transaction for confirming a challan. That transaction must lock or re-check stock, reject negative inventory with HTTP 409, and persist product name, SKU, price, and quantity snapshots on each challan line.

Environment-specific API URLs and database credentials should be supplied through environment variables rather than committed files. A typical free deployment would use a static frontend host such as Vercel or Render, an Express service on Render or Railway, and PostgreSQL on Neon or Supabase.

## Known limitations

This submission is a frontend prototype: authentication, persistence, real REST APIs, PostgreSQL migrations, deployment, Postman collection, and role enforcement are not yet included in this workspace. The UI actions are intentionally local and reset on reload.
