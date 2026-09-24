import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../types/product";
import type { CartItem } from "../types/cart";

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartSubtotal: () => number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({
  children,
}: CartProviderProps) => {
  // Load cart from localStorage when the app starts
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("cart");

      if (!savedCart) {
        return [];
      }

      return JSON.parse(savedCart);
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  });

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Add product to cart
  const addToCart = (product: Product) => {
    // Don't add products that are out of stock
    if (product.stock <= 0) {
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.product.id === product.id
      );

      // Product already exists in cart
      if (existingItem) {
        // Don't exceed available stock
        if (existingItem.quantity >= product.stock) {
          return currentItems;
        }

        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      // Product doesn't exist in cart yet
      return [
        ...currentItems,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  // Remove product completely from cart
  const removeFromCart = (productId: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  // Update product quantity
  const updateQuantity = (
    productId: string,
    quantity: number
  ) => {
    // If quantity becomes 0, remove the product
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        // Don't allow quantity above available stock
        const safeQuantity = Math.min(
          quantity,
          item.product.stock
        );

        return {
          ...item,
          quantity: safeQuantity,
        };
      })
    );
  };

  // Empty the entire cart
  const clearCart = () => {
    setItems([]);
  };

  // Total number of products in cart
  const getCartItemCount = () => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  };

  // Calculate cart subtotal
  const getCartSubtotal = () => {
    return items.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
        getCartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for accessing cart
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
};