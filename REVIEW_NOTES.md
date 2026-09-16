# Code Review Notes

This cleaned version keeps the existing OmniPOS behavior while making the repository easier to maintain and safer to showcase.

## Structural changes

- Reorganized the React frontend into feature-first folders under `src/features`.
- Moved shared layout, styles, formatters, services, and types into stable shared locations.
- Added the `@/` TypeScript/Vite import alias to reduce fragile relative imports.
- Moved analytics files out of unrelated customer/order folders into `features/analytics`.
- Moved backend configuration/database code into `app/core`.
- Corrected Python package filenames from `_init_.py` to `__init__.py`.
- Moved the one-time SQLite migration utility into `backend/scripts`.
- Removed unused Vite starter assets and unused `App.css` from the cleaned package.

## Code fixes

- Fixed React hook/lint issues in initial data-loading effects.
- Made the frontend API base URL configurable with `VITE_API_URL`.
- Added input validation for product price/stock and checkout/restock quantities.
- Normalized product SKU and customer email input.
- Fixed a checkout edge case where duplicate rows for the same product could oversell inventory.
- Added product row locking during checkout where supported by the database.
- Added eager loading for order customer/items to avoid unnecessary N+1 queries.
- Limited dashboard 7-day analytics/top-products queries to dates through today.
- Removed automatic table creation from FastAPI startup so Alembic remains the schema source of truth.
- Made CORS origins configurable through environment variables.

## Validation performed

- Frontend TypeScript typecheck: passed.
- Frontend ESLint: passed with zero errors.
- Backend `compileall`: passed.
- Backend smoke test: health endpoint, product creation, quantity validation, duplicate-product checkout protection, online checkout, and inventory deduction passed using a temporary SQLite database.

## Intentionally excluded from the cleaned repository

- `backend/.env`
- `backend/.venv/`
- `backend/omnipos.db`
- `frontend/node_modules/`
- Python cache folders and generated build output

Use the provided `.env.example` and dependency manifests to recreate local environments.
