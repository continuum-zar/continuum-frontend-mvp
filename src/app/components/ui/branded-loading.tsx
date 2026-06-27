import { cn } from './utils';

/** Matches the AI planner generation screen and MCP OAuth pending state. */
const CONTINUUM_WORDMARK_GRADIENT =
    'linear-gradient(135.275deg, rgb(36, 181, 248) 4.6217%, rgb(85, 33, 254) 148.53%)';

export type BrandedLoadingPlaceholderProps = {
    /** Status line shown under the wordmark, e.g. "Generating your plan…". */
    label: string;
    /** Optional secondary line, e.g. "This can take a few minutes. Hang tight." */
    hint?: string;
    /** Sizing/spacing for the surrounding container (height, flex, etc.). */
    className?: string;
};

/**
 * Branded loading placeholder — the pulsing "Continuum" wordmark used by the
 * AI planner while generating a plan. Use this instead of a generic spinner
 * for page- or section-level loading states.
 */
export function BrandedLoadingPlaceholder({
    label,
    hint,
    className,
}: BrandedLoadingPlaceholderProps) {
    return (
        <div
            role="status"
            className={cn(
                'flex flex-col items-center justify-center gap-5 px-9 py-16',
                className,
            )}
        >
            <p
                className="animate-pulse-soft bg-clip-text font-sarina text-[42px] font-normal leading-none tracking-[-0.85px] text-transparent motion-reduce:animate-none motion-reduce:opacity-100"
                style={{ backgroundImage: CONTINUUM_WORDMARK_GRADIENT }}
                aria-hidden
            >
                Continuum
            </p>
            <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground">
                {label}
            </p>
            {hint ? (
                <p className="max-w-sm text-center font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-muted-foreground">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
