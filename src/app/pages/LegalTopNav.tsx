"use client";

import { Link } from "react-router";
import "@/styles/load-decorative-fonts";

/**
 * Signed-out chrome for the public legal pages (Terms, Privacy).
 * Mirrors the landing page header: Continuum wordmark on the left,
 * Login / Sign Up on the right.
 */
export function LegalTopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-4 sm:px-8">
        <Link
          to="/"
          className="font-sarina-sans text-[21px] leading-none tracking-[-0.42px] text-foreground no-underline outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Continuum
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex h-[34px] items-center justify-center rounded-[8px] border border-border bg-card px-4 text-[14px] font-semibold text-foreground no-underline shadow-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Login
          </Link>
          <Link
            to="/sign-up"
            className="inline-flex h-[34px] items-center justify-center rounded-[8px] bg-info px-4 text-[14px] font-semibold text-white no-underline outline-none transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
