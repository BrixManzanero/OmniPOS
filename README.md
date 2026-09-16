# OmniPOS Zero

OmniPOS Zero is a full-stack omnichannel point-of-sale portfolio project built for small retail and food businesses.

The goal of the project is to connect physical POS transactions and online ordering in one system while sharing the same products, inventory, customers, orders, and analytics data.

## Project Context

Many small businesses handle physical sales, online orders, inventory, and reporting using separate tools or manual spreadsheets.

OmniPOS Zero was built to explore how these workflows can be combined into one application.

A sale made through the physical POS or online storefront updates the same inventory and contributes to the same customer, order, dashboard, and analytics data.

The project also focuses on building a cleaner foundation for future AI-assisted business recommendations.

## Core Features

- Physical POS checkout
- Customer-facing online storefront
- Shared inventory across POS and online orders
- Product and stock management
- Inventory movement tracking
- Customer profiles and purchase history
- POS and online sales tracking
- Dashboard metrics
- Revenue forecasting
- Date-range analytics
- Current vs previous period comparisons
- Customer segmentation
- Product performance analysis
- POS vs online channel analysis
- Periodic dashboard and analytics refresh

## Analytics

The analytics module supports:

- Today
- Last 7 days
- Last 30 days
- Custom date ranges

For multi-day periods, the selected range is compared with the immediately preceding equivalent period.

Examples:

```text
Last 7 Days
vs
Previous 7 Days
```

```text
Last 30 Days
vs
Previous 30 Days
```

For `Today`, previous-period indicators are intentionally hidden so the page focuses only on current-day activity.

Analytics currently covers:

- Revenue
- Orders
- Average order value
- Units sold
- Daily sales activity
- Top products
- Customer segments
- POS vs online performance
- Period comparison

## Planned AI Features

OmniPOS Zero is being designed to support AI-assisted business recommendations using sales, inventory, customer, and time-based data.

Planned capabilities include:

- Detecting weak sales periods
- Suggesting promotions during low-sales hours
- Recommending discounts or product bundles
- Identifying slow-moving products
- Suggesting online promotions based on recent performance
- Considering inventory levels before suggesting campaigns
- Highlighting unusual sales patterns
- Generating actionable business recommendations for store operators

### Example AI Recommendation

If sales are consistently weak between 2:00 PM and 4:00 PM, OmniPOS Zero could recommend a limited-time online promotion for that period.

```text
Sales + Inventory + Time Patterns
              ↓
        AI Analysis
              ↓
Business Recommendation
              ↓
Suggested Promotion
              ↓
Merchant Approval
              ↓
Online Campaign
```

AI-generated recommendations are intended to remain merchant-controlled.

Promotions, discounts, or pricing changes should require approval before being applied.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

### Database

- PostgreSQL
- Supabase

## Application Flow

```text
Physical POS ──────┐
                   │
Online Store ──────┼──→ FastAPI Backend
                   │         ↓
                   │     SQLAlchemy
                   │         ↓
                   └──→ PostgreSQL / Supabase
                              ↓
                    Dashboard + Analytics
```

Both POS and online transactions use the same backend and database.

This allows inventory, orders, customer activity, and analytics to stay consistent across channels.

## Order Model

OmniPOS supports both physical and online transactions.

```text
customer_id = null + POS
→ Physical walk-in customer

customer_id = value + POS
→ Registered physical customer

customer_id = null + ONLINE
→ Online guest

customer_id = value + ONLINE
→ Registered online customer
```

The `order_channel` field identifies whether an order came from the physical POS or the online storefront.

## Backend Setup

From the `backend` directory:

```powershell
cd backend
```

Create the virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create the local environment file:

```powershell
copy .env.example .env
```

Configure the PostgreSQL connection:

```env
DATABASE_URL=your_database_connection_string
```

Run the latest migrations:

```powershell
python -m alembic upgrade head
```

Start the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

API:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

From the `frontend` directory:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create the local environment file:

```powershell
copy .env.example .env
```

Configure the backend URL if needed:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Quality Checks

### Frontend

```powershell
npm run lint
npm run build
```

### Backend

```powershell
python -m compileall app alembic scripts
```

## Database Migrations

Alembic is used as the database schema migration source of truth.

The API does not automatically create database tables during startup.

Apply the latest migrations with:

```powershell
python -m alembic upgrade head
```

## Source Control

Local environment files and generated dependencies are intentionally excluded from source control.

Examples include:

```text
.env
.venv/
node_modules/
dist/
__pycache__/
```

Use `.env.example` as the template for local configuration.

## Development Status

OmniPOS Zero is under active development.

The current focus is improving code organization, reducing duplicated logic, refining analytics, and preparing the system for AI-assisted business recommendations.