import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AICreditsBadge } from './AICreditsBadge';

const useAICredits = vi.fn();
vi.mock('@/api/aiCredits', () => ({
    useAICredits: () => useAICredits(),
}));

function balance(overrides: Record<string, unknown> = {}) {
    return {
        data: {
            balance: 4990,
            monthly_quota: 5000,
            reset_at: '2026-07-01T00:00:00Z',
            last_reset_at: null,
            exhausted: false,
            ...overrides,
        },
        isLoading: false,
        isError: false,
    };
}

describe('AICreditsBadge', () => {
    beforeEach(() => useAICredits.mockReset());

    it('renders the remaining balance', () => {
        useAICredits.mockReturnValue(balance());
        render(<AICreditsBadge />);
        expect(screen.getByLabelText(/AI credits: 4990 of 5000 remaining/i)).toBeInTheDocument();
        expect(screen.getByText('4,990')).toBeInTheDocument();
    });

    it('renders nothing while loading', () => {
        useAICredits.mockReturnValue({ data: undefined, isLoading: true, isError: false });
        const { container } = render(<AICreditsBadge />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing on error', () => {
        useAICredits.mockReturnValue({ data: undefined, isLoading: false, isError: true });
        const { container } = render(<AICreditsBadge />);
        expect(container).toBeEmptyDOMElement();
    });

    it('marks an exhausted balance with the alert label', () => {
        useAICredits.mockReturnValue(balance({ balance: 0, exhausted: true }));
        render(<AICreditsBadge />);
        expect(screen.getByLabelText(/AI credits: 0 of 5000 remaining/i)).toBeInTheDocument();
    });
});
