import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CommentMentionTextarea } from './CommentMentionTextarea';
import type { Member } from '@/types/member';

const alice: Member = {
    id: 1,
    userId: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'developer',
    username: 'alice',
    displayName: 'Alice Smith',
    initials: 'AS',
};

const bob: Member = {
    id: 2,
    userId: 2,
    name: 'Bob Jones',
    email: 'bob@example.com',
    role: 'developer',
    username: 'bob',
    displayName: 'Bob Jones',
    initials: 'BJ',
};

function ControlledMentionTextarea({
    initialValue = '',
    members = [alice, bob],
    onSubmit,
}: {
    initialValue?: string;
    members?: Member[];
    onSubmit?: () => void;
}) {
    const [value, setValue] = useState(initialValue);
    return (
        <CommentMentionTextarea
            value={value}
            onChange={setValue}
            members={members}
            onSubmit={onSubmit}
            placeholder="Write a comment…"
        />
    );
}

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

describe('CommentMentionTextarea', () => {
    it('opens the mention list when @ is typed', async () => {
        const user = userEvent.setup();
        render(<ControlledMentionTextarea />);

        const textarea = screen.getByPlaceholderText('Write a comment…');
        await user.type(textarea, '@');

        expect(screen.getByRole('listbox', { name: 'Mention suggestions' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Alice Smith/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Bob Jones/i })).toBeInTheDocument();
    });

    it('filters suggestions while typing a query', async () => {
        const user = userEvent.setup();
        render(<ControlledMentionTextarea />);

        const textarea = screen.getByPlaceholderText('Write a comment…');
        await user.type(textarea, '@bo');

        expect(screen.getByRole('option', { name: /Bob Jones/i })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Alice Smith/i })).not.toBeInTheDocument();
    });

    it('moves selection with arrow keys and inserts on Enter', async () => {
        const user = userEvent.setup();
        render(<ControlledMentionTextarea />);

        const textarea = screen.getByPlaceholderText('Write a comment…') as HTMLTextAreaElement;
        await user.type(textarea, '@');

        fireEvent.keyDown(textarea, { key: 'ArrowDown' });
        fireEvent.keyDown(textarea, { key: 'Enter' });

        expect(textarea.value).toBe('@bob ');
    });

    it('inserts a mention when an option is clicked', async () => {
        const user = userEvent.setup();
        render(<ControlledMentionTextarea />);

        const textarea = screen.getByPlaceholderText('Write a comment…') as HTMLTextAreaElement;
        await user.type(textarea, '@al');

        await user.click(screen.getByRole('option', { name: /Alice Smith/i }));

        expect(textarea.value).toBe('@alice ');
    });

    it('closes the dropdown on Escape without changing text', async () => {
        const user = userEvent.setup();
        render(<ControlledMentionTextarea />);

        const textarea = screen.getByPlaceholderText('Write a comment…') as HTMLTextAreaElement;
        await user.type(textarea, '@al');

        fireEvent.keyDown(textarea, { key: 'Escape' });

        expect(textarea.value).toBe('@al');
        expect(screen.queryByRole('listbox', { name: 'Mention suggestions' })).not.toBeInTheDocument();
    });

    it('calls onSubmit on Cmd+Enter', () => {
        const onSubmit = vi.fn();
        render(<ControlledMentionTextarea initialValue="Ready to post" onSubmit={onSubmit} />);

        const textarea = screen.getByPlaceholderText('Write a comment…');
        fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
