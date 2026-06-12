import type { CommentMentionUserAPI } from '@/types/comment';

/** Mirrors backend `_BOUNDARY_CHARS` in mention_parser.py */
const BOUNDARY_CHARS = new Set(' \t\n\r,;.!?;:)\'"]>');

export type CommentMentionSegment =
    | { type: 'text'; text: string }
    | { type: 'mention'; text: string; username: string; user?: CommentMentionUserAPI };

function isBoundary(content: string, pos: number): boolean {
    return pos >= content.length || BOUNDARY_CHARS.has(content[pos]!);
}

function buildUsernameMaps(mentions: CommentMentionUserAPI[] | undefined) {
    const canonical = new Map<string, string>();
    const userByLower = new Map<string, CommentMentionUserAPI>();

    for (const user of mentions ?? []) {
        const username = user.username?.trim();
        if (!username) continue;
        const lower = username.toLowerCase();
        if (!canonical.has(lower)) {
            canonical.set(lower, username);
            userByLower.set(lower, user);
        }
    }

    const sortedUsernames = [...canonical.values()].sort((a, b) => b.length - a.length);
    return { sortedUsernames, userByLower };
}

/**
 * Split comment content into text and @mention segments for display.
 * Longest-prefix match against known usernames from API `mentions` metadata;
 * mirrors backend mention_parser boundary rules.
 */
export function tokenizeCommentMentions(
    content: string,
    mentions?: CommentMentionUserAPI[],
): CommentMentionSegment[] {
    if (!content) return [];

    const { sortedUsernames, userByLower } = buildUsernameMaps(mentions);
    const segments: CommentMentionSegment[] = [];
    let textStart = 0;
    let i = 0;

    const pushText = (end: number) => {
        if (end > textStart) {
            segments.push({ type: 'text', text: content.slice(textStart, end) });
        }
        textStart = end;
    };

    while (i < content.length) {
        if (content[i] !== '@') {
            i += 1;
            continue;
        }
        if (i > 0 && content[i - 1] === '@') {
            i += 1;
            continue;
        }

        const cursor = i + 1;
        let matched: string | null = null;

        for (const username of sortedUsernames) {
            const end = cursor + username.length;
            if (end > content.length) continue;
            if (
                content.slice(cursor, end).toLowerCase() === username.toLowerCase() &&
                isBoundary(content, end)
            ) {
                matched = username;
                break;
            }
        }

        if (matched) {
            pushText(i);
            const mentionText = content.slice(i, cursor + matched.length);
            segments.push({
                type: 'mention',
                text: mentionText,
                username: matched,
                user: userByLower.get(matched.toLowerCase()),
            });
            i = cursor + matched.length;
            textStart = i;
        } else if (content[cursor] === '@') {
            // Skip leading @ in @@ sequences (matches backend mention_parser).
            i += 1;
        } else {
            // Highlight unresolved @token up to next boundary (display-only).
            let end = cursor;
            while (end < content.length && !isBoundary(content, end)) {
                end += 1;
            }
            if (end > cursor) {
                pushText(i);
                const rawUsername = content.slice(cursor, end);
                segments.push({
                    type: 'mention',
                    text: content.slice(i, end),
                    username: rawUsername,
                });
                i = end;
                textStart = i;
            } else {
                i += 1;
            }
        }
    }

    pushText(content.length);

    if (segments.length === 0) {
        return [{ type: 'text', text: content }];
    }

    return segments;
}

export function mentionDisplayLabel(user: CommentMentionUserAPI): string {
    const display = user.display_name?.trim();
    if (display) return display;
    const username = user.username?.trim();
    if (username) return username;
    return `User #${user.id}`;
}

/** Future profile route hook — returns undefined until a profile page exists. */
export function userProfilePath(_userId: number): string | undefined {
    return undefined;
}
