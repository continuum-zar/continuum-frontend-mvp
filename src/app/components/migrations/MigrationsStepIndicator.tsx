/**
 * Three-step dot indicator at the top of every migration page:
 *
 *   ● ─── ○ ─── ○        ↑ user is on step 1 ("Upload")
 *   ● ─── ● ─── ○        ↑ step 2 ("Preview")
 *   ● ─── ● ─── ●        ↑ step 3 ("Apply")
 *
 * Dots use semantic tokens (`bg-primary` for active/visited,
 * `bg-muted` for upcoming) so light + dark modes adapt for free.
 * Built from existing primitives — no new icons.
 */

import { cn } from "@/app/components/ui/utils";

export type MigrationsStep = "upload" | "preview" | "apply";

const STEPS: { key: MigrationsStep; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "preview", label: "Preview" },
    { key: "apply", label: "Apply" },
];

interface MigrationsStepIndicatorProps {
    current: MigrationsStep;
}

export function MigrationsStepIndicator({ current }: MigrationsStepIndicatorProps) {
    const currentIndex = STEPS.findIndex((s) => s.key === current);

    return (
        <ol
            aria-label="Migration steps"
            className="flex items-center gap-2 text-xs"
        >
            {STEPS.map((step, index) => {
                const visited = index <= currentIndex;
                const isActive = step.key === current;
                return (
                    <li
                        key={step.key}
                        aria-current={isActive ? "step" : undefined}
                        className="flex items-center gap-2"
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                "inline-block h-2 w-2 rounded-full transition-colors",
                                visited ? "bg-primary" : "bg-muted",
                            )}
                        />
                        <span
                            className={cn(
                                "text-sm",
                                isActive
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground",
                            )}
                        >
                            {step.label}
                        </span>
                        {index < STEPS.length - 1 ? (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "h-px w-6 transition-colors",
                                    index < currentIndex ? "bg-primary" : "bg-border",
                                )}
                            />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}
