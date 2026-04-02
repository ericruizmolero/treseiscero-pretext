"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

const PHASES = [
  "The smallest\nunit of meaning.",
  "A precise color\nin a precise place.",
  "One deliberate\ndecision at a time.",
];

interface PreloaderProps {
  onComplete: () => void;
  done: boolean;
}

export default function Preloader({ onComplete, done }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const display = displayRef.current;
      if (!container || !display) return;

      document.body.classList.add("is-loading");

      const tl = gsap.timeline({
        onComplete: () => {
          document.body.classList.remove("is-loading");
          onComplete();
        },
      });

      // ── 1. Single pixel appears ───────────────────────────────────
      tl.set(pixelRef.current, { scale: 0, opacity: 0 })
        .to(pixelRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3)" })
        .to(pixelRef.current, { scale: 2.5, duration: 0.15, ease: "power2.out", yoyo: true, repeat: 1 })
        .to(pixelRef.current, { opacity: 0, duration: 0.15 }, "+=0.1")
        .set(lineRef.current, { scaleX: 0, opacity: 1 })
        .to(lineRef.current, { scaleX: 1, duration: 0.5, ease: "power3.inOut" });

      // ── 2. Phrases — plain text, no labels ───────────────────────
      const hold = 1.0;

      PHASES.forEach((phrase) => {
        tl.call(() => { display.textContent = phrase; })
          .from(display, { opacity: 0, y: 14, duration: 0.5, ease: "power3.out" }, "<0.05")
          .to(display, { opacity: 0, y: -8, duration: 0.3, ease: "power2.in" }, `+=${hold}`);
      });

      // ── 3. Progress bar ───────────────────────────────────────────
      tl.to(
        progressRef.current,
        { scaleX: 1, duration: PHASES.length * (hold + 0.8), ease: "none" },
        1.4
      );

      // line fades before exit
      tl.to(lineRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });

      // ── 4. Slide out ──────────────────────────────────────────────
      tl.to(container, { yPercent: -100, duration: 0.85, ease: "power4.inOut" });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "var(--color-navy)",
        pointerEvents: done ? "none" : "all",
      }}
    >
      {/* Pixel */}
      <div
        ref={pixelRef}
        className="absolute"
        style={{ width: 6, height: 6, backgroundColor: "var(--color-beige)", transformOrigin: "center center", opacity: 0 }}
      />

      {/* Line */}
      <div
        ref={lineRef}
        className="absolute left-0 right-0"
        style={{ height: 1, backgroundColor: "var(--color-beige)", opacity: 0, transformOrigin: "left center" }}
      />

      {/* Text — just the phrase, nothing else */}
      <h2
        ref={displayRef}
        className="relative z-10 -mt-16 px-8 text-center text-4xl font-light leading-[1.1] select-none md:text-6xl lg:text-7xl"
        style={{
          whiteSpace: "pre-line",
          fontFamily: "var(--font-sans)",
          color: "var(--color-beige)",
          fontWeight: 300,
        }}
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[1px] w-full" style={{ backgroundColor: "rgba(249,249,241,0.12)" }}>
        <div
          ref={progressRef}
          className="h-full w-full origin-left"
          style={{ backgroundColor: "var(--color-beige)", transform: "scaleX(0)" }}
        />
      </div>

      {/* Studio name */}
      <span
        className="absolute bottom-6 right-8 select-none text-[0.6rem] uppercase tracking-[0.25em] opacity-35"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        treseiscero
      </span>
    </div>
  );
}
