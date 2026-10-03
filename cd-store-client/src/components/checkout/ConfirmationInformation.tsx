import type { DeliveryMethod } from "../../services/orderServices";

type ValidationErrors = {
  customerName?: string;
  phone?: string;
  province?: string;
  city?: string;
  barangay?: string;
  streetAddress?: string;
  postalCode?: string;
};

type CustomerInformationProps = {
  customerName: string;
  phone: string;
  province: string;
  city: string;
  barangay: string;
  streetAddress: string;
  postalCode: string;

  deliveryMethod: DeliveryMethod;

  validationErrors: ValidationErrors;

  onCustomerNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onBarangayChange: (value: string) => void;
  onStreetAddressChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
};

const CustomerInformation = ({
  customerName,
  phone,
  province,
  city,
  barangay,
  streetAddress,
  postalCode,
  deliveryMethod,
  validationErrors,
  onCustomerNameChange,
  onPhoneChange,
  onProvinceChange,
  onCityChange,
  onBarangayChange,
  onStreetAddressChange,
  onPostalCodeChange,
}: CustomerInformationProps) => {
  const isDelivery = deliveryMethod !== "STORE_PICKUP";

  const inputClass = (error?: string) =>
    `w-full rounded-lg border px-4 py-3 outline-none transition ${
      error
        ? "border-red-500 focus:border-red-500"
        : "border-gray-300 focus:border-gray-900"
    } disabled:bg-gray-100`;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-semibold text-gray-900">
        Customer Information
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Full Name */}
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
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className={inputClass(validationErrors.customerName)}
            placeholder="Juan Dela Cruz"
          />

          {validationErrors.customerName && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.customerName}
            </p>
          )}
        </div>

        {/* Phone */}
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
            onChange={(e) => onPhoneChange(e.target.value)}
            className={inputClass(validationErrors.phone)}
            placeholder="09171234567"
          />

          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.phone}
            </p>
          )}
        </div>

        {/* Province */}
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
            onChange={(e) => onProvinceChange(e.target.value)}
            disabled={!isDelivery}
            className={inputClass(validationErrors.province)}
            placeholder="Laguna"
          />

          {validationErrors.province && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.province}
            </p>
          )}
        </div>

        {/* City */}
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
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!isDelivery}
            className={inputClass(validationErrors.city)}
            placeholder="Calamba City"
          />

          {validationErrors.city && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.city}
            </p>
          )}
        </div>

        {/* Barangay */}
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
            onChange={(e) => onBarangayChange(e.target.value)}
            disabled={!isDelivery}
            className={inputClass(validationErrors.barangay)}
            placeholder="Barangay"
          />

          {validationErrors.barangay && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.barangay}
            </p>
          )}
        </div>

        {/* Postal Code */}
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
            onChange={(e) => onPostalCodeChange(e.target.value)}
            disabled={!isDelivery}
            className={inputClass(validationErrors.postalCode)}
            placeholder="4027"
          />

          {validationErrors.postalCode && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.postalCode}
            </p>
          )}
        </div>

        {/* Street Address */}
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
            onChange={(e) => onStreetAddressChange(e.target.value)}
            disabled={!isDelivery}
            rows={3}
            className={inputClass(validationErrors.streetAddress)}
            placeholder="House/Building No., Street"
          />

          {validationErrors.streetAddress && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.streetAddress}
            </p>
          )}
        </div>
      </div>

      {!isDelivery && (
        <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          Your order will be prepared for pickup at the Pasay store. Delivery
          address is not required.
        </div>
      )}
    </section>
  );
};

export default CustomerInformation;