
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";

import { getActiveAnnouncements } from "../services/announcementService";

const ROTATION_INTERVAL = 5000;

export default function AnnouncementCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    data: announcements = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: getActiveAnnouncements,
    staleTime: 60_000,
  });

  const total = announcements.length;

  // Always use a valid index if announcements are added or removed.
  const safeIndex = total > 0 ? activeIndex % total : 0;
  const announcement = announcements[safeIndex];

  // Automatically advance while multiple announcements exist.
  useEffect(() => {
    if (total <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % total);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [total]);

  const goToPrevious = () => {
    if (total <= 1) return;

    setActiveIndex((current) => (current - 1 + total) % total);
  };

  const goToNext = () => {
    if (total <= 1) return;

    setActiveIndex((current) => (current + 1) % total);
  };

  // No banner when announcements are unavailable or empty.
  if (isPending || isError || !announcement) {
    return null;
  }

  return (
    <section
      aria-label="Store announcements"
      aria-roledescription="carousel"
      className="bg-gray-50 px-4 pt-5 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-2xl bg-gray-950 shadow-sm">
          {announcement.image_url && (
            <img
              key={announcement.image_url}
              src={announcement.image_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}

          {/* Dark overlay for text contrast. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/65 to-black/20" />

          <div className="flex min-h-[280px] items-center sm:min-h-[320px] lg:min-h-[360px]">
            <div
              key={announcement.id}
              className="w-full max-w-3xl px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                <Megaphone size={14} aria-hidden="true" />
                Store announcement
              </div>

              <p className="mb-3 text-sm font-medium text-white/75">
                {announcement.title}
              </p>

              <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {announcement.heading}
              </h2>

              {announcement.description && (
                <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                  {announcement.description}
                </p>
              )}

              {total > 1 && (
                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goToPrevious}
                    aria-label="Previous announcement"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div
                    className="flex items-center gap-2"
                    aria-label={`Announcement ${safeIndex + 1} of ${total}`}
                  >
                    {announcements.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Go to announcement ${index + 1}`}
                        aria-current={
                          index === safeIndex ? "true" : undefined
                        }
                        className={`h-2 rounded-full transition-all ${
                          index === safeIndex
                            ? "w-7 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label="Next announcement"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
