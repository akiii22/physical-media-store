import type { PaymentMethod } from "../../services/orderServices";
import { CreditCard, Check } from "lucide-react";

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
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
          G
        </div>
      ),
    },
    {
      value: "MAYA" as const,
      title: "Maya",
      description: "Pay using Maya.",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-600">
          M
        </div>
      ),
    },
    {
      value: "CARD" as const,
      title: "Credit / Debit Card",
      description:
        "Card payment will be handled by the payment provider.",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <CreditCard size={24} />
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Payment Method
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose how you would like to pay for your order.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {methods.map((method) => {
          const isSelected = value === method.value;

          return (
            <label
              key={method.value}
              className={`relative flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {/* Radio button */}
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={isSelected}
                onChange={() => onChange(method.value)}
                className="sr-only"
              />

              {/* Payment icon */}
              {method.icon}

              {/* Payment information */}
              <div className="min-w-0 flex-1">
                <span className="block font-medium text-gray-900">
                  {method.title}
                </span>

                <span className="mt-1 block text-sm text-gray-500">
                  {method.description}
                </span>
              </div>

              {/* Selected indicator */}
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
};

export default PaymentMethodComponent;