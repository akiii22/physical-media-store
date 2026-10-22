import { Mail, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF } from "@fortawesome/free-brands-svg-icons";

const quickLinks = [
  { label: "Vinyl Record Grading", to: "/vinyl-record-grading" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Return and Refund Policy", to: "/return-and-refund-policy" },
  { label: "Terms and Conditions", to: "/terms-and-conditions" },
  { label: "FAQs", to: "/faqs" },
];

const Footer = () => {
  return (
    <footer className="border-t border-[#eadedb] bg-[#faf5f2] px-6 pt-14 text-[#292321] sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 pb-12 sm:grid-cols-2 md:grid-cols-[1.3fr_1fr] md:gap-20">
        {/* Brand and contact */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <Link
            to="/"
            aria-label="CDs Atbp. homepage"
            className="inline-block"
          >
            <img
              src="/Logo.png"
              alt="CDs Atbp."
              className="h-32 w-32 object-contain"
            />
          </Link>

          <p className="mt-3 text-sm leading-6 text-[#786b67]">
            Music, movies, memories.
            <br />
            Your home for physical media.
          </p>

          <a
            href="hhttps://www.facebook.com/share/18r2aHcTDi/"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e6d4cf] bg-white text-[#463633] transition hover:border-[#d85c78] hover:bg-[#d85c78] hover:text-white"
          >
            <FontAwesomeIcon icon={faFacebookF} />
          </a>

          <div className="mt-5 space-y-3 text-sm text-[#786b67]">
            <a
              href="mailto:cdsatbplmtd@gmail.com"
              className="flex items-center justify-center gap-2 transition hover:text-[#b83e5b] sm:justify-start"
            >
              <Mail size={16} strokeWidth={1.7} />
              cdsatbplmtd@gmail.com
            </a>

            <a
              href="mailto:cdsatbplmtd2@gmail.com"
              className="block break-all transition hover:text-[#b83e5b]"
            >
              cdsatbplmtd2@gmail.com
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div className="sm:pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a47770]">
            Explore & Information
          </h2>

          <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
  {quickLinks.map((item) => (
    <li key={item.to}>
      <Link
        to={item.to}
        className="text-sm text-[#655956] transition hover:text-[#b83e5b]"
      >
        {item.label}
      </Link>
    </li>
  ))}
</ul>

          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#302725] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#b83e5b]"
          >
            Explore the collection
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-[#eadedb] py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-[#887a76]">
            © {new Date().getFullYear()} CDs Atbp. All rights reserved.
          </p>

          <p className="text-xs text-[#887a76]">
            Made for music and movie lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;