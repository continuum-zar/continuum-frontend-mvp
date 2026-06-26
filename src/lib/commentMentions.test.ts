import { describe, expect, it } from 'vitest';

import {
    mentionDisplayLabel,
    tokenizeCommentMentions,
    type CommentMentionSegment,
} from './commentMentions';
import type { CommentMentionUserAPI } from '@/types/comment';

const alice: CommentMentionUserAPI = { id: 1, username: 'alice', display_name: 'Alice Smith' };
const bob: CommentMentionUserAPI = { id: 2, username: 'bob', display_name: 'Bob Jones' };
const dotUser: CommentMentionUserAPI = { id: 3, username: 'user.name', display_name: 'Dot User' };

function mentionTexts(segments: CommentMentionSegment[]): string[] {
    return segments.filter((s) => s.type === 'mention').map((s) => s.text);
}

function mentionUsernames(segments: CommentMentionSegment[]): (string | undefined)[] {
    return segments
        .filter((s) => s.type === 'mention')
        .map((s) => (s.type === 'mention' ? (s.user?.username ?? undefined) : undefined));
}

describe('tokenizeCommentMentions', () => {
    it('returns single text segment when there are no mentions', () => {
        const segments = tokenizeCommentMentions('plain comment text');
        expect(segments).toEqual([{ type: 'text', text: 'plain comment text' }]);
    });

    it('tokenizes a single resolved mention', () => {
        const segments = tokenizeCommentMentions('Hey @alice, check this', [alice]);
        expect(mentionTexts(segments)).toEqual(['@alice']);
        expect(mentionUsernames(segments)).toEqual(['alice']);
        expect(segments.map((s) => s.type)).toEqual(['text', 'mention', 'text']);
    });

    it('tokenizes multiple resolved mentions', () => {
        const segments = tokenizeCommentMentions('@alice and @bob please review', [alice, bob]);
        expect(mentionTexts(segments)).toEqual(['@alice', '@bob']);
        expect(mentionUsernames(segments)).toEqual(['alice', 'bob']);
    });

    it('tokenizes repeated mentions', () => {
        const segments = tokenizeCommentMentions('@alice @alice again', [alice]);
        expect(mentionTexts(segments)).toEqual(['@alice', '@alice']);
    });

    it('highlights unknown mentions without user metadata', () => {
        const segments = tokenizeCommentMentions('@nobody hello', [alice]);
        const mention = segments.find((s) => s.type === 'mention');
        expect(mention).toMatchObject({ type: 'mention', text: '@nobody', username: 'nobody' });
        expect(mention && mention.type === 'mention' && mention.user).toBeUndefined();
    });

    it('matches mentions case-insensitively', () => {
        const segments = tokenizeCommentMentions('@Alice please', [alice]);
        expect(mentionTexts(segments)).toEqual(['@Alice']);
        expect(mentionUsernames(segments)).toEqual(['alice']);
    });

    it('does not treat @@alice as a mention', () => {
        const segments = tokenizeCommentMentions('@@alice not a mention', [alice]);
        expect(segments.every((s) => s.type === 'text')).toBe(true);
        expect(segments.map((s) => s.text).join('')).toBe('@@alice not a mention');
    });

    it('supports email-shaped usernames', () => {
        const segments = tokenizeCommentMentions('cc @user.name on this', [dotUser]);
        expect(mentionTexts(segments)).toEqual(['@user.name']);
        expect(mentionUsernames(segments)).toEqual(['user.name']);
    });

    it('respects boundary characters after mentions', () => {
        const segments = tokenizeCommentMentions('ping @alice, @bob.', [alice, bob]);
        expect(mentionTexts(segments)).toEqual(['@alice', '@bob']);
    });

    it('preserves leading, trailing, and newline text', () => {
        const content = ' line one\n@alice\nline two ';
        const segments = tokenizeCommentMentions(content, [alice]);
        expect(segments.map((s) => s.text).join('')).toBe(content);
    });

    it('prefers longest-prefix username match', () => {
        const ab: CommentMentionUserAPI = { id: 10, username: 'ab' };
        const abc: CommentMentionUserAPI = { id: 11, username: 'abc' };
        const segments = tokenizeCommentMentions('see @abc now', [ab, abc]);
        expect(mentionTexts(segments)).toEqual(['@abc']);
        expect(mentionUsernames(segments)).toEqual(['abc']);
    });
});

describe('mentionDisplayLabel', () => {
    it('prefers display_name', () => {
        expect(mentionDisplayLabel(alice)).toBe('Alice Smith');
    });

    it('falls back to username', () => {
        expect(mentionDisplayLabel({ id: 9, username: 'carol' })).toBe('carol');
    });

    it('falls back to user id', () => {
        expect(mentionDisplayLabel({ id: 42 })).toBe('User #42');
    });
});
