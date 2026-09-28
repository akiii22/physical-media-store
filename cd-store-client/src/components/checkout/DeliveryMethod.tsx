import type { DeliveryMethod as DeliveryMethodType } from "../../services/orderServices";

type DeliveryMethodProps = {
  value: DeliveryMethodType;
  onChange: (value: DeliveryMethodType) => void;
};

const DeliveryMethod = ({
  value,
  onChange,
}: DeliveryMethodProps) => {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-semibold text-gray-900">
        Delivery Method
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label
          className={`cursor-pointer rounded-xl border p-5 transition ${
            value === "DELIVERY"
              ? "border-gray-900 ring-1 ring-gray-900"
              : "border-gray-200 hover:border-gray-900"
          }`}
        >
          <input
            type="radio"
            name="deliveryMethod"
            value="DELIVERY"
            checked={value === "DELIVERY"}
            onChange={() => onChange("DELIVERY")}
            className="mr-3"
          />

          <span className="font-medium text-gray-900">
            Nationwide Delivery
          </span>

          <p className="mt-2 text-sm text-gray-500">
            Have your order delivered anywhere in the Philippines.
          </p>
        </label>

        <label
          className={`cursor-pointer rounded-xl border p-5 transition ${
            value === "STORE_PICKUP"
              ? "border-gray-900 ring-1 ring-gray-900"
              : "border-gray-200 hover:border-gray-900"
          }`}
        >
          <input
            type="radio"
            name="deliveryMethod"
            value="STORE_PICKUP"
            checked={value === "STORE_PICKUP"}
            onChange={() => onChange("STORE_PICKUP")}
            className="mr-3"
          />

          <span className="font-medium text-gray-900">
            Pasay Store Pickup
          </span>

          <p className="mt-2 text-sm text-gray-500">
            Pick up your order directly from the store.
          </p>
        </label>
      </div>
    </section>
  );
};

export default DeliveryMethod;