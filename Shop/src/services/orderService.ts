import { api } from './api';
import { CartItem } from '../types';

export interface RawOrder {
  id: string;
  orderRef: string;
  productId: string;
  price: string | number;
  quantity: number;
  buyerId: string;
  sellerId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  deliveryFee: string | number;
  fullName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  tradeId?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; title: string; image: string };
  buyer?: { id: string; username: string; name: string };
  seller?: { id: string; username: string; name: string };
  trade?: { id: string; pickupCode?: string | null; status: string; pickupAttempts?: number };
}

export interface CheckoutPayload {
  fullName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  deliveryFee?: number;
}

export interface CheckoutResult {
  orderRef: string;
  orders: RawOrder[];
}

// Converts the local cart into the { productId, quantity } shape the
// backend expects, and sends real delivery details. Prices are never sent —
// the backend re-reads them from the Product table itself.
export const checkout = async (cart: CartItem[], details: CheckoutPayload): Promise<CheckoutResult> => {
  const items = cart.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity
  }));

  const { data } = await api.post<CheckoutResult>('/orders/checkout', {
    items,
    fullName: details.fullName,
    address: details.address,
    city: details.city,
    state: details.state,
    phone: details.phone,
    deliveryFee: details.deliveryFee ?? 0
  });

  return data;
};

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: RawOrder['status'];
  role?: 'buyer' | 'seller';
}

export interface ListOrdersResult {
  items: RawOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const fetchOrders = async (params: ListOrdersParams = {}): Promise<ListOrdersResult> => {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.status) query.status = params.status;
  if (params.role) query.role = params.role;

  const { data } = await api.get<ListOrdersResult>('/orders', { params: query });
  return data;
};

export const fetchOrderById = async (id: string): Promise<RawOrder> => {
  const { data } = await api.get<{ order: RawOrder }>(`/orders/${id}`);
  return data.order;
};

export const updateOrderStatus = async (id: string, status: RawOrder['status']): Promise<RawOrder> => {
  const { data } = await api.patch<{ order: RawOrder }>(`/orders/${id}/status`, { status });
  return data.order;
};