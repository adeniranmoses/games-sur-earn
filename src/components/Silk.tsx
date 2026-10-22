"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";

export default function Silk({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Initialize Lenis for buttery-smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Store the frame ID so we can cancel it on cleanup
    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Initial premium fade-in animation using GSAP
    gsap.fromTo(
      ".silk-animate",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.1 }
    );

    return () => {
      // Cancel the loop FIRST, then destroy lenis
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <div className="w-full h-full">{children}</div>;
}
