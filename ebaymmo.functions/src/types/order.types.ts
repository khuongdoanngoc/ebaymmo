export interface CreateOrderPayload {
  productId: string;
  quantity: number;
  couponValue: number;
  sellerId: string;
  isPreOrder: boolean;
}

export interface CreateOrderServicesPayload {
  product_id: string;
  coupon_value: number;
  seller_id: string;
  complete_date_service: string;
}
