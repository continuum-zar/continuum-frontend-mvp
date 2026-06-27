/**
 * Outer shell used by every migration wizard page.
 *
 * Mirrors `DashboardPlaceholderAIPlanner.tsx:56-77` verbatim — same
 * gradient background, same Satoshi inline class, same `DashboardLeftRail`
 * + bordered `<section>` layout, same shadow string. This keeps the
 * migration flow visually indistinguishable from the AI planner page so
 * users don't see a "different app" surface.
 */

import * as React from "react";

import { DashboardLeftRail } from "@/app/components/dashboard-placeholder/DashboardLeftRail";

interface MigrationsPageShellProps {
    children: React.ReactNode;
}

const PAGE_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage:
        "linear-gradient(0deg, color-mix(in srgb, var(--info) 12%, transparent) 0%, transparent 100%), linear-gradient(90deg, var(--background) 0%, var(--background) 100%)",
};

const SECTION_SHADOW =
    "shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]";

export function MigrationsPageShell({ children }: MigrationsPageShellProps) {
    return (
        <div
            className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
            style={PAGE_BACKGROUND_STYLE}
        >
            <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2">
                <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]">
                    <DashboardLeftRail />
                    <section
                        className={`relative z-[1] isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-border border-solid bg-card ${SECTION_SHADOW}`}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
