'use client';

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type Ref,
} from 'react';

import { VirtualList } from '@/app/components/ui/VirtualList';
import { cn } from '@/app/components/ui/utils';
import {
    filterMentionCandidates,
    getActiveMentionQuery,
    insertMention,
    type ActiveMentionQuery,
} from '@/lib/commentMentionInput';
import type { Member } from '@/types/member';

const VIRTUAL_LIST_THRESHOLD = 30;
const ROW_HEIGHT_PX = 52;
const MAX_DROPDOWN_HEIGHT = 240;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
    if (!ref) return;
    if (typeof ref === 'function') {
        ref(value);
    } else {
        ref.current = value;
    }
}

export type CommentMentionTextareaProps = {
    value: string;
    onChange: (value: string) => void;
    members: Member[];
    disabled?: boolean;
    placeholder?: string;
    onSubmit?: () => void;
    textareaRef?: Ref<HTMLTextAreaElement>;
    className?: string;
};

export function CommentMentionTextarea({
    value,
    onChange,
    members,
    disabled = false,
    placeholder,
    onSubmit,
    textareaRef,
    className,
}: CommentMentionTextareaProps) {
    const listboxId = useId();
    const liveRegionId = useId();
    const localRef = useRef<HTMLTextAreaElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const pendingCursorRef = useRef<number | null>(null);

    const activeMention = useMemo((): ActiveMentionQuery | null => {
        if (dismissed) return null;
        return getActiveMentionQuery(value, cursorPosition);
    }, [dismissed, value, cursorPosition]);

    const candidates = useMemo(
        () => (activeMention ? filterMentionCandidates(members, activeMention.query) : []),
        [activeMention, members],
    );

    const mentionOpen = activeMention != null && candidates.length > 0;

    useEffect(() => {
        if (!mentionOpen) {
            setSelectedIndex(0);
            return;
        }
        setSelectedIndex((prev) => Math.min(prev, Math.max(candidates.length - 1, 0)));
    }, [mentionOpen, candidates.length, activeMention?.query]);

    useEffect(() => {
        const nextCursor = pendingCursorRef.current;
        if (nextCursor == null) return;
        const el = localRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
        pendingCursorRef.current = null;
    }, [value]);

    const applyMention = useCallback(
        (member: Member) => {
            if (!activeMention || !member.username.trim()) return;
            const { nextContent, nextCursor } = insertMention(
                value,
                activeMention.start,
                activeMention.end,
                member.username,
            );
            pendingCursorRef.current = nextCursor;
            setDismissed(true);
            onChange(nextContent);
        },
        [activeMention, onChange, value],
    );

    const syncCursorFromElement = () => {
        const cursor = localRef.current?.selectionStart ?? value.length;
        setCursorPosition(cursor);
    };

    const handleChange = (nextValue: string, cursor?: number) => {
        setDismissed(false);
        onChange(nextValue);
        const nextCursor = typeof cursor === 'number' ? cursor : nextValue.length;
        setCursorPosition(nextCursor);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSubmit?.();
            return;
        }

        if (!mentionOpen || !activeMention) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % candidates.length);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + candidates.length) % candidates.length);
            return;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            const selected = candidates[selectedIndex];
            if (selected) applyMention(selected);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setDismissed(true);
        }
    };

    const activeDescendantId =
        mentionOpen && candidates[selectedIndex]
            ? `${listboxId}-option-${candidates[selectedIndex]!.userId}`
            : undefined;

    const liveMessage = mentionOpen
        ? `${candidates.length} member${candidates.length === 1 ? '' : 's'} found`
        : '';

    return (
        <div className="relative">
            <textarea
                ref={(el) => {
                    localRef.current = el;
                    assignRef(textareaRef, el);
                }}
                value={value}
                onChange={(e) => handleChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
                onSelect={() => {
                    setDismissed(false);
                    syncCursorFromElement();
                }}
                onKeyUp={() => syncCursorFromElement()}
                onClick={() => syncCursorFromElement()}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                role={mentionOpen ? 'combobox' : undefined}
                aria-expanded={mentionOpen ? true : undefined}
                aria-controls={mentionOpen ? listboxId : undefined}
                aria-autocomplete={mentionOpen ? 'list' : undefined}
                aria-activedescendant={activeDescendantId}
                aria-describedby={mentionOpen ? liveRegionId : undefined}
                className={cn(
                    "w-full resize-none overflow-y-auto rounded-[8px] border border-[#e9e9e9] bg-white px-3 py-2.5 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] outline-none placeholder:text-[#727d83] focus:ring-2 focus:ring-[#24b5f8]/40 disabled:opacity-60",
                    className,
                )}
            />

            <div id={liveRegionId} className="sr-only" aria-live="polite">
                {liveMessage}
            </div>

            {mentionOpen ? (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-label="Mention suggestions"
                    className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[8px] border border-[#e9e9e9] bg-white py-1 shadow-lg"
                    style={{ maxHeight: MAX_DROPDOWN_HEIGHT }}
                >
                    <VirtualList
                        items={candidates}
                        threshold={VIRTUAL_LIST_THRESHOLD}
                        estimateSize={ROW_HEIGHT_PX}
                        maxHeight={MAX_DROPDOWN_HEIGHT}
                        scrollClassName="max-h-[240px]"
                        getItemKey={(member) => member.userId}
                        className=""
                    >
                        {(member, index) => {
                            const selected = index === selectedIndex;
                            const optionId = `${listboxId}-option-${member.userId}`;
                            return (
                                <button
                                    key={member.userId}
                                    id={optionId}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyMention(member)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={cn(
                                        "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left font-['Satoshi',sans-serif] text-[14px] transition-colors hover:bg-[#f5f7f8]",
                                        selected && 'bg-[#f0f8ff]',
                                    )}
                                >
                                    <span className="truncate text-[#0b191f]">{member.displayName}</span>
                                    <span className="truncate text-[12px] font-medium text-[#727d83]">
                                        @{member.username}
                                    </span>
                                </button>
                            );
                        }}
                    </VirtualList>
                </div>
            ) : null}
        </div>
    );
}
