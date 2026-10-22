import PolicyLayout from "../../components/PolicyLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyLayout
      title="Privacy Policy"
      intro="At CDSatbp, we respect your privacy and are committed to protecting your personal information."
      sections={[
        {
          heading: "Information We Collect",
          paragraphs: [
            "Information such as your name, address, email, phone number, and payment details is collected solely for order processing, shipping, customer support, and improving our services.",
          ],
        },
        {
          heading: "How We Use and Share Your Information",
          paragraphs: [
            "We do not sell, rent, or share your personal information with third parties except as required to complete your transactions, fulfill deliveries, or comply with legal obligations.",
          ],
        },
        {
          heading: "Privacy Concerns",
          paragraphs: [
            "For any privacy-related concerns, please contact us at cdsatbplmtd@gmail.com",
          ],
        },
      ]}
    />
  );
};

export default PrivacyPolicy;