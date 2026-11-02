"use client";

import { useEffect, useState } from "react";

const HERO_IMAGES = [
  { src: "/fashion/homepage-hero-studio.jpeg", alt: "Tailors creating a colourful garment in a sewing studio" },
  { src: "/fashion/homepage-hero-designer.jpeg", alt: "Fashion designer working with vibrant African fabric" },
] as const;

const ROTATION_INTERVAL = 10_000;

export function HomepageHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <div className="hero-carousel relative h-full min-h-72 w-full" role="region" aria-label="Tailorly fashion highlights">
      {HERO_IMAGES.map((image, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          data-static-image
          fetchPriority="high"
          className={`hero-carousel-image absolute inset-0 h-full w-full rounded-[1.35rem] object-cover ${activeIndex === index ? "is-active" : ""}`}
          aria-hidden={activeIndex !== index}
        />
      ))}
      <link rel="preload" as="image" href={HERO_IMAGES[0].src} />
      <link rel="preload" as="image" href={HERO_IMAGES[1].src} />
      <div className="hero-carousel-indicators absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-navy/60 px-3 py-2 backdrop-blur-sm">
        {HERO_IMAGES.map((image, index) => (
          <button
            key={image.src}
            type="button"
            className={`hero-carousel-dot ${activeIndex === index ? "is-active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show fashion highlight ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
