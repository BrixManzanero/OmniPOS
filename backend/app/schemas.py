from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# =========================
# PRODUCTS
# =========================

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str | None = None
    price: float = Field(gt=0)
    stock: int = Field(default=0, ge=0)


class ProductResponse(ProductCreate):
    id: int
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class RestockRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


# =========================
# CUSTOMER SUMMARY
# USED INSIDE ORDER RESPONSE
# =========================

class OrderCustomerResponse(BaseModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None

    model_config = {
        "from_attributes": True
    }


# =========================
# ORDERS
# =========================

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    # NULL means walk-in / guest customer.
    customer_id: int | None = None

    # POS = physical store
    # ONLINE = online store
    order_channel: Literal[
        "POS",
        "ONLINE"
    ] = "POS"

    payment_method: Literal[
        "cash",
        "gcash",
        "maya",
        "card"
    ]

    items: list[CheckoutItem]

    model_config = {
        "json_schema_extra": {
            "example": {
                "customer_id": None,
                "order_channel": "POS",
                "payment_method": "cash",
                "items": [
                    {
                        "product_id": 1,
                        "quantity": 1
                    }
                ]
            }
        }
    }


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    line_total: float

    model_config = {
        "from_attributes": True
    }


class OrderResponse(BaseModel):
    id: int

    customer_id: int | None

    customer: OrderCustomerResponse | None = None

    order_channel: Literal[
        "POS",
        "ONLINE"
    ]

    total_amount: float

    payment_method: str

    status: str

    created_at: datetime

    items: list[OrderItemResponse]

    model_config = {
        "from_attributes": True
    }


# =========================
# INVENTORY
# =========================

class InventoryMovementResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    movement_type: str
    quantity: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# =========================
# CUSTOMERS
# =========================

class CustomerCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None


class CustomerResponse(CustomerCreate):
    id: int
    created_at: datetime
    is_active: bool

    model_config = {
        "from_attributes": True
    }

# ==========================
# CUSTOMERS PURCHASE HISTORY
# ==========================

class CustomerHistorySummary(BaseModel):
    total_orders: int
    total_spent: float
    average_order_value: float

    first_purchase: datetime | None = None
    last_purchase: datetime | None = None

    pos_orders: int
    online_orders: int

    returning_customer: bool


class CustomerHistoryResponse(BaseModel):
    customer: CustomerResponse

    summary: CustomerHistorySummary

    orders: list[OrderResponse]