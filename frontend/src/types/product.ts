export type Product = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  price: number;
  stock: number;
  is_active: boolean;
};

export type ProductCreate = {
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
};