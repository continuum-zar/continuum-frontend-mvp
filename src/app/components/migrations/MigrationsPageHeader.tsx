/**
 * Page header used on all three migration wizard pages.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Import projects               ● ── ● ── ○  Upload/Preview/Apply
 *   │  <subtitle>                              [⚠ N warnings]
 *   └──────────────────────────────────────────────────────────┘
 *
 * Uses the shared Badge `warning` variant (added in commit 129c3fe).
 */

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/components/ui/utils";

import {
    MigrationsStep,
    MigrationsStepIndicator,
} from "./MigrationsStepIndicator";

interface MigrationsPageHeaderProps {
    step: MigrationsStep;
    title: string;
    subtitle?: string;
    warningsCount?: number;
    actions?: React.ReactNode;
    className?: string;
}

export function MigrationsPageHeader({
    step,
    title,
    subtitle,
    warningsCount,
    actions,
    className,
}: MigrationsPageHeaderProps) {
    return (
        <header
            className={cn(
                "flex flex-col gap-2 border-b border-[#ebedee] px-6 pt-5 pb-4",
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-medium tracking-tight text-foreground">
                    {title}
                </h1>
                <div className="flex items-center gap-3">
                    <MigrationsStepIndicator current={step} />
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                {subtitle ? (
                    <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
                ) : (
                    <span aria-hidden="true" />
                )}
                <div className="flex items-center gap-2">
                    {typeof warningsCount === "number" && warningsCount > 0 ? (
                        <Badge variant="warning" aria-label={`${warningsCount} warnings`}>
                            <AlertTriangle aria-hidden="true" />
                            {warningsCount} warning{warningsCount === 1 ? "" : "s"}
                        </Badge>
                    ) : null}
                    {actions}
                </div>
            </div>
        </header>
    );
}
