// hooks/useCart.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { STORAGE_KEYS, SYSTEM_LIMITS } from '../utils/constants';
import { sumBy } from '../utils/helpers';

const useCart = () => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [discountPercent, setDiscountPercent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART_DISCOUNT);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  }, [items]);

  // Save discount to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART_DISCOUNT, discountPercent.toString());
    } catch (error) {
      console.warn('Failed to save discount to localStorage:', error);
    }
  }, [discountPercent]);

  // Add item to cart
  const addItem = useCallback((product, quantity = 1) => {
    if (items.length >= SYSTEM_LIMITS.MAX_CART_ITEMS) {
      throw new Error(`Máximo ${SYSTEM_LIMITS.MAX_CART_ITEMS} productos en el carrito`);
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, {
          id: product.id,
          name: product.name,
          code: product.code,
          price: product.price,
          quantity,
          category: product.category,
          addedAt: Date.now()
        }];
      }
    });
  }, [items.length]);

  // Remove item from cart
  const removeItem = useCallback((productId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountPercent(0);
  }, []);

  // Get item by id
  const getItem = useCallback((productId) => {
    return items.find(item => item.id === productId);
  }, [items]);

  // Check if item exists in cart
  const hasItem = useCallback((productId) => {
    return items.some(item => item.id === productId);
  }, [items]);

  // Apply discount
  const applyDiscount = useCallback((percent) => {
    const validPercent = Math.max(0, Math.min(percent, SYSTEM_LIMITS.MAX_DISCOUNT_PERCENT));
    setDiscountPercent(validPercent);
  }, []);

  // Remove discount
  const removeDiscount = useCallback(() => {
    setDiscountPercent(0);
  }, []);

  // Calculated values
  const itemsWithSubtotal = useMemo(() => {
    return items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity
    }));
  }, [items]);

  const subtotal = useMemo(() => {
    return sumBy(itemsWithSubtotal, 'subtotal');
  }, [itemsWithSubtotal]);

  const discountAmount = useMemo(() => {
    return subtotal * (discountPercent / 100);
  }, [subtotal, discountPercent]);

  const total = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  const totalItems = useMemo(() => {
    return sumBy(items, 'quantity');
  }, [items]);

  const isEmpty = items.length === 0;
  const isNearLimit = items.length >= SYSTEM_LIMITS.MAX_CART_ITEMS * 0.8;

  return {
    items: itemsWithSubtotal,
    totalItems,
    subtotal,
    discountPercent,
    discountAmount,
    total,
    isEmpty,
    isNearLimit,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
    hasItem,
    applyDiscount,
    removeDiscount
  };
};

export default useCart;