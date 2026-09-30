import { useEffect, useState } from "react";
import { ArrowRight, Disc3, Music, Package, Play, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { getProducts } from "../services/productServices";
import type { Product } from "../types/product";
import ProductCard from "../components/ProductCard";

const banners = [
  {
    image: "/img1.jpg",
    badge: "New Arrivals",
    title: "Fresh finds just arrived.",
    description:
      "Discover the latest additions to the CDs Atbp. collection.",
    button: "Shop New Arrivals",
    link: "/products",
  },
  {
    image: "/img2.jpg",
    badge: "Special Offer",
    title: "Something special is waiting.",
    description:
      "Check out selected items and special offers available at CDs Atbp.",
    button: "Shop Now",
    link: "/products",
  },
  {
    image: "/img3.jpg",
    badge: "Featured Collection",
    title: "Explore our featured collection.",
    description:
      "Discover selected favorites from the CDs Atbp. collection.",
    button: "View Collection",
    link: "/products",
  },
  {
    image: "/img4.jpg",
    badge: "Best Seller",
    title: "A favorite among collectors.",
    description:
      "Take a look at one of the popular items available at CDs Atbp.",
    button: "View Best Sellers",
    link: "/products",
  },
  {
    image: "/img5.jpg",
    badge: "CDs Atbp.",
    title: "Music, movies, memories.",
    description:
      "Explore CDs, vinyl, cassette tapes, VCDs, DVDs and more.",
    button: "Browse Collection",
    link: "/products",
  },
];

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const interval = setInterval(() => {
    setCurrentBanner((current) =>
      current === banners.length - 1 ? 0 : current + 1
    );
  }, 5000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load homepage products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const newArrivals = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-black">

      {/* =====================================================
          STORE COVER
      ====================================================== */}
      <section className="relative overflow-hidden bg-[url(/bg.jpg)]">
        {/* Replace this background with the client's store photo */}
        <div className="absolute inset-0">
          <div className="h-full w-full bg-gradient-to-r from-black via-black/80 to-black/30" />
        </div>

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-6 py-20 lg:px-8">
          <div className="max-w-2xl text-white">

            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-400/50 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-300">
              <Disc3 size={16} />
              CDs Atbp.
            </span>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your collection.
              <br />
              <span className="text-pink-500">Your memories.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Discover CDs, vinyl records, cassette tapes, VCDs, DVDs,
              and more from CDs Atbp.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white transition hover:bg-pink-600"
              >
                Shop Collection
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white hover:text-black"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-8">
  <div className="mx-auto max-w-7xl">

    <div className="relative overflow-hidden rounded-2xl bg-black">

      {/* Slides */}
      <div className="relative h-[420px] sm:h-[480px] lg:h-[520px]">

        {banners.map((banner, index) => (
          <div
            key={banner.image}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentBanner
                ? "z-10 opacity-100"
                : "z-0 opacity-0"
            }`}
          >

            {/* Background Image */}
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            {/* Content */}
            <div className="relative z-20 flex h-full items-center px-8 sm:px-12 lg:px-16">

              <div className="max-w-xl text-white">

                <span className="inline-flex rounded-full bg-pink-500 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {banner.badge}
                </span>

                <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {banner.title}
                </h2>

                <p className="mt-5 max-w-lg text-base leading-7 text-gray-200 sm:text-lg">
                  {banner.description}
                </p>

                <Link
                  to={banner.link}
                  className="mt-7 inline-flex items-center gap-2 rounded-lg bg-pink-500 px-5 py-3 font-semibold text-white transition hover:bg-pink-600"
                >
                  {banner.button}
                  <ArrowRight size={18} />
                </Link>

              </div>

            </div>
          </div>
        ))}

        {/* Previous Button */}
        <button
          type="button"
          onClick={() =>
            setCurrentBanner((current) =>
              current === 0
                ? banners.length - 1
                : current - 1
            )
          }
          className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-pink-500"
          aria-label="Previous banner"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={() =>
            setCurrentBanner((current) =>
              current === banners.length - 1
                ? 0
                : current + 1
            )
          }
          className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-pink-500"
          aria-label="Next banner"
        >
          <ArrowRight size={20} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentBanner(index)}
              aria-label={`Go to banner ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === currentBanner
                  ? "w-8 bg-pink-500"
                  : "w-2 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>

      </div>
    </div>

  </div>
</section>

      {/* =====================================================
          FEATURED COLLECTION
      ====================================================== */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-pink-500">
                Featured Collection
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                BINI Collection
              </h2>

              <p className="mt-3 max-w-xl text-gray-600">
                Featured items from the collection at CDs Atbp.
              </p>
            </div>

            <Link
              to="/products"
              className="hidden items-center gap-2 font-semibold text-pink-500 hover:text-pink-600 sm:flex"
            >
              View Collection
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* 
            Replace these placeholders with the 3 BINI images
            from the client.
          */}
          <div className="grid gap-5 sm:grid-cols-3">

            <FeaturedImage
              label="BINI Collection"
              image="/BTW.jpg"
            />

            <FeaturedImage
              label="BINI Collection"
              image="/Feel Good.jpg"
            />

            <FeaturedImage
              label="BINI Collection"
              image="/Talaarawan.jpg"
            />

          </div>

          <div className="mt-8 sm:hidden">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 font-semibold text-pink-500"
            >
              View Collection
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          BEST SELLER
      ====================================================== */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="grid items-center gap-10 lg:grid-cols-2">

            {/* Best Seller Image */}
            <div className="overflow-hidden rounded-2xl bg-gray-100">
              <img
                src="/August Best Selling.jpg"
                alt="CDs Atbp. Best Seller"
                className="h-[420px] w-full object-cover"
              />
            </div>

            {/* Content */}
            <div>

              <span className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pink-600">
                ⭐ Best Seller
              </span>

              <h2 className="mt-5 text-4xl font-bold sm:text-5xl">
                A favorite among
                <span className="text-pink-500"> collectors.</span>
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-gray-600">
                Take a look at one of the most popular items
                available at CDs Atbp.
              </p>

              <Link
                to="/products"
                className="mt-7 inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                View Best Sellers
                <ArrowRight size={18} />
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          NEW ARRIVALS
      ====================================================== */}
      <section className="bg-gray-50 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex items-end justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-pink-500">
                Latest Additions
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                New Arrivals
              </h2>
            </div>

            <Link
              to="/products"
              className="hidden items-center gap-2 font-semibold text-pink-500 hover:text-pink-600 sm:flex"
            >
              View All
              <ArrowRight size={18} />
            </Link>

          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-xl bg-gray-200"
                />
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              No products available yet.
            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          SHOP BY FORMAT
      ====================================================== */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-pink-500">
              Explore
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Shop by Format
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Find the format you're looking for.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">

            <FormatCard
              title="CD"
              icon={<Disc3 />}
              href="/products?media_type=CD"
            />

            <FormatCard
              title="Vinyl"
              icon={<Disc3 />}
              href="/products?media_type=VINYL"
            />

            <FormatCard
              title="Cassette"
              icon={<Music />}
              href="/products?media_type=CASSETTE"
            />

            <FormatCard
              title="VCD"
              icon={<Play />}
              href="/products?media_type=VCD"
            />

            <FormatCard
              title="DVD"
              icon={<Play />}
              href="/products?media_type=DVD"
            />

          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-pink-500">

          <div className="px-8 py-14 text-center text-white sm:px-12">

            <h2 className="text-3xl font-bold sm:text-4xl">
              Looking for something special?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-pink-100">
              Browse the full CDs Atbp. collection and discover
              something worth adding to your collection.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-900"
            >
              Browse Collection
              <ArrowRight size={18} />
            </Link>

          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-gray-200 bg-black px-6 py-12 text-white lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h3 className="text-xl font-bold">
              CDs <span className="text-pink-500">Atbp.</span>
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              CDs, vinyl, cassette tapes, VCDs, DVDs & more.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 font-semibold text-pink-500 hover:text-pink-400"
          >
            Shop Now
            <ArrowRight size={17} />
          </Link>

        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-gray-800 pt-6 text-sm text-gray-500">
          © {new Date().getFullYear()} CDs Atbp. All rights reserved.
        </div>

      </footer>

    </div>
  );
};

/* =========================================================
   FEATURED IMAGE
========================================================= */

type FeaturedImageProps = {
  image: string;
  label: string;
};

const FeaturedImage = ({
  image,
  label,
}: FeaturedImageProps) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gray-200">
      <img
        src={image}
        alt={label}
        className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20">
        <p className="font-semibold text-white">
          {label}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   FORMAT CARD
========================================================= */

type FormatCardProps = {
  title: string;
  icon: React.ReactNode;
  href: string;
};

const FormatCard = ({
  title,
  icon,
  href,
}: FormatCardProps) => {
  return (
    <Link
      to={href}
      className="group flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:border-pink-300 hover:shadow-md"
    >
      <div className="text-gray-700 transition group-hover:text-pink-500">
        {icon}
      </div>

      <span className="mt-3 font-semibold">
        {title}
      </span>
    </Link>
  );
};

export default Home;