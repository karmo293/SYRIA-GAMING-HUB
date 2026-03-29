export type DeliveryType = 'Steam Account' | 'Steam Key' | 'Discord Nitro Gift' | 'Other';
export type DeliveryStatus = 'Pending' | 'Processing' | 'Delivered' | 'Ready for pickup';

export interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  steamUrl: string;
  ourPrice: number;
  steamPrice: number;
  createdAt: string;
  averageRating?: number;
  ratingCount?: number;
  deliveryType: DeliveryType;
  deliveryDetails: string; // The actual key, login info, or link
  deliveryInstructions?: string; // How to use it
  deliveryStatus?: DeliveryStatus;
  stock?: number;
}

export interface Product {
  id: string;
  gameId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: 'Key' | 'Currency' | 'Subscription' | 'Other';
  createdAt: string;
  averageRating?: number;
  ratingCount?: number;
  deliveryType: DeliveryType;
  deliveryDetails: string;
  deliveryInstructions?: string;
  deliveryStatus?: DeliveryStatus;
  stock?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'purchase' | 'system';
  createdAt: string;
  read: boolean;
  itemId?: string;
  itemTitle?: string;
  deliveryType?: DeliveryType;
  deliveryDetails?: string;
  deliveryInstructions?: string;
  deliveryStatus?: DeliveryStatus;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  createdAt: string;
  ownedGames?: string[];
  wishlist?: string[];
  notifications?: Notification[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'new' | 'read' | 'replied';
}

export interface Review {
  id: string;
  gameId: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  type: 'game' | 'product';
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  createdAt: string;
}
