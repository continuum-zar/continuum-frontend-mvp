"use client";

import { motion } from "motion/react";

import { cn } from "./utils";

/**
 * Three dots bouncing up and down in sequence — an in-progress indicator that
 * reads calmer than a spinner. Dots use `currentColor`, so set the colour via
 * the parent's text colour.
 */
export function BouncingDots({
  className,
  size = 4,
}: {
  className?: string;
  /** Dot diameter in px. */
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block rounded-full bg-current"
          style={{ width: size, height: size, marginLeft: i === 0 ? 0 : size * 0.75 }}
          animate={{ y: [0, -size * 0.9, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}
