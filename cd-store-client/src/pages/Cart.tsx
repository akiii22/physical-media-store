
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "../context/CartContext";

type PendingRemoval = {
  id: string;
  name: string;
} | null;

const Cart = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSubtotal,
    getCartItemCount,
  } = useCart();

  const [pendingRemoval, setPendingRemoval] =
    useState<PendingRemoval>(null);
  const [showClearConfirmation, setShowClearConfirmation] =
    useState(false);

  const subtotal = getCartSubtotal();
  const itemCount = getCartItemCount();

  const handleRemoveItem = () => {
    if (!pendingRemoval) return;

    removeFromCart(pendingRemoval.id);
    toast.success(`${pendingRemoval.name} removed from your cart.`);
    setPendingRemoval(null);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirmation(false);
    toast.success("Your cart has been cleared.");
  };

  const closeDialogs = () => {
    setPendingRemoval(null);
    setShowClearConfirmation(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/products"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Your Cart
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your
                cart
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirmation(true)}
                className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:self-auto"
              >
                <Trash2 size={16} />
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Empty Cart */}
        {items.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag size={28} className="text-gray-500" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-950">
              Your Cart is Empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Looks like you haven't added anything to your cart yet.
              Browse our collection and find something you like.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Cart and Order Summary */
          <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
            {/* Cart Items */}
            <section className="space-y-4">
              {items.map((item) => {
                const itemSubtotal = item.product.price * item.quantity;
                const isMaxQuantity =
                  item.quantity >= item.product.stock;

                return (
                  <article
                    key={item.product.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      {/* Product Image */}
                      <Link
                        to={`/products/${item.product.id}`}
                        className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                      >
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="h-full w-full object-cover transition hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </Link>

                      {/* Product Information */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {item.product.media_type}
                          </p>

                          <Link
                            to={`/products/${item.product.id}`}
                            className="mt-1 block"
                          >
                            <h2 className="line-clamp-2 text-lg font-semibold text-gray-950 hover:text-gray-600">
                              {item.product.name}
                            </h2>
                          </Link>

                          <p className="mt-1 text-sm text-gray-500">
                            ₱{item.product.price.toLocaleString()} each
                          </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          {/* Quantity Controls */}
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">
                              Quantity
                            </span>

                            <div className="flex items-center rounded-lg border border-gray-200">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                                aria-label={`Decrease quantity of ${item.product.name}`}
                              >
                                <Minus size={15} />
                              </button>

                              <span className="flex h-9 w-10 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={isMaxQuantity}
                                className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label={`Increase quantity of ${item.product.name}`}
                              >
                                <Plus size={15} />
                              </button>
                            </div>

                            {isMaxQuantity && (
                              <span className="text-xs text-gray-400">
                                Max stock
                              </span>
                            )}
                          </div>

                          {/* Item Subtotal */}
                          <div className="sm:text-right">
                            <p className="text-xs text-gray-500">
                              Item total
                            </p>

                            <p className="text-lg font-bold text-gray-950">
                              ₱{itemSubtotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Remove Item */}
                      <button
                        type="button"
                        onClick={() =>
                          setPendingRemoval({
                            id: item.product.id,
                            name: item.product.name,
                          })
                        }
                        className="flex cursor-pointer items-center gap-1 self-start text-sm font-medium text-gray-400 transition hover:text-red-600 sm:self-center"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Order Summary */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-950">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium text-gray-900">
                      {itemCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ₱{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-xs font-medium text-gray-400">
                      Calculated at checkout
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    Subtotal
                  </span>

                  <span className="text-2xl font-bold text-gray-950">
                    ₱{subtotal.toLocaleString()}
                  </span>
                </div>

                <Link
                  to="/checkout"
                  className="mt-6 block w-full rounded-xl bg-gray-950 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  to="/products"
                  className="mt-3 block text-center text-sm font-medium text-gray-500 transition hover:text-gray-950"
                >
                  Continue Shopping
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                  Your order is not placed until you complete checkout.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Remove Single Item Confirmation */}
      {pendingRemoval && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPendingRemoval(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-item-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="remove-item-title"
                  className="text-lg font-bold text-gray-950"
                >
                  Remove item?
                </h2>

                <p className="mt-2 break-words text-sm leading-6 text-gray-500">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-gray-800">
                    {pendingRemoval.name}
                  </span>{" "}
                  from your cart?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPendingRemoval(null)}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingRemoval(null)}
                className="rounded-xl cursor-pointer border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Keep Item
              </button>

              <button
                type="button"
                onClick={handleRemoveItem}
                className="rounded-xl bg-red-600 cursor-pointer px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Entire Cart Confirmation */}
      {showClearConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowClearConfirmation(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-cart-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="clear-cart-title"
                  className="text-lg font-bold text-gray-950"
                >
                  Clear your cart?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  This will remove all {itemCount}{" "}
                  {itemCount === 1 ? "item" : "items"} from your cart.
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Keep My Cart
              </button>

              <button
                type="button"
                onClick={handleClearCart}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escape key closes either confirmation */}
      {(pendingRemoval || showClearConfirmation) && (
        <EscapeKeyHandler onEscape={closeDialogs} />
      )}
    </main>
  );
};

const EscapeKeyHandler = ({ onEscape }: { onEscape: () => void }) => {
  useState(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return null;
};

export default Cart;
