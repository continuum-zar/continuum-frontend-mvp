import { describe, expect, it } from 'vitest';
import { computeWordDiffSegments } from './textWordDiff';

describe('computeWordDiffSegments', () => {
    it('highlights replaced words as delete then insert', () => {
        const segs = computeWordDiffSegments('hello world', 'hello there');
        const types = segs.map((s) => s.type);
        expect(types).toContain('equal');
        expect(types).toContain('delete');
        expect(types).toContain('insert');
    });

    it('returns single equal when identical', () => {
        const segs = computeWordDiffSegments('same text', 'same text');
        expect(segs.length).toBe(1);
        expect(segs[0]?.type).toBe('equal');
    });
});
