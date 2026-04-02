"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

// Figma assets — swap for /public exports in production
const imgLogo = "http://localhost:3845/assets/8ec4f8d3199487773e5964dcbe56167b8b1a05f2.svg";
const imgChevron = "http://localhost:3845/assets/37a0360cd1fa24ee0968608af655c45f4d77dae5.svg";

const NAV_TABS = ["Portfolio", "Small & Specialized", "Services"];

interface NavbarProps {
  isVisible: boolean;
}

export default function Navbar({ isVisible }: NavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useGSAP(
    () => {
      if (!isVisible || hasAnimated.current) return;
      hasAnimated.current = true;

      const tabs = tabsRef.current?.querySelectorAll("[data-tab]");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(logoRef.current, { opacity: 0, y: -10, duration: 0.5 })
        .from(
          tabs ? Array.from(tabs) : [],
          { opacity: 0, y: -8, duration: 0.4, stagger: 0.07 },
          "-=0.3"
        )
        .from(sinceRef.current, { opacity: 0, duration: 0.35 }, "-=0.2");
    },
    { scope: navRef, dependencies: [isVisible] }
  );

  return (
    <nav
      ref={navRef}
      className="relative z-20 flex w-full items-center justify-between shrink-0"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Left: logo + tabs */}
      <div className="flex items-center gap-10">
        {/* Logo */}
        <div ref={logoRef} style={{ width: 160, height: 24, mixBlendMode: "color-dodge", flexShrink: 0 }}>
          <img
            src={imgLogo}
            alt="treseiscero"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        {/* Nav tabs */}
        <div ref={tabsRef} className="flex items-center gap-10">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              data-tab
              className="flex items-center gap-2 transition-opacity hover:opacity-100"
              style={{
                fontSize: 16,
                color: "rgba(249,249,241,0.7)",
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "var(--font-sans)",
                fontWeight: 400,
                cursor: "none",
              }}
            >
              {tab}
              <img src={imgChevron} alt="" style={{ width: 12, height: 12 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Right: SINCE 2020 */}
      <span
        ref={sinceRef}
        style={{
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#e6eaea",
          fontFamily: "var(--font-sans)",
        }}
      >
        Since 2020
      </span>
    </nav>
  );
}
