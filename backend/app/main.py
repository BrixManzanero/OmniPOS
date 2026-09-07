from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.settings import API_TITLE, API_VERSION, CORS_ORIGINS
from .routers import (
    analytics,
    customers,
    dashboard,
    inventory,
    orders,
    products,
)


app = FastAPI(
    title=API_TITLE,
    description="Backend API for OmniPOS Zero",
    version=API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(inventory.router)
app.include_router(customers.router)


@app.get("/")
def root():
    return {
        "message": "OmniPOS Zero API is running",
        "version": API_VERSION,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }
