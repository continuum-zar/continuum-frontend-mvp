import { describe, expect, it } from 'vitest';
import { indexingProgressCaption, indexingProgressPercent } from './indexingProgressDisplay';

describe('indexingProgressPercent', () => {
    it('returns null when total is zero', () => {
        expect(indexingProgressPercent(0, 0)).toBeNull();
        expect(indexingProgressPercent(5, 0)).toBeNull();
    });

    it('caps at 100', () => {
        expect(indexingProgressPercent(200, 100)).toBe(100);
    });

    it('computes rounded percent', () => {
        expect(indexingProgressPercent(5, 20)).toBe(25);
    });
});

describe('indexingProgressCaption', () => {
    it('describes error status', () => {
        expect(
            indexingProgressCaption({
                scanned: 0,
                total: 10,
                status: 'error',
                error_message: 'embed failed',
            }),
        ).toBe('embed failed');
    });

    it('shows counts when total positive', () => {
        expect(
            indexingProgressCaption({
                scanned: 5,
                total: 200,
                status: 'running',
            }),
        ).toBe('5/200 pieces indexed');
    });

    it('handles empty project complete', () => {
        expect(
            indexingProgressCaption({
                scanned: 0,
                total: 0,
                status: 'complete',
            }),
        ).toBe('Nothing new to index.');
    });
});
