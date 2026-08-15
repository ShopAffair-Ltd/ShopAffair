export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  buyerUsername: string;
  sellerUsername: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}
