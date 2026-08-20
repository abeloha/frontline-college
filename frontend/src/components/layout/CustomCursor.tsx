"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hoveringLink, setHoveringLink] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    // Deliberately mount-only: `enabled` depends on browser-only APIs
    // (matchMedia) that don't exist during SSR, so it must be set post-mount
    // to avoid a hydration mismatch — this can't be computed during render.
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldEnable = isFinePointer && !prefersReducedMotion;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(shouldEnable);
    document.documentElement.classList.toggle("cursor-none-desktop", shouldEnable);
    return () => document.documentElement.classList.remove("cursor-none-desktop");
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    }
    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      setHoveringLink(!!target.closest("a, button, [data-cursor-hover]"));
    }
    function onLeave() {
      setVisible(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, visible, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[999] mix-blend-difference"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        className="rounded-full bg-white"
        animate={{
          width: hoveringLink ? 56 : 14,
          height: hoveringLink ? 56 : 14,
          x: hoveringLink ? -28 : -7,
          y: hoveringLink ? -28 : -7,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      />
    </motion.div>
  );
}
