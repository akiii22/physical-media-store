import PolicyLayout from "../../components/PolicyLayout";

const ShippingPolicy = () => {
  return (
    <PolicyLayout
      title="Shipping Policy"
      intro="CDSatbp ships vinyl records nationwide within the Philippines."
      sections={[
        {
          heading: "Order Processing",
          paragraphs: [
            "Orders are processed within 1–3 business days after payment confirmation.",
            "We accept payments via QRPh and major credit cards.",
          ],
        },
        {
          heading: "Shipping and Delivery",
          paragraphs: [
            "Our shipping partners are J&T Express Philippines and Lalamove.",
            "Shipping fees are calculated during checkout.",
            "All records are securely packed to minimize the risk of damage during transit.",
            "Delivery times may vary depending on the destination and courier availability.",
          ],
        },
        {
          heading: "Inspecting Your Order",
          paragraphs: [
            "Customers are encouraged to inspect their orders immediately upon receipt and report any issues within 48 hours.",
          ],
        },
      ]}
    />
  );
};

export default ShippingPolicy;