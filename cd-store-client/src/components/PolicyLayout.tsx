
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Footer from "../components/Footer"
import type { ReactNode } from "react";

export type PolicySection = {
  heading: string; 
  paragraphs: string[];
  bullets?: string[];
};

type PolicyLayoutProps = {
  title: string;
  intro: string;
  sections: PolicySection[];
  children?: ReactNode;
};

const policyLinks = [
  ["Vinyl Record Grading", "/vinyl-record-grading"],
  ["Privacy Policy", "/privacy-policy"],
  ["Shipping Policy", "/shipping-policy"],
  ["Return and Refund Policy", "/return-and-refund-policy"],
  ["Terms and Conditions", "/terms-and-conditions"],
  ["FAQs", "/faqs"],
];

export default function PolicyLayout({
  title,
  intro,
  sections,
}: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fffdfb] text-[#292321]">
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#8a625d] hover:text-[#b83e5b]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <header className="mt-10 border-b border-[#eadedb] pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b83e5b]">
            CDs Atbp. · Customer Information
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl leading-7 text-[#786b67]">
            {intro}
          </p>
        </header>

        <div className="grid gap-10 py-10 md:grid-cols-[minmax(0,1fr)_240px]">
          <article className="space-y-9">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold">{section.heading}</h2>

                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 leading-7 text-[#655956]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-[#655956]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="rounded-xl border border-[#eadedb] bg-[#faf5f2] p-5">
              <p className="text-sm leading-6 text-[#655956]">
                This page contains draft information for client review.
                Please confirm the details before publishing.
              </p>
              <a
                href="mailto:cdsatbplmtd@gmail.com"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#b83e5b]"
              >
                Contact CDs Atbp.
                <ArrowRight size={15} />
              </a>
            </div>
          </article>

          <aside className="h-fit rounded-xl border border-[#eadedb] bg-white p-5">
            <h2 className="text-sm font-semibold">More information</h2>
            <nav className="mt-4 space-y-4">
              {policyLinks.map(([label, path]) => (
                <Link
                  key={path}
                  to={path}
                  className="block text-sm text-[#786b67] hover:text-[#b83e5b]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
