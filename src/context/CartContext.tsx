import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  itemCount: number;
  pointsEarned: number;
  applyCoupon: (code: string) => Promise<boolean>;
  discount: number;
  activeCoupon: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [discount, setDiscount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setActiveCoupon(null);
  };

  const applyCoupon = async (code: string) => {
    // In a real app, fetch from Firestore
    if (code === 'WELCOME10') {
      setDiscount(10);
      setActiveCoupon(code);
      return true;
    }
    return false;
  };

  const rawTotalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalPrice = Math.max(0, rawTotalPrice - discount);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const pointsEarned = Math.floor(totalPrice * 10); // 10 points per dollar

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalPrice,
      itemCount,
      pointsEarned,
      applyCoupon,
      discount,
      activeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
