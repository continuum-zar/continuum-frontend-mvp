import { useMemo } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { cn } from '@/app/components/ui/utils';
import {
    mentionDisplayLabel,
    tokenizeCommentMentions,
    userProfilePath,
} from '@/lib/commentMentions';
import type { CommentMentionUserAPI } from '@/types/comment';

const MENTION_LINK_CLASS =
    'cursor-pointer font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary';

type CommentBodyProps = {
    content: string;
    mentions?: CommentMentionUserAPI[];
    className?: string;
    as?: 'p' | 'span' | 'pre';
};

function mentionTooltipText(user: CommentMentionUserAPI): string {
    const label = mentionDisplayLabel(user);
    const username = user.username?.trim();
    // Don't surface the raw username when it's an email (username == email).
    if (username && !username.includes('@') && label.toLowerCase() !== username.toLowerCase()) {
        return `${label} (@${username})`;
    }
    return label;
}

function MentionLink({
    text,
    user,
}: {
    text: string;
    user?: CommentMentionUserAPI;
}) {
    const profileHref = user ? userProfilePath(user.id) : undefined;
    // Show the user's name (e.g. "@Jane Doe") rather than the raw @token,
    // which may be an email address when username == email.
    const displayText = user ? `@${mentionDisplayLabel(user)}` : text;

    const link = (
        <a
            href={profileHref ?? '#'}
            className={MENTION_LINK_CLASS}
            aria-label={user ? `Mention ${mentionDisplayLabel(user)}` : undefined}
            onClick={(e) => {
                if (!profileHref) e.preventDefault();
            }}
        >
            {displayText}
        </a>
    );

    if (!user) {
        return <span className={MENTION_LINK_CLASS}>{displayText}</span>;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent>{mentionTooltipText(user)}</TooltipContent>
        </Tooltip>
    );
}

export function CommentBody({ content, mentions, className, as: Tag = 'p' }: CommentBodyProps) {
    const segments = useMemo(
        () => tokenizeCommentMentions(content, mentions),
        [content, mentions],
    );

    return (
        <Tag className={cn('whitespace-pre-wrap', className)}>
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return <span key={index}>{segment.text}</span>;
                }
                return (
                    <MentionLink key={index} text={segment.text} user={segment.user} />
                );
            })}
        </Tag>
    );
}
