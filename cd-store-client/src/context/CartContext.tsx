
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../types/product";
import type { CartItem } from "../types/cart";

export type AddToCartResult =
  | "added"
  | "quantity-increased"
  | "out-of-stock"
  | "stock-limit-reached";

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product) => AddToCartResult;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartSubtotal: () => number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined,
);

type CartProviderProps = {
  children: ReactNode;
};

const loadCart = (): CartItem[] => {
  try {
    if (typeof window === "undefined") {
      return [];
    }

    const savedCart = localStorage.getItem("cart");

    if (!savedCart) {
      return [];
    }

    const parsed: unknown = JSON.parse(savedCart);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is CartItem =>
        item !== null &&
        typeof item === "object" &&
        "product" in item &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.product !== null &&
        typeof item.product === "object" &&
        typeof item.product.id === "string" &&
        typeof item.product.stock === "number" &&
        item.product.stock > 0,
    ).map((item) => ({
      ...item,
      quantity: Math.min(item.quantity, item.product.stock),
    }));
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const hasInitialized = useRef(false);

  // Keep the latest cart available for synchronous stock validation.
  const itemsRef = useRef<CartItem[]>(items);

  const commitItems = (nextItems: CartItem[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  // Persist cart changes.
useEffect(() => {
  if (!hasInitialized.current) {
    hasInitialized.current = true;
    return;
  }

  try {
    if (items.length === 0) {
      localStorage.removeItem("cart");
    } else {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}, [items]);

  const addToCart = (product: Product): AddToCartResult => {
    if (product.stock <= 0) {
      return "out-of-stock";
    }

    const currentItems = itemsRef.current;
    const existingItem = currentItems.find(
      (item) => item.product.id === product.id,
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        return "stock-limit-reached";
      }

      const nextItems = currentItems.map((item) =>
        item.product.id === product.id
          ? {
              ...item,
              product,
              quantity: Math.min(
                item.quantity + 1,
                product.stock,
              ),
            }
          : item,
      );

      commitItems(nextItems);
      return "quantity-increased";
    }

    commitItems([
      ...currentItems,
      {
        product,
        quantity: 1,
      },
    ]);

    return "added";
  };

  const removeFromCart = (productId: string) => {
    commitItems(
      itemsRef.current.filter(
        (item) => item.product.id !== productId,
      ),
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const nextItems = itemsRef.current
      .map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        const safeQuantity = Math.min(
          Math.floor(quantity),
          item.product.stock,
        );

        return {
          ...item,
          quantity: safeQuantity,
        };
      })
      .filter((item) => item.quantity > 0);

    commitItems(nextItems);
  };

  const clearCart = () => {
    commitItems([]);
  };

  const getCartItemCount = () =>
    items.reduce((total, item) => total + item.quantity, 0);

  const getCartSubtotal = () =>
    items.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0,
    );

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

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
