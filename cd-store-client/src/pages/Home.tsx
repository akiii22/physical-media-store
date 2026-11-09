
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Disc3,
  Music,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getProducts } from "../services/productServices";
import type { Product } from "../types/product";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

// =====================================================
// HOMEPAGE BANNERS
// =====================================================

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
      "Take a look at popular items available at CDs Atbp.",
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

// =====================================================
// HOME COMPONENT
// =====================================================

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  // Automatic banner slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((current) =>
        current === banners.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await getProducts();
        setProducts(result.data);
      } catch (error) {
        console.error("Failed to load homepage products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const newArrivals = products.slice(0, 4);

  const previousBanner = () => {
    setCurrentBanner((current) =>
      current === 0 ? banners.length - 1 : current - 1
    );
  };

  const nextBanner = () => {
    setCurrentBanner((current) =>
      current === banners.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white text-gray-900">

      {/* =====================================================
          STORE COVER
      ====================================================== */}

      <section className="relative isolate overflow-hidden bg-[url('/bg.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/80 to-black/30" />

        <div className="mx-auto flex min-h-[540px] max-w-7xl items-center px-6 py-20 lg:px-8">
          <div className="max-w-2xl text-white">

            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-400/40 bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-300 backdrop-blur-sm">
              <Disc3 size={17} />
              CDs Atbp.
            </span>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Your collection.
              <br />
              <span className="text-pink-500">
                Your memories.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-300 sm:text-lg">
              Discover CDs, vinyl records, cassette tapes, VCDs,
              DVDs, and more. Find something worth adding to
              your collection at CDs Atbp.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5 hover:bg-pink-600"
              >
                Shop Collection
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-gray-900"
              >
                Browse Products
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          PROMOTIONAL BANNER SLIDER
      ====================================================== */}

      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">

          <div className="relative isolate overflow-hidden rounded-3xl bg-gray-950 shadow-xl">
            <div className="relative h-[430px] sm:h-[480px] lg:h-[520px]">

              {banners.map((banner, index) => (
                <div
                  key={banner.image}
                  aria-hidden={index !== currentBanner}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentBanner
                      ? "z-10 opacity-100"
                      : "pointer-events-none z-0 opacity-0"
                  }`}
                >
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/35" />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

                  <div className="relative z-10 flex h-full items-center px-8 sm:px-14 lg:px-20">
                    <div className="max-w-xl text-white">

                      <span className="inline-flex rounded-full border border-pink-400/30 bg-pink-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                        {banner.badge}
                      </span>

                      <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                        {banner.title}
                      </h2>

                      <p className="mt-5 max-w-lg text-base leading-7 text-gray-200 sm:text-lg">
                        {banner.description}
                      </p>

                      <Link
                        to={banner.link}
                        tabIndex={index === currentBanner ? 0 : -1}
                        className="mt-8 inline-flex items-center gap-3 rounded-lg bg-pink-500 px-6 py-3.5 font-semibold text-white transition hover:bg-pink-600"
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
                onClick={previousBanner}
                aria-label="Previous banner"
                className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-pink-500"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextBanner}
                aria-label="Next banner"
                className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-pink-500"
              >
                <ArrowRight size={20} />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {banners.map((banner, index) => (
                  <button
                    key={banner.image}
                    type="button"
                    onClick={() => setCurrentBanner(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    aria-current={index === currentBanner}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentBanner
                        ? "w-9 bg-pink-500"
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
          FEATURED HIGHLIGHTS
      ====================================================== */}

      <section className="border-y border-gray-100 bg-gray-50 px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">
                Discover Something Special
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Featured Highlights
              </h2>

              <p className="mt-3 max-w-xl leading-7 text-gray-500">
                Explore featured artists, memorable releases,
                and special collections from the world of music
                and entertainment.
              </p>
            </div>

            <Link
              to="/products"
              className="group inline-flex items-center gap-2 font-semibold text-pink-600 transition hover:text-pink-700"
            >
              Explore Collection
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            <FeaturedImage
              label="BINI"
              image="/Bini-02.webp"
              category="Featured Artist"
            />

            <FeaturedImage
              label="Regine Velasquez"
              image="/regine-01.jpg"
              category="Featured Artist"
            />

            <FeaturedImage
              label="Sarah Geronimo"
              image="/Sarah-2.jpg"
              category="Featured Artist"
            />

          </div>

        </div>
      </section>

      {/* =====================================================
          BEST SELLER
      ====================================================== */}

      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Best Seller Image */}
            <div className="group relative isolate overflow-hidden rounded-3xl bg-gray-100 shadow-lg">
              <img
                src="/August Best Selling.jpg"
                alt="CDs Atbp. Best Seller"
                loading="lazy"
                className="h-[360px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[460px]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              <span className="absolute bottom-6 left-6 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
                Popular at CDs Atbp.
              </span>
            </div>

            {/* Content */}
            <div className="py-4">

              <span className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-pink-600">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Best Seller
              </span>

              <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
                A favorite among
                <span className="block text-pink-500">
                  collectors.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-8 text-gray-500">
                Take a look at one of the popular items available
                at CDs Atbp. Discover something special for your
                collection.
              </p>

              <Link
                to="/products"
                className="mt-8 inline-flex items-center gap-3 rounded-lg bg-gray-950 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pink-500"
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

      <section className="bg-gray-50 px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">
                Latest Additions
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                New Arrivals
              </h2>

              <p className="mt-3 text-gray-500">
                Check out the latest additions to our collection.
              </p>
            </div>

            <Link
              to="/products"
              className="group inline-flex items-center gap-2 font-semibold text-pink-600 transition hover:text-pink-700"
            >
              View All Products
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-2xl bg-gray-200"
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
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <Disc3
                size={36}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-bold text-gray-800">
                No products available yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Check back soon for new additions to our collection.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          SHOP BY FORMAT
      ====================================================== */}

      <section className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">
              Explore
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Shop by Format
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-500">
              Find the format you're looking for and discover
              something worth collecting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

            <FormatCard
              title="CD"
              icon={<Disc3 size={28} />}
              href="/products?media_type=CD"
            />

            <FormatCard
              title="Vinyl"
              icon={<Disc3 size={28} />}
              href="/products?media_type=VINYL"
            />

            <FormatCard
              title="Cassette"
              icon={<Music size={28} />}
              href="/products?media_type=CASSETTE"
            />

            <FormatCard
              title="VCD"
              icon={<Play size={28} />}
              href="/products?media_type=VCD"
            />

            <FormatCard
              title="DVD"
              icon={<Play size={28} />}
              href="/products?media_type=DVD"
            />

          </div>
        </div>
      </section>

      {/* =====================================================
          CALL TO ACTION
      ====================================================== */}

      <section className="px-6 pb-16 lg:px-8 lg:pb-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gray-950">

          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 via-transparent to-transparent" />

          <div className="relative px-6 py-16 text-center sm:px-12 sm:py-20">

            <span className="text-sm font-bold uppercase tracking-[0.2em] text-pink-400">
              CDs Atbp.
            </span>

            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Looking for something special?
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-300">
              Browse the full CDs Atbp. collection and discover
              something worth adding to your collection.
            </p>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-3 rounded-lg bg-pink-500 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pink-600"
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

      <Footer />

    </div>
  );
};

// =====================================================
// FEATURED IMAGE COMPONENT
// =====================================================

type FeaturedImageProps = {
  image: string;
  label: string;
  category?: string;
};

const FeaturedImage = ({
  image,
  label,
  category = "Featured Collection",
}: FeaturedImageProps) => {
  return (
    <div className="group relative isolate overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">

      <div className="relative aspect-[4/5] overflow-hidden bg-gray-200">

        <img
          src={image}
          alt={label}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Dark Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Category Badge */}
        <div className="absolute left-5 top-5">
          <span className="rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm backdrop-blur-md">
            {category}
          </span>
        </div>

        {/* Image Caption */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <div className="translate-y-2 transition-transform duration-500 group-hover:translate-y-0">

            <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {label}
            </p>

            <div className="mt-3 h-1 w-10 rounded-full bg-pink-500 transition-all duration-500 group-hover:w-16" />

          </div>
        </div>

      </div>
    </div>
  );
};

// =====================================================
// FORMAT CARD COMPONENT
// =====================================================

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
      className="group flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 hover:shadow-lg"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-700 transition-all duration-300 group-hover:bg-pink-50 group-hover:text-pink-500">
        {icon}
      </div>

      <span className="mt-4 font-bold text-gray-800 transition-colors group-hover:text-pink-600">
        {title}
      </span>

      <span className="mt-1 text-xs text-gray-400">
        Explore
      </span>
    </Link>
  );
};

export default Home;
