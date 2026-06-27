import { useCallback, useId, useState } from 'react';
import type { PlannerChoiceQuestion } from '@/api/planner';
import { cn } from '@/app/components/ui/utils';

const baseLabel = "font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] text-foreground";

type PlannerChoiceQuestionsProps = {
    questions: PlannerChoiceQuestion[];
    /** Question ids already sent to the server in a completed batch. */
    submittedIds: ReadonlySet<string>;
    /** Selected answer text after submit (shown instead of "Response sent"). */
    submittedAnswers: Readonly<Record<string, string>>;
    /** Picks for the current batch (not yet all submitted). */
    localSelections: Readonly<Record<string, string>>;
    /** When true, all interaction is disabled (e.g. request in flight). */
    disabled: boolean;
    onSelect: (question: PlannerChoiceQuestion, answer: string) => void;
    onClearLocalSelection: (question: PlannerChoiceQuestion) => void;
};

export function PlannerChoiceQuestions({
    questions,
    submittedIds,
    submittedAnswers,
    localSelections,
    disabled,
    onSelect,
    onClearLocalSelection,
}: PlannerChoiceQuestionsProps) {
    const groupId = useId();
    const [otherOpenId, setOtherOpenId] = useState<string | null>(null);
    const [otherDraft, setOtherDraft] = useState('');

    const openOther = useCallback((q: PlannerChoiceQuestion) => {
        setOtherOpenId(q.id);
        setOtherDraft('');
    }, []);

    const closeOther = useCallback(() => {
        setOtherOpenId(null);
        setOtherDraft('');
    }, []);

    const submitOther = useCallback(
        (q: PlannerChoiceQuestion) => {
            const t = otherDraft.trim();
            if (!t || disabled || submittedIds.has(q.id)) return;
            if (localSelections[q.id]) return;
            onSelect(q, t);
            closeOther();
        },
        [otherDraft, disabled, submittedIds, localSelections, onSelect, closeOther],
    );

    if (questions.length === 0) return null;

    return (
        <div className="mt-3 flex w-full min-w-0 flex-col gap-4" role="group" aria-labelledby={groupId}>
            <span id={groupId} className="sr-only">
                Suggested answers
            </span>
            {questions.map((q) => {
                const submitted = submittedIds.has(q.id);
                const localAnswer = localSelections[q.id];
                const pendingPick = Boolean(localAnswer) && !submitted;
                const opts = q.options.length >= 4 ? q.options.slice(0, 4) : q.options;
                const otherActive = otherOpenId === q.id;
                return (
                    <div
                        key={q.id}
                        className="w-full min-w-0 rounded-[10px] border border-solid border-border bg-card p-3 shadow-sm"
                    >
                        <p className={cn('mb-2.5 font-[\'Satoshi\',sans-serif] text-[14px] font-semibold text-foreground')}>
                            {q.prompt}
                        </p>
                        {submitted ? (
                            <p className="font-['Inter',sans-serif] text-[13px] leading-[19px] text-foreground">
                                <span className="text-muted-foreground">Your answer: </span>
                                {submittedAnswers[q.id] ?? '—'}
                            </p>
                        ) : pendingPick ? (
                            <div className="flex flex-col gap-2">
                                <p className="font-['Inter',sans-serif] text-[13px] leading-[19px] text-foreground">
                                    <span className="text-muted-foreground">Your answer: </span>
                                    {localAnswer}
                                </p>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onClearLocalSelection(q)}
                                    className="self-start rounded-[8px] border border-border bg-card px-2.5 py-1 font-['Satoshi',sans-serif] text-[12px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                                    {opts.map((opt, oi) => (
                                        <button
                                            key={oi}
                                            type="button"
                                            disabled={disabled}
                                            className={cn(
                                                'rounded-[8px] border border-solid border-border bg-card px-3 py-2.5 text-left transition-colors',
                                                'font-[\'Satoshi\',sans-serif] text-[13px] font-medium text-foreground',
                                                'hover:border-border hover:bg-muted',
                                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/25',
                                                disabled && 'cursor-not-allowed opacity-50',
                                            )}
                                            onClick={() => onSelect(q, opt)}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className={cn(
                                            'rounded-[8px] border border-dashed border-border bg-card px-3 py-2.5 text-left',
                                            'font-[\'Satoshi\',sans-serif] text-[13px] font-medium text-muted-foreground',
                                            'hover:border-border hover:bg-card',
                                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/25',
                                            disabled && 'cursor-not-allowed opacity-50',
                                            otherActive && 'border-foreground/30 bg-muted',
                                        )}
                                        onClick={() => (otherActive ? closeOther() : openOther(q))}
                                    >
                                        {otherActive ? 'Cancel other' : 'Other…'}
                                    </button>
                                </div>
                                {otherActive && (
                                    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                                        <label className={cn(baseLabel, 'text-muted-foreground')}>
                                            Your answer
                                        </label>
                                        <textarea
                                            value={otherDraft}
                                            onChange={(e) => setOtherDraft(e.target.value)}
                                            disabled={disabled}
                                            rows={3}
                                            className={cn(
                                                'min-h-[72px] w-full resize-y rounded-[8px] border border-solid border-border bg-background px-3 py-2',
                                                baseLabel,
                                                'placeholder:text-muted-foreground focus:border-border focus:outline-none',
                                            )}
                                            placeholder="Type your answer…"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                    e.preventDefault();
                                                    submitOther(q);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            disabled={disabled || !otherDraft.trim()}
                                            onClick={() => submitOther(q)}
                                            className={cn(
                                                'self-start rounded-[8px] bg-foreground px-3 py-2',
                                                "font-['Satoshi',sans-serif] text-[13px] font-medium text-background",
                                                'hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40',
                                            )}
                                        >
                                            Submit
                                        </button>
                                        <span className="font-['Inter',sans-serif] text-[11px] text-muted-foreground">
                                            Ctrl+Enter to submit
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
