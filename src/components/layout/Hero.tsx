"use client";

import { useRef } from "react";
import { useGSAP, gsap, SplitText, ScrollTrigger } from "@/lib/gsap";
import Navbar from "./Navbar";

// Figma assets — swap for /public exports in production
const imgGradient = "http://localhost:3845/assets/abd1c9e06475b1eea0944644f19510ca640c5e96.svg";
const imgTagDot   = "http://localhost:3845/assets/b1217211d2b1b83fea2a2b20a10d0c39150f9bb2.svg";
const imgCircle   = "http://localhost:3845/assets/6398feaf007b4f25888fc4fb5450715c7cd4cae7.svg";

interface HeroProps {
  isVisible: boolean;
}

export default function Hero({ isVisible }: HeroProps) {
  const sectionRef  = useRef<HTMLElement>(null);
  const tagRef      = useRef<HTMLDivElement>(null);
  const headingRef  = useRef<HTMLHeadingElement>(null);
  const descRef     = useRef<HTMLParagraphElement>(null);
  const ctaRef      = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // ── Entrance ──────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (!isVisible || hasAnimated.current) return;
      hasAnimated.current = true;

      const heading = headingRef.current;
      if (!heading) return;

      const split = new SplitText(heading, { type: "words" });
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(tagRef.current, { opacity: 0, y: 8, duration: 0.45 })
        .from(
          split.words,
          { y: "105%", opacity: 0, duration: 0.85, stagger: { amount: 0.32, from: "start" } },
          "-=0.15"
        )
        .from(descRef.current, { opacity: 0, y: 12, duration: 0.6, ease: "power3.out" }, "-=0.5")
        .from(ctaRef.current,  { opacity: 0, y: 8,  duration: 0.4, ease: "power3.out" }, "-=0.4");

      return () => split.revert();
    },
    { scope: sectionRef, dependencies: [isVisible] }
  );

  // ── Scroll: pin + fade out ─────────────────────────────────────────
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=80%",
        pin: true,
        pinSpacing: true,
        scrub: 0.8,
        onUpdate: (self) => {
          gsap.set(section, { opacity: 1 - self.progress * 1.2 });
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden"
      style={{ padding: "40px 80px", fontFamily: "var(--font-sans)" }}
    >
      {/* ── Background beam (Figma SVG) ───────────────────────── */}
      <img
        src={imgGradient}
        aria-hidden
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ objectFit: "cover", objectPosition: "top right" }}
      />

      {/* ── Navbar ───────────────────────────────────────────── */}
      <Navbar isVisible={isVisible} />

      {/* ── Hero body — fills remaining height, content at bottom */}
      <div className="relative z-10 flex flex-1 items-end justify-between">

        {/* Left: tag + heading + description */}
        <div className="relative flex flex-col gap-4">
          {/* Tag */}
          <div
            ref={tagRef}
            className="flex items-center gap-2"
            style={{ fontSize: 12, color: "#e6eaea" }}
          >
            <img src={imgTagDot} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
            <span>
              Discover all our{" "}
              <a
                href="/work"
                style={{
                  color: "#e6eaea",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                projects
              </a>
            </span>
          </div>

          {/* Heading — overflow-hidden clips the word-level enter */}
          <div style={{ overflow: "hidden" }}>
            <h1
              ref={headingRef}
              style={{
                fontSize: "clamp(4.5rem, 7.5vw, 112px)",
                letterSpacing: "-0.03em",
                lineHeight: 0.92,
                fontWeight: 300,
                color: "var(--color-beige)",
              }}
            >
              {/* "A " — white, light */}
              <span style={{ color: "var(--color-beige)", fontWeight: 300 }}>A </span>
              {/* "pixel " — muted keyword */}
              <span style={{ color: "var(--color-keyword)", fontWeight: 300 }}>pixel </span>
              {/* "boutique." — white, black weight */}
              <span style={{ color: "var(--color-beige)", fontWeight: 900 }}>boutique.</span>
            </h1>
          </div>

          {/* Description — sits to the right of heading */}
          <p
            ref={descRef}
            style={{
              position: "absolute",
              left: "38%",
              bottom: 0,
              maxWidth: 340,
              fontSize: 20,
              fontWeight: 400,
              lineHeight: 1.5,
              color: "var(--color-beige)",
            }}
          >
            Us two in every move, crafting design pages, capturing the brand essence.
          </p>
        </div>

        {/* Right: CTA */}
        <div
          ref={ctaRef}
          className="flex items-center gap-3"
          style={{ cursor: "none" }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "var(--color-beige)",
            }}
          >
            Receive a quote
          </span>
          <img
            src={imgCircle}
            alt="→"
            style={{ width: 32, height: 32, flexShrink: 0 }}
          />
        </div>
      </div>
    </section>
  );
}
