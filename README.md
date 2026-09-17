# Northstar Supply ERP

A PERN-style manufacturing and supply workflow application covering customer enquiries, quotations, sales orders, inventory reservation, and dispatch.

## Live Deployment

- Frontend: https://frontend-ochre-pi-68.vercel.app/
- Backend health: https://backend-kappa-two-35.vercel.app/api/health
- Repository: https://github.com/goutham1703/fundsroom2

## Stack

- Frontend: React 19, TypeScript, Vite
- Backend: Node.js, Express, JWT
- Database layer: Prisma with PostgreSQL support
- Password hashing: bcryptjs
- Deployment: Vercel

## Project Structure

```text
backend/
  api/index.js             Express API and authentication
  prisma/schema.prisma     PostgreSQL data model
  prisma/seed.js           Admin and sales user seed
  .env.example             Backend environment template
frontend/
  src/App.tsx              ERP UI and API integration
  src/App.css              Application styling
```

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:4000` by default. To connect the frontend to it, create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:4000
```

## PostgreSQL Setup

Copy `backend/.env.example` to `backend/.env` and configure:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/northstar_erp?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_SIGNUP_CODE="replace-with-an-admin-invite-code"
```

Apply the schema and create the initial accounts:

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

Without `DATABASE_URL`, the API uses demo in-memory records for local and hosted demonstrations.

## Demo Accounts

- Admin: `admin@northstar.in` / `admin123`
- Sales user: `sales@northstar.in` / `sales123`

New accounts can be created from the Sign up screen. Administrator registration requires `ADMIN_SIGNUP_CODE`; new public accounts default to `SALES_USER` unless the valid admin invite code is supplied.

## API Endpoints

- `GET /api/health` - service health check
- `POST /api/auth/login` - sign in and receive a JWT
- `POST /api/auth/signup` - create a sales or invited admin account
- `GET /api/workflow/:resource` - read protected workflow records
- `PATCH /api/workflow/:resource/:id/advance` - advance a workflow record with RBAC

## Validation

```bash
cd frontend
npm run lint
npm run build
```

The backend entrypoint and seed script can be checked with Node, and the Prisma schema can be validated with:

```bash
cd backend
npx prisma validate
```
