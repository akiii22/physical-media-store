import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    getCartSubtotal,
  } = useCart();

  console.log("Cart Items:" , items);
  const subtotal = getCartSubtotal();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-gray-900">
            Your Cart
          </h1>

          <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Your cart is empty.
            </p>

            <Link
              to="/products"
              className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-white"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Your Cart
        </h1>

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-semibold text-gray-900">
                  {item.product.name}
                </h2>

                <p className="text-sm text-gray-500">
                  ₱{item.product.price.toLocaleString()} each
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(
                      item.product.id,
                      item.quantity - 1
                    )
                  }
                  className="h-9 w-9 rounded-lg bg-gray-200"
                >
                  -
                </button>

                <span className="w-8 text-center font-medium">
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
                  disabled={
                    item.quantity >= item.product.stock
                  }
                  className="h-9 w-9 rounded-lg bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>

                <p className="ml-4 w-24 text-right font-semibold">
                  ₱
                  {(
                    item.product.price * item.quantity
                  ).toLocaleString()}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    removeFromCart(item.product.id)
                  }
                  className="ml-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
          <span className="text-lg font-medium">
            Subtotal
          </span>

          <span className="text-2xl font-bold">
            ₱{subtotal.toLocaleString()}
          </span>
        </div>
        <div className="mt-4 flex justify-end">
  <Link
    to="/checkout"
    className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700"
  >
    Proceed to Checkout
  </Link>
</div>
      </div>
    </main>
  );
};

export default Cart;