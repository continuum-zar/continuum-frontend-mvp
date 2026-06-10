import type { Member } from '@/types/member';

/** Mirrors backend `_BOUNDARY_CHARS` in mention_parser.py */
const BOUNDARY_CHARS = new Set(' \t\n\r,;.!?;:)\'"]>');

export type ActiveMentionQuery = {
    /** Index of `@` in content */
    start: number;
    /** Index after the active query (usually cursor) */
    end: number;
    /** Text between `@` and end (may be empty when `@` was just typed) */
    query: string;
};

function isBoundary(char: string | undefined): boolean {
    return char === undefined || BOUNDARY_CHARS.has(char);
}

/**
 * When the cursor sits inside an active `@mention` token, return its span and query.
 * Returns null for `@@` sequences or when `@` is followed by a boundary.
 */
export function getActiveMentionQuery(content: string, cursor: number): ActiveMentionQuery | null {
    if (!content || cursor < 0 || cursor > content.length) return null;

    let i = cursor - 1;
    while (i >= 0 && !isBoundary(content[i])) {
        i -= 1;
    }

    const wordStart = i + 1;
    const token = content.slice(wordStart, cursor);
    if (!token.startsWith('@') || token.startsWith('@@')) return null;

    return {
        start: wordStart,
        end: cursor,
        query: token.slice(1),
    };
}

export function insertMention(
    content: string,
    mentionStart: number,
    mentionEnd: number,
    username: string,
): { nextContent: string; nextCursor: number } {
    const mentionText = `@${username} `;
    const nextContent = content.slice(0, mentionStart) + mentionText + content.slice(mentionEnd);
    const nextCursor = mentionStart + mentionText.length;
    return { nextContent, nextCursor };
}

function mentionSearchHaystack(member: Member): string {
    return [member.username, member.displayName, member.name, member.email]
        .filter(Boolean)
        .join('\n')
        .toLowerCase();
}

function mentionPrefixRank(member: Member, queryLower: string): number {
    const username = member.username.toLowerCase();
    if (!queryLower) return 0;
    if (username.startsWith(queryLower)) return 0;
    if (username.includes(queryLower)) return 1;
    if (mentionSearchHaystack(member).includes(queryLower)) return 2;
    return 3;
}

/** Members eligible for @mention autocomplete (must have a canonical username). */
export function filterMentionCandidates(members: Member[], query: string): Member[] {
    const queryLower = query.trim().toLowerCase();
    const eligible = members.filter((m) => m.username.trim().length > 0);

    const filtered = queryLower
        ? eligible.filter((m) => mentionSearchHaystack(m).includes(queryLower))
        : eligible;

    return [...filtered].sort((a, b) => {
        const rankDiff = mentionPrefixRank(a, queryLower) - mentionPrefixRank(b, queryLower);
        if (rankDiff !== 0) return rankDiff;
        return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
    });
}
