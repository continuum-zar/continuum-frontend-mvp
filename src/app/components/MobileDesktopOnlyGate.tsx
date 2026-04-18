import * as React from "react";
import { LaptopMinimalCheck } from "lucide-react";
import { DESKTOP_ONLY_MAX_BREAKPOINT } from "@/app/components/ui/use-mobile";

const HEADLINE_GRADIENT =
  "linear-gradient(151.67deg, rgb(36, 181, 248) 4.62%, rgb(85, 33, 254) 148.53%)";

function getShouldShowDesktopOnlyScreen(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${DESKTOP_ONLY_MAX_BREAKPOINT}px)`).matches;
}

function useSyncDesktopOnlyViewport(): boolean {
  const [showDesktopOnly, setShowDesktopOnly] = React.useState(getShouldShowDesktopOnlyScreen);

  React.useEffect(() => {
    const query = `(max-width: ${DESKTOP_ONLY_MAX_BREAKPOINT}px)`;
    const mql = window.matchMedia(query);
    const sync = () => {
      setShowDesktopOnly(mql.matches);
    };
    mql.addEventListener("change", sync);
    sync();
    return () => mql.removeEventListener("change", sync);
  }, []);

  return showDesktopOnly;
}

/**
 * Full-viewport message on phone / tablet widths: ask users to use desktop.
 */
export function MobileDesktopOnlyScreen() {
  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col"
      style={{
        background: "linear-gradient(180deg, #b2e6f7 0%, #ffffff 50%)",
      }}
    >
      <header className="flex shrink-0 justify-center pt-7">
        <p
          className="text-center font-sarina-sans text-[21.405px] leading-6 tracking-[-0.4281px] text-[#0b191f]"
          aria-label="Continuum"
        >
          Continuum
        </p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-10 pt-6">
        <div className="flex w-full max-w-[362px] flex-col items-center gap-4 text-center">
          <div className="flex size-[68px] shrink-0 items-center justify-center text-[#0b191f]" aria-hidden>
            <LaptopMinimalCheck className="size-[68px]" strokeWidth={1.25} />
          </div>

          <h1 className="w-full min-w-0 text-[24px] leading-normal tracking-[-0.48px]">
            <span className="font-['Satoshi',sans-serif] font-bold not-italic text-[#0b191f]">We&apos;re</span>
            <span className="font-['Satoshi',sans-serif] font-bold text-[#0b191f]"> </span>
            <span
              className="bg-clip-text font-sarina-sans font-normal not-italic text-transparent"
              style={{ backgroundImage: HEADLINE_GRADIENT }}
            >
              better
            </span>
            <span className="font-['Satoshi',sans-serif] font-bold text-[#0b191f]"> </span>
            <span className="font-['Satoshi',sans-serif] font-bold not-italic text-[#0b191f]">
              on the big screen
            </span>
          </h1>

          <p className="font-['Satoshi',sans-serif] font-medium text-[16px] leading-normal tracking-[-0.32px] text-[#727d83]">
            To get the full experience, please open this application on a desktop or laptop.
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * At or below `DESKTOP_ONLY_MAX_BREAKPOINT` (1366px width), show the desktop-only message instead of the app.
 */
export function MobileDesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const showDesktopOnly = useSyncDesktopOnlyViewport();

  React.useEffect(() => {
    if (showDesktopOnly) {
      void import("@/styles/load-decorative-fonts");
    }
  }, [showDesktopOnly]);

  if (showDesktopOnly) {
    return <MobileDesktopOnlyScreen />;
  }
  return children;
}
