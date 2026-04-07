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
  gameId?: string;
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
  alternativeProductId?: string;
  activationVideoUrl?: string;
  bundleInfo?: {
    items: string[];
    discount: number;
  };
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
  metadata?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user' | 'vendor';
  createdAt: string;
  ownedGames?: string[];
  wishlist?: string[];
  notifications?: Notification[];
  walletBalance?: number;
  points?: number;
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  xp?: number;
  level?: number;
  lastLogin?: string;
  lastPointDeduction?: string;
  lockedPrices?: {
    itemId: string;
    price: number;
    expiresAt: string;
  }[];
  steamId?: string;
  steamProfile?: any;
  steamGames?: any[];
  interests?: string[];
  quests?: {
    id: string;
    progress: number;
    completed: boolean;
  }[];
  subscriptions?: {
    productId: string;
    startDate: string;
    nextBillingDate: string;
    status: 'active' | 'cancelled' | 'expired';
  }[];
}

export interface ScheduledGift {
  id: string;
  senderId: string;
  recipientName: string;
  recipientContact: string; // WhatsApp or Email
  productId: string;
  message: string;
  scheduledDate: string;
  status: 'pending' | 'sent';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  category: string;
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
  targetType: 'game' | 'product';
  targetId: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  isVerified?: boolean;
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

export interface Bid {
  id: string;
  itemId: string;
  itemType: 'game' | 'product';
  itemTitle: string;
  userId: string;
  userEmail: string;
  bidPrice: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DigitalCode {
  id: string;
  productId: string;
  provider: string;
  codeMasked: string;
  codeEncrypted?: string; // Only accessible by admin/backend
  secretRef?: string;
  status: 'available' | 'reserved' | 'sold' | 'faulty' | 'refunded' | 'quarantined';
  assignedOrderId?: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded';
  paymentId?: string;
  paymentStatus: 'pending' | 'requires_action' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
  fulfillmentStatus: 'pending' | 'processing' | 'fulfilled' | 'failed';
  orderStatus: 'new' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  deliveryStatus?: DeliveryStatus;
  deliveryType?: DeliveryType;
  deliveryDetails?: string;
  deliveryInstructions?: string;
  revealStatus: 'hidden' | 'revealed';
  warrantyStatus: 'inactive' | 'active' | 'expired' | 'claimed';
  warrantyActivatedAt?: string;
  warrantyLog?: {
    action: string;
    timestamp: string;
    ip?: string;
    userAgent?: string;
    fingerprint?: string;
    country?: string;
    method?: string;
  }[];
}
