export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Optional product thumbnail for cart / receipt UI. */
  imageUrl?: string | null;
  /** Available stock when known — used to clamp cart qty and avoid oversell. */
  stockQuantity?: number | null;
}
