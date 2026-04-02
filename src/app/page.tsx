"use client";

import { useState } from "react";
import Preloader from "@/components/layout/Preloader";
import Hero from "@/components/layout/Hero";

export default function Home() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  return (
    <main>
      {/* Preloader stays mounted; GSAP drives its exit animation */}
      <Preloader
        onComplete={() => setPreloaderDone(true)}
        done={preloaderDone}
      />
      <Hero isVisible={preloaderDone} />
    </main>
  );
}
