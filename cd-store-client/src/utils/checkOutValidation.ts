import type {
  DeliveryMethod,
} from "../services/orderServices";

export type CheckoutValidationErrors = {
  customerName?: string;
  phone?: string;
  province?: string;
  city?: string;
  barangay?: string;
  streetAddress?: string;
  postalCode?: string;
};


 //Validation Rules


const nameRegex =
  /^[A-Za-zÀ-ÿ.'-]+(?:\s+[A-Za-zÀ-ÿ.'-]+)+$/;

const phoneRegex =
  /^09\d{9}$/;

const postalCodeRegex =
  /^\d{4}$/;



 //Checkout Validation

export const validateCheckout = ({
  customerName,
  phone,
  province,
  city,
  barangay,
  streetAddress,
  postalCode,
  deliveryMethod,
}: {
  customerName: string;
  phone: string;
  province: string;
  city: string;
  barangay: string;
  streetAddress: string;
  postalCode: string;
  deliveryMethod: DeliveryMethod;
}): CheckoutValidationErrors => {
  const errors: CheckoutValidationErrors = {};

  const name = customerName.trim();
  const normalizedPhone = phone.trim();

  const normalizedProvince = province.trim();
  const normalizedCity = city.trim();
  const normalizedBarangay = barangay.trim();
  const normalizedStreetAddress = streetAddress.trim();
  const normalizedPostalCode = postalCode.trim();


  //Customer Name


  if (!name) {
    errors.customerName = "Full name is required.";
  } else if (!nameRegex.test(name)) {
    errors.customerName =
      "Please enter a valid full name.";
  }

  // Phone

  if (!normalizedPhone) {
    errors.phone = "Phone number is required.";
  } else if (!phoneRegex.test(normalizedPhone)) {
    errors.phone =
      "Please enter a valid Philippine mobile number.";
  }


  //Delivery Address


  if (deliveryMethod === "DELIVERY") {
    if (!normalizedProvince) {
      errors.province = "Province is required.";
    } else if (normalizedProvince.length < 2) {
      errors.province =
        "Please enter a valid province.";
    }

    if (!normalizedCity) {
      errors.city = "City or municipality is required.";
    } else if (normalizedCity.length < 2) {
      errors.city =
        "Please enter a valid city or municipality.";
    }

    if (!normalizedBarangay) {
      errors.barangay = "Barangay is required.";
    } else if (normalizedBarangay.length < 2) {
      errors.barangay =
        "Please enter a valid barangay.";
    }

    if (!normalizedStreetAddress) {
      errors.streetAddress =
        "Street address is required.";
    } else if (
      normalizedStreetAddress.length < 5
    ) {
      errors.streetAddress =
        "Please enter a more complete street address.";
    } else if (
      normalizedStreetAddress.length > 100
    ) {
      errors.streetAddress =
        "Street address must be 100 characters or less.";
    }

    if (!normalizedPostalCode) {
      errors.postalCode =
        "Postal code is required.";
    } else if (
      !postalCodeRegex.test(normalizedPostalCode)
    ) {
      errors.postalCode =
        "Please enter a valid 4-digit postal code.";
    }
  }

  return errors;
};