import { describe, expect, it, vi, beforeAll } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';

import { CommentBody } from './CommentBody';
import type { CommentMentionUserAPI } from '@/types/comment';

const alice: CommentMentionUserAPI = { id: 1, username: 'alice', display_name: 'Alice Smith' };
const bob: CommentMentionUserAPI = { id: 2, username: 'bob', display_name: 'Bob Jones' };

beforeAll(() => {
    vi.stubGlobal(
        'ResizeObserver',
        class ResizeObserver {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    );
});

describe('CommentBody', () => {
    it('renders plain text unchanged', () => {
        render(<CommentBody content="No mentions here." />);
        expect(screen.getByText('No mentions here.')).toBeInTheDocument();
    });

    it('renders a resolved mention with link styling and aria-label', () => {
        render(<CommentBody content="Hey @alice" mentions={[alice]} />);
        const mention = screen.getByRole('link', { name: 'Mention Alice Smith' });
        expect(mention).toHaveTextContent('@alice');
        expect(mention).toHaveClass('text-[#1466ff]');
        expect(mention).toHaveClass('underline');
    });

    it('renders multiple resolved mentions', () => {
        render(<CommentBody content="@alice and @bob" mentions={[alice, bob]} />);
        expect(screen.getByRole('link', { name: 'Mention Alice Smith' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Mention Bob Jones' })).toBeInTheDocument();
    });

    it('renders unresolved mentions without link role', () => {
        render(<CommentBody content="Hi @nobody" mentions={[alice]} />);
        expect(screen.queryByRole('link', { name: /Mention/ })).not.toBeInTheDocument();
        expect(screen.getByText('@nobody')).toBeInTheDocument();
    });

    it('applies whitespace-pre-wrap on the wrapper', () => {
        const { container } = render(<CommentBody content="line one\nline two" />);
        expect(container.firstChild).toHaveClass('whitespace-pre-wrap');
    });

    it('prevents navigation when clicking a resolved mention link', () => {
        render(<CommentBody content="Hey @alice" mentions={[alice]} />);
        const mention = screen.getByRole('link', { name: 'Mention Alice Smith' });
        const event = createEvent.click(mention);
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        fireEvent(mention, event);

        expect(mention).toHaveAttribute('href', '#');
        expect(preventDefaultSpy).toHaveBeenCalled();
    });
});
