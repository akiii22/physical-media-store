import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PolicyLayout from "../../components/PolicyLayout";

const faqs = [
  {
    question: "How do you grade your vinyl records?",
    answer:
      "We generally follow Goldmine grading standards, including Mint (M), Near Mint (NM), Excellent (EX), Very Good Plus (VG+), and other accepted conditions.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept QRPh payments and major credit cards.",
  },
  {
    question: "Which couriers do you use?",
    answer: "We ship through J&T Express Philippines and Lalamove.",
  },
  {
    question: "Do you accept returns?",
    answer:
      "Yes. We offer a 7-day return period for eligible cases. Please review our Return & Refund Policy for details.",
  },
  {
    question: "Do you sell original pressings and reissues?",
    answer:
      "Yes. Product descriptions clearly indicate whether an item is an original pressing or a reissue.",
  },
  {
    question: "Do you buy or trade vinyl records?",
    answer:
      "Yes. Feel free to contact us if you have collections that you wish to sell or trade.",
  },
  {
    question: "Do you offer international shipping?",
    answer:
      "International shipping may be arranged upon request, subject to additional fees and courier availability.",
  },
];

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PolicyLayout
      title="Frequently Asked Questions"
      intro="Find answers to common questions about our vinyl records, payments, shipping, and returns."
      sections={[]}
    >
      <div className="divide-y divide-[#eadedb] rounded-2xl border border-[#eadedb] bg-white px-5 sm:px-7">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const answerId = `faq-answer-${index}`;

          return (
            <div key={faq.question} className="py-5">
              <button
                type="button"
                onClick={() =>
                  setOpenIndex(isOpen ? null : index)
                }
                aria-expanded={isOpen}
                aria-controls={answerId}
                className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-[#292321] transition hover:text-[#b83e5b] sm:text-base"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  id={answerId}
                  className="mt-3 pr-6 text-sm leading-7 text-[#786b67]"
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PolicyLayout>
  );
};

export default FAQs;