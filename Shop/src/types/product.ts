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
  location?: string;
  specs?: Record<string, string>;
  description: string;
  isFavorited?: boolean;
}

export interface CartItem {
  product: MarketProduct;
  quantity: number;
}
