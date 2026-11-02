"use client";

import { useEffect, useState } from "react";

type RotatingImage = Readonly<{ src: string; alt: string }>;

export function ImageRotator({
  images,
  interval = 7000,
  className = "",
  imageClassName = "",
  label = "Featured images",
}: {
  images: readonly RotatingImage[];
  interval?: number;
  className?: string;
  imageClassName?: string;
  label?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (images.length < 2) return;
    setIndex(1 + Math.floor(Math.random() * (images.length - 1)));
  }, [images.length]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || images.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [images.length, interval, paused, reducedMotion]);

  if (!images.length) return null;
  const current = images[index] ?? images[0];

  return (
    <div className={`image-rotator ${className}`} role="group" aria-label={label}>
      <img key={current.src} src={current.src} alt={current.alt} className={`image-rotator-image ${imageClassName}`} />
      {images.length > 1 ? (
        <div className="image-rotator-controls">
          <button type="button" onClick={() => setIndex((index + images.length - 1) % images.length)} aria-label="Previous image">‹</button>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play image rotation" : "Pause image rotation"}>{paused ? "▶" : "Ⅱ"}</button>
          <button type="button" onClick={() => setIndex((index + 1) % images.length)} aria-label="Next image">›</button>
        </div>
      ) : null}
    </div>
  );
}
