import type { PaymentMethod } from "../../services/orderServices";

type PaymentMethodProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

const PaymentMethodComponent = ({
  value,
  onChange,
}: PaymentMethodProps) => {
  const methods = [
    {
      value: "GCASH" as const,
      title: "GCash",
      description: "Pay using GCash.",
    },
    {
      value: "MAYA" as const,
      title: "Maya",
      description: "Pay using Maya.",
    },
    {
      value: "CARD" as const,
      title: "Credit / Debit Card",
      description:
        "Card payment will be handled by the payment provider.",
    },
  ];

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-semibold text-gray-900">
        Payment Method
      </h2>

      <div className="mt-5 space-y-3">
        {methods.map((method) => (
          <label
            key={method.value}
            className={`flex cursor-pointer items-center rounded-lg border p-4 transition ${
              value === method.value
                ? "border-gray-900 ring-1 ring-gray-900"
                : "border-gray-200 hover:border-gray-900"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={value === method.value}
              onChange={() => onChange(method.value)}
              className="mr-3"
            />

            <span>
              <span className="block font-medium text-gray-900">
                {method.title}
              </span>

              <span className="text-sm text-gray-500">
                {method.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
};

export default PaymentMethodComponent;