import PolicyLayout from "../../components/PolicyLayout";

const ReturnRefundPolicy = () => {
  return (
    <PolicyLayout
      title="Return & Refund Policy"
      intro="At CDsAtbp, customer satisfaction is important to us. We offer a 7-day return period from the date the customer receives the item."
      sections={[
        {
          heading: "Eligible Returns",
          paragraphs: [
            "Returns or refunds may be approved under the following circumstances:",
          ],
          bullets: [
            "The wrong item was shipped.",
            "The item arrived damaged during transit.",
            "The vinyl record has a defect that causes skipping, repeating, or loss of audio during normal playback.",
            "The actual condition of the item significantly differs from the description or grading provided.",
          ],
        },
        {
          heading: "How to Request a Return",
          paragraphs: [
            "To request a return, customers must contact cdsatbplmtd@gmail.com within 7 days of receiving their order and provide clear photos or videos of the issue.",
            "All returned items must remain in their original condition, including any inserts, sleeves, and packaging whenever possible.",
            "Refunds or replacements will be processed after inspection and approval.",
          ],
        },
        {
          heading: "What Does NOT Qualify for Returns or Refunds",
          paragraphs: [
            "The following situations are not eligible for returns, exchanges, or refunds under this policy:",
          ],
          bullets: [
            "Issues that are resolved after cleaning or flattening.",
            "Issues that cannot be reproduced during in-store testing.",
            "Static noise, surface noise, or pops that do not cause the stylus to skip, repeat, or lose audio.",
            "Scratches, scuffs, or chips that do not affect playback.",
            "Minor warping that does not affect playability.",
            "Packaging imperfections such as small creases, dents, seam splits, scuffs, or missing/included stickers.",
            "Cosmetic wear or discoloration on covers, sleeves, inserts, or center labels.",
            "Off-center or duplicate center labels that do not affect playback.",
            "Dissatisfaction with the overall recording, mastering, or pressing quality.",
            "Change of mind, even if the item remains unopened.",
          ],
        },
        {
          heading: "Vintage & Pre-Owned Records Disclaimer",
          paragraphs: [
            "Vintage and pre-owned vinyl records may exhibit signs of age and previous use. Minor imperfections that are consistent with the stated grading are considered normal and are not grounds for returns or refunds.",
            "Customers are encouraged to carefully review product descriptions and photographs before making a purchase.",
          ],
        },
        {
          heading: "Acknowledgment",
          paragraphs: [
            "By placing an order with CDSatbp, customers acknowledge and agree to this Return & Refund Policy.",
          ],
        },
      ]}
    />
  );
};

export default ReturnRefundPolicy;