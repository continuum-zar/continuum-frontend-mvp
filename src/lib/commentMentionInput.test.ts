import { describe, expect, it } from 'vitest';

import {
    filterMentionCandidates,
    getActiveMentionQuery,
    insertMention,
} from './commentMentionInput';
import type { Member } from '@/types/member';

function makeMember(overrides: Partial<Member> & Pick<Member, 'userId' | 'username'>): Member {
    const { userId, username, ...rest } = overrides;
    return {
        id: userId,
        userId,
        name: rest.name ?? rest.displayName ?? username,
        email: rest.email ?? `${username}@example.com`,
        role: 'developer',
        username,
        displayName: rest.displayName ?? rest.name ?? username,
        initials: 'AB',
        ...rest,
    };
}

const alice = makeMember({ userId: 1, username: 'alice', displayName: 'Alice Smith' });
const bob = makeMember({ userId: 2, username: 'bob', displayName: 'Bob Jones' });
const dotUser = makeMember({ userId: 3, username: 'user.name', displayName: 'Dot User' });

describe('getActiveMentionQuery', () => {
    it('returns null when cursor is not in a mention', () => {
        expect(getActiveMentionQuery('hello world', 5)).toBeNull();
    });

    it('detects an active mention at the end of content', () => {
        expect(getActiveMentionQuery('Hey @ali', 8)).toEqual({
            start: 4,
            end: 8,
            query: 'ali',
        });
    });

    it('detects an empty query immediately after @', () => {
        expect(getActiveMentionQuery('cc @', 4)).toEqual({
            start: 3,
            end: 4,
            query: '',
        });
    });

    it('does not treat @@ as a mention', () => {
        expect(getActiveMentionQuery('@@alice', 7)).toBeNull();
    });

    it('ends the active mention at boundary characters', () => {
        expect(getActiveMentionQuery('ping @ali,ce', 9)).toEqual({
            start: 5,
            end: 9,
            query: 'ali',
        });
        expect(getActiveMentionQuery('ping @ali,ce', 10)).toBeNull();
    });

    it('returns null when @ is followed by a boundary', () => {
        expect(getActiveMentionQuery('see @ there', 8)).toBeNull();
    });
});

describe('insertMention', () => {
    it('replaces the active query with canonical username and trailing space', () => {
        const { nextContent, nextCursor } = insertMention('Hey @ali', 4, 8, 'alice');
        expect(nextContent).toBe('Hey @alice ');
        expect(nextCursor).toBe(11);
    });

    it('supports email-shaped usernames', () => {
        const { nextContent } = insertMention('cc @user', 3, 8, 'user.name');
        expect(nextContent).toBe('cc @user.name ');
    });
});

describe('filterMentionCandidates', () => {
    const members = [alice, bob, dotUser];

    it('returns all eligible members for an empty query', () => {
        expect(filterMentionCandidates(members, '')).toHaveLength(3);
    });

    it('filters by username prefix case-insensitively', () => {
        const result = filterMentionCandidates(members, 'Ali');
        expect(result.map((m) => m.username)).toEqual(['alice']);
    });

    it('filters by display name and email', () => {
        expect(filterMentionCandidates(members, 'bob jones').map((m) => m.username)).toEqual(['bob']);
        expect(
            filterMentionCandidates(
                [makeMember({ userId: 9, username: 'carol', email: 'carol@corp.io' })],
                'corp.io',
            ),
        ).toHaveLength(1);
    });

    it('excludes members without username', () => {
        const noUsername = makeMember({ userId: 4, username: '', displayName: 'Ghost' });
        expect(filterMentionCandidates([alice, noUsername], '')).toEqual([alice]);
    });

    it('prefers username prefix matches when sorting', () => {
        const ab = makeMember({ userId: 10, username: 'ab', displayName: 'Ab' });
        const abc = makeMember({ userId: 11, username: 'abc', displayName: 'Abc' });
        expect(filterMentionCandidates([abc, ab], 'ab').map((m) => m.username)).toEqual(['ab', 'abc']);
    });

    it('handles special characters in query', () => {
        expect(filterMentionCandidates(members, 'user.name').map((m) => m.username)).toEqual(['user.name']);
    });

    it('handles large member lists', () => {
        const large = Array.from({ length: 500 }, (_, i) =>
            makeMember({ userId: i + 100, username: `user_${i}`, displayName: `User ${i}` }),
        );
        const result = filterMentionCandidates(large, 'user_499');
        expect(result.map((m) => m.username)).toEqual(['user_499']);
    });
});
