import PolicyLayout from "../../components/PolicyLayout";

const VinylRecordGrading = () => {
  return (
    <PolicyLayout
      title="Vinyl Record Grading Guide"
      intro="We use the following grading guide to describe the visual condition and playback quality of our vinyl records. Please review each grade before placing your order."
      sections={[
        {
          heading: "G (Good)",
          paragraphs: [
            "A record with heavy signs of use but still playable.",
          ],
          bullets: [
            "Numerous scratches, scuffs, and visible wear.",
            "Surface noise, clicks, and pops are consistently present.",
            "May have occasional light skips or repeating sections.",
            "Cover may show heavy wear, seam splits, writing, stains, or missing pieces.",
          ],
        },
        {
          heading: "VG (Very Good)",
          paragraphs: [
            "A well-loved record that plays through but shows obvious signs of use.",
          ],
          bullets: [
            "Multiple light-to-moderate scratches and scuffs.",
            "Noticeable surface noise, especially during quiet passages.",
            "Playback remains enjoyable without major issues.",
            "Cover may have ring wear, creases, small seam splits, stickers, or writing.",
          ],
        },
        {
          heading: "VG+ (Very Good Plus)",
          paragraphs: [
            "A clean, well-maintained copy with only minor signs of handling.",
          ],
          bullets: [
            "Light hairlines or superficial marks that do not significantly affect playback.",
            "Minimal surface noise and occasional light pops may be present.",
            "No skips, sticking, or repeating.",
            "Cover may show minor shelf wear, slight corner wear, or small creases.",
          ],
        },
        {
          heading: "Excellent (EX)",
          paragraphs: [
            "A premium copy that has been carefully handled and preserved.",
          ],
          bullets: [
            "Very few visible marks under strong lighting.",
            "Plays cleanly with little to no noticeable surface noise.",
            "No skips, repeats, or playback issues.",
            "Jacket remains crisp with only minimal signs of storage or handling.",
          ],
        },
        {
          heading: "Near Mint (NM)",
          paragraphs: [
            "A record that appears virtually unplayed and is as close to perfect as possible.",
          ],
          bullets: [
            "No visible scratches, scuffs, or handling marks.",
            "Playback is exceptionally clean and quiet.",
            "No skips, pops, or defects beyond normal manufacturing tolerances.",
            "Cover is pristine or nearly pristine, with sharp corners and minimal wear.",
          ],
        },
        {
          heading: "Important Notes",
          paragraphs: [],
          bullets: [
            "All records are visually inspected and playback-tested when necessary.",
            "Vintage vinyl may contain minor background noise due to age and original manufacturing processes.",
            "Surface noise that does not cause skipping, repeating, or audio loss is considered normal and may not qualify as a defect.",
            "Grading is subjective and based on overall condition, appearance, and playability.",
          ],
        },
      ]}
    />
  );
};

export default VinylRecordGrading;