import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderServices";
const Checkout = () => {
  const { items, getCartSubtotal, clearCart } = useCart();

  const [deliveryMethod, setDeliveryMethod] =
    useState<"DELIVERY" | "STORE_PICKUP">("DELIVERY");

  const [paymentMethod, setPaymentMethod] =
    useState<"GCASH" | "MAYA" | "CARD">("GCASH");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
const [submitting, setSubmitting] = useState(false);
  const subtotal = getCartSubtotal();
  const navigate = useNavigate();

  const CUSTOMER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-gray-900">
            Checkout
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

const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (submitting) {
    return;
  }

  try {
    setSubmitting(true);

    const result = await createOrder({
      user_id: CUSTOMER_ID,
      customer_name: customerName,
      phone,
      province,
      city,
      barangay,
      street_address: streetAddress,
      postal_code: postalCode,
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      items,
    });

    console.log("Order created:", result);
    clearCart()
    navigate(
      `/order-confirmation/${result.data.order_id}`
    );
  } catch (error) {
    console.error("Checkout error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to create order."
    );
  } finally {
    setSubmitting(false);
  }
};

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            to="/cart"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Cart
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your information and choose your delivery
            and payment method.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-3"
        >
          {/* Customer Information */}

          <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Customer Information
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                  placeholder="09171234567"
                />
              </div>

              <div>
                <label
                  htmlFor="province"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Province
                </label>

                <input
                  id="province"
                  type="text"
                  value={province}
                  onChange={(event) =>
                    setProvince(event.target.value)
                  }
                  required={deliveryMethod === "DELIVERY"}
                  disabled={deliveryMethod === "STORE_PICKUP"}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100 focus:border-gray-900"
                  placeholder="Metro Manila"
                />
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  City / Municipality
                </label>

                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  required={deliveryMethod === "DELIVERY"}
                  disabled={deliveryMethod === "STORE_PICKUP"}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100 focus:border-gray-900"
                  placeholder="Pasay City"
                />
              </div>

              <div>
                <label
                  htmlFor="barangay"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Barangay
                </label>

                <input
                  id="barangay"
                  type="text"
                  value={barangay}
                  onChange={(event) =>
                    setBarangay(event.target.value)
                  }
                  required={deliveryMethod === "DELIVERY"}
                  disabled={deliveryMethod === "STORE_PICKUP"}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100 focus:border-gray-900"
                  placeholder="Barangay"
                />
              </div>

              <div>
                <label
                  htmlFor="postalCode"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Postal Code
                </label>

                <input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(event) =>
                    setPostalCode(event.target.value)
                  }
                  disabled={deliveryMethod === "STORE_PICKUP"}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100 focus:border-gray-900"
                  placeholder="1300"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="streetAddress"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Street Address
                </label>

                <textarea
                  id="streetAddress"
                  value={streetAddress}
                  onChange={(event) =>
                    setStreetAddress(event.target.value)
                  }
                  required={deliveryMethod === "DELIVERY"}
                  disabled={deliveryMethod === "STORE_PICKUP"}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100 focus:border-gray-900"
                  placeholder="House/Building No., Street"
                />
              </div>
            </div>
          </section>

          {/* Order Summary */}

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
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>

                    <p className="text-gray-500">
                      {item.quantity} × ₱
                      {item.product.price.toLocaleString()}
                    </p>
                  </div>

                  <p className="font-medium">
                    ₱
                    {(
                      item.product.price * item.quantity
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-5">
              <div className="flex justify-between">
                <span className="font-medium">
                  Subtotal
                </span>

                <span className="font-bold">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </aside>

          {/* Delivery Method */}

          <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Delivery Method
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="cursor-pointer rounded-xl border p-5 hover:border-gray-900">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="DELIVERY"
                  checked={deliveryMethod === "DELIVERY"}
                  onChange={() =>
                    setDeliveryMethod("DELIVERY")
                  }
                  className="mr-3"
                />

                <span className="font-medium">
                  Nationwide Delivery
                </span>

                <p className="mt-2 text-sm text-gray-500">
                  Have your order delivered anywhere in
                  the Philippines.
                </p>
              </label>

              <label className="cursor-pointer rounded-xl border p-5 hover:border-gray-900">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="STORE_PICKUP"
                  checked={
                    deliveryMethod === "STORE_PICKUP"
                  }
                  onChange={() =>
                    setDeliveryMethod("STORE_PICKUP")
                  }
                  className="mr-3"
                />

                <span className="font-medium">
                  Pasay Store Pickup
                </span>

                <p className="mt-2 text-sm text-gray-500">
                  Pick up your order directly from the
                  store.
                </p>
              </label>
            </div>
          </section>

          {/* Payment Method */}

          <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Payment Method
            </h2>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-center rounded-lg border p-4 hover:border-gray-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="GCASH"
                  checked={paymentMethod === "GCASH"}
                  onChange={() =>
                    setPaymentMethod("GCASH")
                  }
                  className="mr-3"
                />

                <span>
                  <span className="block font-medium">
                    GCash
                  </span>

                  <span className="text-sm text-gray-500">
                    Pay using GCash.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center rounded-lg border p-4 hover:border-gray-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MAYA"
                  checked={paymentMethod === "MAYA"}
                  onChange={() =>
                    setPaymentMethod("MAYA")
                  }
                  className="mr-3"
                />

                <span>
                  <span className="block font-medium">
                    Maya
                  </span>

                  <span className="text-sm text-gray-500">
                    Pay using Maya.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center rounded-lg border p-4 hover:border-gray-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === "CARD"}
                  onChange={() =>
                    setPaymentMethod("CARD")
                  }
                  className="mr-3"
                />

                <span>
                  <span className="block font-medium">
                    Credit / Debit Card
                  </span>

                  <span className="text-sm text-gray-500">
                    Card payment will be handled by the
                    payment provider.
                  </span>
                </span>
              </label>
            </div>

            <button
  type="submit"
  disabled={submitting}
  className="mt-8 w-full rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {submitting
    ? "Creating Order..."
    : "Continue to Payment"}
</button>
          </section>
        </form>
      </div>
    </main>
  );
};

export default Checkout;