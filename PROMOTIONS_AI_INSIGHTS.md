# OmniPOS Zero — Promotions + AI Insights

Complete drop-in for both features. Folder layout here mirrors
your repo, so each file goes to the matching path.

Already verified: `tsc -b` clean, `eslint` clean, insights engine
run against your real order history (604 completed orders in the
last 30 days).

---

## Backend

| File in this package | Goes to |
|---|---|
| `backend/app/models.py` | `backend/app/models.py` (replace) |
| `backend/app/schemas.py` | `backend/app/schemas.py` (replace) |
| `backend/app/main.py` | `backend/app/main.py` (replace) |
| `backend/app/services/promotion_service.py` | new file |
| `backend/app/services/insights_service.py` | new file |
| `backend/app/routers/promotions.py` | new file |
| `backend/app/routers/insights.py` | new file |

The three replaced files are your existing content plus the new
sections — nothing removed.

### Migration

From `backend`, venv activated:

```powershell
python -m alembic revision --autogenerate -m "add promotions"
```

Open the generated file in `alembic/versions/` before applying.
It should create only the `promotions` table, and `down_revision`
should be `9e1026595bdc`. Delete any `drop_table` or `drop_column`
lines autogenerate adds — those come from Supabase schema drift,
not from this change.

```powershell
python -m alembic upgrade head
```

---

## Frontend

| File in this package | Goes to |
|---|---|
| `frontend/src/shared/lib/apiClient.ts` | replace |
| `frontend/src/app/App.tsx` | replace |
| `frontend/src/components/layout/AppLayout.tsx` | replace |
| `frontend/src/features/promotions/**` | new feature folder |
| `frontend/src/features/insights/**` | new feature folder |

Easiest: copy `frontend/src` from this package over your
`frontend/src`. Only those five paths are touched — no other
feature is modified, and no CSS changes are needed (every class
used already exists in `styles/index.css`).

### What changed in the three replaced files

- `apiClient.ts` — returns early on `204 No Content` so
  `DELETE /promotions/{id}` doesn't crash on an empty body.
- `App.tsx` — added lazy imports and routes for `/promotions`
  and `/insights`.
- `AppLayout.tsx` — replaced both "Soon" placeholders with real
  `NavLink`s, and fixed the stray indentation on the Analytics
  link.

---

## Verify

1. Restart uvicorn. Open `http://127.0.0.1:8001/docs` — you should
   see **Promotions** and **AI Insights** sections.
2. `GET /insights/` should return several insights.
3. Restart the Vite dev server (`npm run dev`).
4. Open **AI Insights** in the sidebar. Press **Save as draft
   promotion** on any suggestion.
5. Open **Promotions**. The draft is there with an `AI` badge.
   Press **Approve** — it flips to `ACTIVE`, and to `Running` if
   the current time falls inside its window.

---

## How the insights engine works

Five rules run over the last 30 days of completed orders. Each
returns a finding plus, where an action makes sense, a ready
`DRAFT` promotion payload. Nothing is ever applied automatically.

| Rule | Fires when | Suggests |
|---|---|---|
| `stock_risk` | A top-5 seller is at or below 10 units | Nothing — restock first |
| `weak_hours` | A 3-hour block earns under 60% of the average trading hour | 15% off, online, that window |
| `slow_movers` | Product sold ≤5 units while holding ≥20 stock | 20% off that product |
| `channel_gap` | Online is under 30% of revenue | 10% off, online only |
| `dormant_customers` | Customers inactive over 45 days | 12% win-back offer |

`stock_risk` runs first on purpose. Driving demand you can't
fulfil costs more than it earns, so a stock warning should be
read before any promotion suggestion.

Thresholds are constants at the top of `insights_service.py` —
`LOOKBACK_DAYS`, `WEAK_HOUR_RATIO`, `SLOW_MOVER_MAX_UNITS`, and
the rest. Tune them there, not in the rule bodies.

### What it found in your data

- **Stock risk** — Chicken Adobo Rice Bowl (125 sold, 9 left) and
  Barako Brewed Coffee (101 sold, 7 left)
- **Weak hours** — 06:00–08:00 runs about 47% below your average
  trading hour
- **Slow mover** — Hot Tsokolate: 96 units in stock, 3 sold
- **Dormant** — 3 of 60 customers inactive past 45 days

`channel_gap` did not fire, meaning your online share is already
above 30%.
