import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import {
  createOrder,
  type DeliveryMethod,
  type PaymentMethod,
} from "../services/orderServices";

import {
  validateCheckout,
  type CheckoutValidationErrors,
} from "../utils/checkOutValidation";

import CustomerInformation from "../components/checkout/ConfirmationInformation";
import OrderSummary from "../components/checkout/OrderSummary";
import DeliveryMethodComponent from "../components/checkout/DeliveryMethod";
import PaymentMethodComponent from "../components/checkout/PaymentMethod";

const Checkout = () => {
  const { items, getCartSubtotal, clearCart } = useCart();

  const navigate = useNavigate();

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("DELIVERY");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("GCASH");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [validationErrors, setValidationErrors] =
    useState<CheckoutValidationErrors>({});

  const [submitting, setSubmitting] = useState(false);

  const subtotal = getCartSubtotal();

  /*
   * Clear one field's validation error
   * whenever the user starts correcting it.
   */
  const clearFieldError = (
    field: keyof CheckoutValidationErrors
  ) => {
    setValidationErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const updated = { ...current };
      delete updated[field];

      return updated;
    });
  };

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    clearFieldError("customerName");
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    clearFieldError("phone");
  };

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    clearFieldError("province");
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    clearFieldError("city");
  };

  const handleBarangayChange = (value: string) => {
    setBarangay(value);
    clearFieldError("barangay");
  };

  const handleStreetAddressChange = (value: string) => {
    setStreetAddress(value);
    clearFieldError("streetAddress");
  };

  const handlePostalCodeChange = (value: string) => {
    setPostalCode(value);
    clearFieldError("postalCode");
  };

  const handleDeliveryMethodChange = (
    value: DeliveryMethod
  ) => {
    setDeliveryMethod(value);

    /*
     * Delivery-only fields should not keep
     * old validation errors when switching
     * to store pickup.
     */
    if (value === "STORE_PICKUP") {
      setValidationErrors((current) => {
        const updated = { ...current };

        delete updated.province;
        delete updated.city;
        delete updated.barangay;
        delete updated.streetAddress;
        delete updated.postalCode;

        return updated;
      });
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    /*
     * Frontend validation
     */
    const errors = validateCheckout({
      customerName,
      phone,
      province,
      city,
      barangay,
      streetAddress,
      postalCode,
      deliveryMethod,
    });

    setValidationErrors(errors);

    /*
     * Don't submit if validation failed.
     */
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      const result = await createOrder({
        customer_name: customerName.trim(),
        phone: phone.trim(),

        /*
         * Only send delivery address when
         * the customer selected delivery.
         */
        province:
          deliveryMethod === "DELIVERY"
            ? province.trim()
            : undefined,

        city:
          deliveryMethod === "DELIVERY"
            ? city.trim()
            : undefined,

        barangay:
          deliveryMethod === "DELIVERY"
            ? barangay.trim()
            : undefined,

        street_address:
          deliveryMethod === "DELIVERY"
            ? streetAddress.trim()
            : undefined,

        postal_code:
          deliveryMethod === "DELIVERY"
            ? postalCode.trim()
            : undefined,

        delivery_method: deliveryMethod,
        payment_method: paymentMethod,

        items,
      });

      console.log("Order created:", result);

      /*
       * Clear cart only after the order
       * was successfully created.
       */
      clearCart();

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

  /*
   * Empty cart
   */
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
              className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-white transition hover:bg-gray-700"
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
      <div className="mx-auto max-w-6xl">

        {/* Header */}
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
          <CustomerInformation
            customerName={customerName}
            phone={phone}
            province={province}
            city={city}
            barangay={barangay}
            streetAddress={streetAddress}
            postalCode={postalCode}
            deliveryMethod={deliveryMethod}
            validationErrors={validationErrors}
            onCustomerNameChange={handleCustomerNameChange}
            onPhoneChange={handlePhoneChange}
            onProvinceChange={handleProvinceChange}
            onCityChange={handleCityChange}
            onBarangayChange={handleBarangayChange}
            onStreetAddressChange={handleStreetAddressChange}
            onPostalCodeChange={handlePostalCodeChange}
          />

          {/* Order Summary */}
          <OrderSummary
            items={items}
            subtotal={subtotal}
          />

          {/* Delivery Method */}
          <DeliveryMethodComponent
            value={deliveryMethod}
            onChange={handleDeliveryMethodChange}
          />

          {/* Payment Method */}
          <PaymentMethodComponent
            value={paymentMethod}
            onChange={setPaymentMethod}
          />

          {/* Submit */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creating Order..."
                : "Place Order"}
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              By placing this order, you confirm that the
              information provided is correct.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Checkout;