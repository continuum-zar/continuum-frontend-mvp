/**
 * Word-token diff for inline red/green display (removed / added).
 * Tokens preserve whitespace runs so spacing stays readable.
 */

export type WordDiffSegment = { type: 'equal' | 'delete' | 'insert'; text: string };

function tokenize(s: string): string[] {
    if (!s.length) return [];
    return s.split(/(\s+)/).filter((t) => t.length > 0);
}

function mergeAdjacent(segments: WordDiffSegment[]): WordDiffSegment[] {
    const out: WordDiffSegment[] = [];
    for (const seg of segments) {
        const last = out[out.length - 1];
        if (last && last.type === seg.type) {
            last.text += seg.text;
        } else {
            out.push({ ...seg });
        }
    }
    return out;
}

/** LCS-based backtrack: produce delete/insert/equal ops on token arrays. */
function diffTokens(a: string[], b: string[]): WordDiffSegment[] {
    const n = a.length;
    const m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () =>
        Array(m + 1).fill(0),
    );
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] =
                a[i] === b[j]
                    ? 1 + dp[i + 1][j + 1]
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const raw: WordDiffSegment[] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            raw.push({ type: 'equal', text: a[i] });
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            raw.push({ type: 'delete', text: a[i] });
            i++;
        } else {
            raw.push({ type: 'insert', text: b[j] });
            j++;
        }
    }
    while (i < n) {
        raw.push({ type: 'delete', text: a[i] });
        i++;
    }
    while (j < m) {
        raw.push({ type: 'insert', text: b[j] });
        j++;
    }
    return mergeAdjacent(raw);
}

export function computeWordDiffSegments(before: string, after: string): WordDiffSegment[] {
    return diffTokens(tokenize(before), tokenize(after));
}
