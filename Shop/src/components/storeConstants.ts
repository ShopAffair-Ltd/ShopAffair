import { MarketProduct } from '../types';

export type StoreTab = 'wall' | 'catalogue' | 'settings';

export interface WallComment {
  id: string;
  authorName: string;
  isSeller: boolean;
  content: string;
  timestamp: string;
}

export interface WallPost {
  id: string;
  caption: string;
  images?: string[];
  timestamp: string;
  isPinned?: boolean;
  likes: number;
  likedByMe: boolean;
  comments: WallComment[];
}

export const initialWallPosts: WallPost[] = [
  {
    id: 'post_1',
    caption:
      'We offer:\n• Fast Delivery\n• Neat Gadgets\n• Top notch customer services\n• 1 year warranty on all products purchased from the store',
    timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
    isPinned: true,
    likes: 24,
    likedByMe: false,
    comments: [
      {
        id: 'c1',
        authorName: 'vitdel',
        isSeller: false,
        content: 'Do you sell iphone chargers here?',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'c2',
        authorName: 'gadgetzone',
        isSeller: true,
        content: 'Yes we do! Original and fast chargers available, DM us.',
        timestamp: new Date(Date.now() - 3600000 * 23).toISOString()
      }
    ]
  },
  {
    id: 'post_2',
    caption: 'We just completed 10+ successful sales! Thank you for trusting Gadget Zone NG. More deals coming soon.',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    likes: 41,
    likedByMe: false,
    comments: []
  },
  {
    id: 'post_3',
    caption: 'New arrivals!!! Samsung Galaxy S25 Ultra now in stock. Limited units available',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400'],
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    likes: 17,
    likedByMe: false,
    comments: [
      {
        id: 'c3',
        authorName: 'nostalgia_villain',
        isSeller: false,
        content: 'How much for your samsung s25 ultra',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
      },
      {
        id: 'c4',
        authorName: 'gadgetzone',
        isSeller: true,
        content: '₦850,000, brand new, sealed box.',
        timestamp: new Date(Date.now() - 3600000 * 19).toISOString()
      },
      {
        id: 'c5',
        authorName: 'nostalgia_villain',
        isSeller: false,
        content: 'Can I swap my device here?',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ]
  }
];

export const MOCK_OWN_PRODUCTS: MarketProduct[] = [
  {
    id: 'store_mock_1',
    title: 'Iphone 15 Pro Max',
    price: 8000,
    sellerUsername: '__self__',
    sellerName: 'techking',
    rating: 4.8,
    salesCount: 154,
    reviewsCount: 32,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400',
    category: 'Phones',
    condition: 'New',
    description: 'Premium titanium iPhone 15 Pro Max with stunning battery health, accessories, and complete warranty.'
  },
  {
    id: 'store_mock_2',
    title: 'MacBook Air M2',
    price: 8000,
    sellerUsername: '__self__',
    sellerName: 'gadgetzone',
    rating: 4.8,
    salesCount: 89,
    reviewsCount: 18,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400',
    category: 'Laptops',
    condition: 'Like New',
    description: 'Apple MacBook Air M2. Sleek, powerful, and ready for high-performance creative tasks.'
  },
  {
    id: 'store_mock_3',
    title: 'Samsung Galaxy S24 Ultra',
    price: 12000,
    sellerUsername: '__self__',
    sellerName: 'techking',
    rating: 4.9,
    salesCount: 210,
    reviewsCount: 45,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400',
    category: 'Phones',
    condition: 'New',
    description: 'S24 Ultra with AI-powered features, 200MP camera, and bundled S-Pen.'
  },
  {
    id: 'store_mock_4',
    title: 'iPad Air 5th Gen',
    price: 5200,
    sellerUsername: '__self__',
    sellerName: 'gadgetzone',
    rating: 4.7,
    salesCount: 63,
    reviewsCount: 14,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400',
    category: 'Tablets',
    condition: 'Like New',
    description: 'iPad Air with M1 chip, perfect for note-taking and light creative work.'
  }
];

export const CATEGORY_CHIPS = ['All', 'Phones', 'Laptops', 'Tablets'];
export const CATEGORIES = ['Phones', 'Laptops', 'Tablets', 'Vehicles', 'Houses', 'Fashion', 'Repair', 'More'];
export const CONDITIONS: MarketProduct['condition'][] = ['New', 'Like New', 'Gently Used', 'Fair'];

export function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}