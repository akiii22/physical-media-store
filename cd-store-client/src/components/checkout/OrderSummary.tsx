import type { CartItem } from "../../types/cart";

type OrderSummaryProps = {
  items: CartItem[];
  subtotal: number;
};

const OrderSummary = ({ items, subtotal }: OrderSummaryProps) => {
  return (
    <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">
        Order Summary
      </h2>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex justify-between gap-4 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {item.product.name}
              </p>

              <p className="text-gray-500">
                {item.quantity} × ₱
                {item.product.price.toLocaleString()}
              </p>
            </div>

            <p className="shrink-0 font-medium">
              ₱
              {(item.product.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-5">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">
            Subtotal
          </span>

          <span className="font-bold text-gray-900">
            ₱{subtotal.toLocaleString()}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;