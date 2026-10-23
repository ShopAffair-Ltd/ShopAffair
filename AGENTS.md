# Repository Guidelines

This document provides essential guidance for agents and contributors working on the ShopAffair project to ensure consistency, stability, and maintainability.

## Project Structure & Module Organization

The repository is split into a frontend and a backend:

- **`/Shop`**: React + Vite + TypeScript frontend.
  - `src/components`: UI components (divided by feature: `account`, `admin`, `layout`, `modals`, `ui`).
  - `src/context`: Global state management (Auth, Wallet, Trade, etc.).
  - `src/services`: API client and business logic wrappers.
  - `src/landing`: Landing page and associated sections.
- **`/backend`**: Node.js + Express + Prisma backend.
  - `src/modules`: Feature-based modules (auth, trades, payments, etc.) containing controllers and services.
  - `prisma/`: Database schema and migrations.

## Build, Test, and Development Commands

### Frontend (`/Shop`)
- `npm install`: Install dependencies.
- `npm run dev`: Start the development server on port 3000.
- `npm run build`: Create a production build in `/dist`.

### Backend (`/backend`)
- `npm install`: Install dependencies.
- `npm run dev`: Start the server in development mode.
- `npx prisma generate`: Regenerate Prisma client after schema changes.
- `npx prisma migrate dev`: Create and apply database migrations.

## Coding Style & Naming Conventions

- **Language**: TypeScript for both frontend and backend.
- **Naming**:
  - Components: PascalCase (e.g., `TradeView.tsx`).
  - Functions/Variables: camelCase (e.g., `handleTransfer`).
  - Services: camelCase with "Service" suffix (e.g., `paymentService.ts`).
- **Styling**: Tailwind CSS is used exclusively for the frontend.
- **Formatting**: Maintain 2-space indentation.

## Commit & Pull Request Guidelines

- **Commits**: Use descriptive, imperative messages (e.g., `fix: resolve JSX error in TransferModal`).
- **PRs**: 
  - Describe the change clearly.
  - Link any related issues or documentation.
  - Provide screenshots for UI/UX changes.

## Agent-Specific Instructions

When modifying the codebase:
1. **Verify JSX**: Ensure all tags are properly closed to avoid Vite build failures.
2. **Type Safety**: Avoid using `any`; define interfaces in `src/types` or local files.
3. **State Flow**: When adding features, check the relevant `Context` first before creating new local states.
