import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Loader2, RefreshCw } from 'lucide-react';
import type { SystemArchitecture } from '@/api/planner';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

const CARD_SHADOW =
    'shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]';

let mermaidConfigured = false;

function ensureMermaid(): void {
    if (mermaidConfigured) return;
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
    });
    mermaidConfigured = true;
}

export type PlannerArchitectureSectionProps = {
    architecture: SystemArchitecture;
    /** Called when the user asks to regenerate architecture without re-running full plan generation. */
    onRegenerateArchitecture?: () => void;
    regenerateDisabled?: boolean;
    regeneratePending?: boolean;
};

/** Non-empty when user clicked Generate before any architecture exists on the plan. */
export function PlannerArchitecturePlaceholder({
    onGenerate,
    disabled,
    pending,
}: {
    onGenerate: () => void;
    disabled?: boolean;
    pending?: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-dashed border-[#dbeafe] bg-[#f8fbff] p-5',
                CARD_SHADOW,
            )}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]">
                        System architecture
                    </h3>
                    <p className="mt-1 font-['Inter',sans-serif] text-[13px] leading-[20px] text-[#606d76]">
                        Generate a high-level architecture map: clients, services, data stores, async
                        paths, integrations, and trust zones—grounded in your chat and attachments.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 self-start font-['Satoshi',sans-serif] text-[12px] sm:self-center"
                    onClick={onGenerate}
                    disabled={disabled || pending}
                >
                    {pending ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    Generate architecture
                </Button>
            </div>
        </div>
    );
}

export function PlannerArchitectureSection({
    architecture,
    onRegenerateArchitecture,
    regenerateDisabled,
    regeneratePending,
}: PlannerArchitectureSectionProps) {
    const sectionTitleId = useId();
    const overviewId = useId();
    const [svgMarkup, setSvgMarkup] = useState('');
    const [diagramError, setDiagramError] = useState<string | null>(null);

    const diagram = architecture.mermaid_diagram?.trim() ?? '';

    useEffect(() => {
        if (!diagram) {
            setSvgMarkup('');
            setDiagramError(null);
            return;
        }

        let cancelled = false;
        const render = async () => {
            ensureMermaid();
            try {
                const rid = `planner-arch-${Math.random().toString(36).slice(2)}`;
                const { svg } = await mermaid.render(rid, diagram);
                if (!cancelled) {
                    setSvgMarkup(svg);
                    setDiagramError(null);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    setSvgMarkup('');
                    setDiagramError(e instanceof Error ? e.message : String(e));
                }
            }
        };

        void render();
        return () => {
            cancelled = true;
        };
    }, [diagram]);

    /** Visible lists when there is no diagram text or Mermaid failed — not while the SVG is still loading. */
    const showStructuredFallback =
        (!diagram || Boolean(diagramError)) &&
        (architecture.components.length > 0 || architecture.data_flows.length > 0);
    const showDiagram = Boolean(diagram && svgMarkup && !diagramError);
    const srOnlyStructure =
        showDiagram &&
        (architecture.components.length > 0 || architecture.data_flows.length > 0);

    return (
        <section
            className={cn(
                'rounded-2xl border border-[#edecea] bg-white p-5',
                CARD_SHADOW,
            )}
            aria-labelledby={sectionTitleId}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h3
                    id={sectionTitleId}
                    className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]"
                >
                    System architecture
                </h3>
                {onRegenerateArchitecture ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 font-['Satoshi',sans-serif] text-[12px]"
                        onClick={onRegenerateArchitecture}
                        disabled={regenerateDisabled || regeneratePending}
                    >
                        {regeneratePending ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                            <RefreshCw className="size-3.5" aria-hidden />
                        )}
                        Regenerate architecture
                    </Button>
                ) : null}
            </div>

            {architecture.overview ? (
                <p
                    id={overviewId}
                    className="mt-3 font-['Inter',sans-serif] text-[13px] leading-[21px] text-[#606d76]"
                >
                    {architecture.overview}
                </p>
            ) : null}

            {diagram ? (
                <div className="mt-4">
                    <p className="sr-only" id={`${overviewId}-diagram-hint`}>
                        Interactive diagram; use pinch or scroll wheel with modifier keys to zoom where
                        supported.
                    </p>
                    <div
                        className="relative h-[min(420px,55vh)] w-full overflow-hidden rounded-xl border border-[#edecea] bg-[#fafafa]"
                        role="img"
                        aria-describedby={architecture.overview ? overviewId : undefined}
                        aria-label="System architecture diagram"
                    >
                        {showDiagram ? (
                            <TransformWrapper
                                initialScale={1}
                                minScale={0.35}
                                maxScale={3}
                                centerOnInit
                                wheel={{ step: 0.12 }}
                            >
                                <TransformComponent
                                    wrapperClass="!size-full"
                                    contentClass="flex min-h-[320px] min-w-full items-center justify-center p-4"
                                >
                                    <div
                                        className="architecture-mermaid [&_svg]:max-h-[min(380px,50vh)] [&_svg]:max-w-full"
                                        dangerouslySetInnerHTML={{ __html: svgMarkup }}
                                    />
                                </TransformComponent>
                            </TransformWrapper>
                        ) : diagramError ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                                <p className="font-['Satoshi',sans-serif] text-[12px] font-medium text-[#606d76]">
                                    Could not render the diagram preview.
                                </p>
                                <p className="font-['Inter',sans-serif] text-[11px] text-[#727d83]">
                                    {diagramError}
                                </p>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="size-8 animate-spin text-[#2E96F9]" aria-hidden />
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {srOnlyStructure ? (
                <div className="sr-only">
                    <p>Architecture structure</p>
                    {architecture.components.length > 0 ? (
                        <ul>
                            {architecture.components.map((c) => (
                                <li key={c.id}>
                                    {c.name}, {c.kind}
                                    {c.description ? `: ${c.description}` : ''}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {architecture.data_flows.length > 0 ? (
                        <ul>
                            {architecture.data_flows.map((flow, i) => (
                                <li key={`${flow.source_id}-${flow.target_id}-${i}`}>
                                    From {flow.source_id} to {flow.target_id}
                                    {flow.label ? ` (${flow.label})` : ''}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}

            {showStructuredFallback ? (
                <div className="mt-4 space-y-4">
                    {architecture.components.length > 0 ? (
                        <div>
                            <h4 className="mb-2 font-['Satoshi',sans-serif] text-[12px] font-semibold text-[#0b191f]">
                                Components
                            </h4>
                            <ul className="space-y-2">
                                {architecture.components.map((c) => (
                                    <li
                                        key={c.id}
                                        className="rounded-lg border border-[#edecea] bg-[#f9fafb] px-3 py-2"
                                    >
                                        <span className="font-['Satoshi',sans-serif] text-[12px] font-medium text-[#0b191f]">
                                            {c.name}{' '}
                                            <span className="font-normal text-[#606d76]">({c.kind})</span>
                                        </span>
                                        {c.description ? (
                                            <p className="mt-1 font-['Inter',sans-serif] text-[12px] text-[#727d83]">
                                                {c.description}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {architecture.data_flows.length > 0 ? (
                        <div>
                            <h4 className="mb-2 font-['Satoshi',sans-serif] text-[12px] font-semibold text-[#0b191f]">
                                Data flows
                            </h4>
                            <ul className="space-y-1.5">
                                {architecture.data_flows.map((flow, i) => (
                                    <li
                                        key={`${flow.source_id}-${flow.target_id}-${i}`}
                                        className="font-['Inter',sans-serif] text-[12px] text-[#606d76]"
                                    >
                                        <span className="font-medium text-[#0b191f]">{flow.source_id}</span>
                                        {' → '}
                                        <span className="font-medium text-[#0b191f]">{flow.target_id}</span>
                                        {flow.label ? (
                                            <span className="text-[#727d83]"> — {flow.label}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}
