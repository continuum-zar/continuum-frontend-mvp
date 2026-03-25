import * as React from "react";
import { LaptopMinimalCheck } from "lucide-react";
import { MOBILE_BREAKPOINT } from "@/app/components/ui/use-mobile";

const HEADLINE_GRADIENT =
  "linear-gradient(151.67deg, rgb(36, 181, 248) 4.62%, rgb(85, 33, 254) 148.53%)";

function getIsMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function useSyncMobileViewport(): boolean {
  const [isMobile, setIsMobile] = React.useState(getIsMobileViewport);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", sync);
    sync();
    return () => mql.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

/**
 * Full-viewport message when the viewport is narrow: ask users to use desktop,
 * per product design (Figma mobile frame).
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
          className="text-center font-['Sarina',sans-serif] text-[21.405px] leading-6 tracking-[-0.4281px] text-[#0b191f]"
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
              className="bg-clip-text font-['Sarina',sans-serif] font-normal not-italic text-transparent"
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
 * On narrow viewports, show the desktop-only message instead of the app shell.
 */
export function MobileDesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const isMobile = useSyncMobileViewport();
  if (isMobile) {
    return <MobileDesktopOnlyScreen />;
  }
  return children;
}
