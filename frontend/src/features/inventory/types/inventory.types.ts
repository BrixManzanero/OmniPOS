export type RestockPayload = {
  product_id: number;
  quantity: number;
};


export type InventoryMovement = {
  id: number;
  product_id: number;
  product_name: string;
  movement_type: string;
  quantity: number;
  created_at: string;
};