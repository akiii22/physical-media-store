import PolicyLayout from "../../components/PolicyLayout";

const TermsAndConditions = () => {
  return (
    <PolicyLayout
      title="Terms and Conditions"
      intro="By accessing and using the PlakadosPH website, you agree to these terms and conditions."
      sections={[
        {
          heading: "Product Availability and Information",
          paragraphs: [
            "All products are subject to availability.",
            "Product descriptions and vinyl grading are provided to the best of our knowledge using accepted collector standards.",
          ],
        },
        {
          heading: "Pricing and Order Cancellation",
          paragraphs: [
            "Prices may change without prior notice.",
            "We reserve the right to cancel orders involving pricing errors, fraudulent activity, or unavailable inventory.",
          ],
        },
        {
          heading: "Intellectual Property",
          paragraphs: [
            "Unauthorized reproduction of website content, logos, or images is prohibited.",
          ],
        },
      ]}
    />
  );
};

export default TermsAndConditions;