export interface MarketProduct {
  id: string;
  title: string;
  price: number;
  sellerUsername: string;
  sellerName: string;
  rating: number;
  salesCount: number;
  reviewsCount: number;
  image: string;
  category: string;
  condition: 'New' | 'Like New' | 'Gently Used' | 'Fair';
  specs?: Record<string, string>;
  description: string;
}

export interface CartItem {
  product: MarketProduct;
  quantity: number;
}
