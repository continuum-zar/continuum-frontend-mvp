import { describe, expect, it, vi } from 'vitest';
import { confirmTasks, generateTasks } from './wiki';

const { postMock } = vi.hoisted(() => ({
    postMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    default: {
        post: postMock,
    },
}));

describe('wiki AI task generation API', () => {
    it('includes figma_attachment when generating tasks', async () => {
        const figmaAttachment = {
            url: 'https://www.figma.com/design/abc123/App?node-id=12-34',
            file_key: 'abc123',
            node_id: '12:34',
            source_name: 'App',
        };
        postMock.mockResolvedValueOnce({
            data: {
                project_id: 1,
                prompt: 'Implement this design',
                tasks: [],
                source_files_used: [],
                confidence: 0.8,
            },
        });

        await generateTasks(1, {
            prompt: 'Implement this design',
            max_tasks: 1,
            figma_attachment: figmaAttachment,
        });

        expect(postMock).toHaveBeenCalledWith(
            '/projects/1/wiki/generate',
            {
                prompt: 'Implement this design',
                max_tasks: 1,
                figma_attachment: figmaAttachment,
            },
            { timeout: 600_000 },
        );
    });

    it('sends generated task resources through confirm', async () => {
        postMock.mockResolvedValueOnce({ data: { created_count: 1, task_ids: [42] } });

        await confirmTasks(1, {
            tasks: [
                {
                    title: 'Implement dashboard',
                    project_id: 1,
                    scope_weight: 'M',
                    status: 'todo',
                    resources: [
                        {
                            kind: 'figma_link',
                            name: 'Dashboard frame',
                            url: 'https://www.figma.com/design/abc123/App?node-id=12-34',
                        },
                    ],
                },
            ],
        });

        expect(postMock).toHaveBeenCalledWith(
            '/projects/1/wiki/confirm',
            {
                tasks: [
                    expect.objectContaining({
                        title: 'Implement dashboard',
                        resources: [
                            expect.objectContaining({
                                kind: 'figma_link',
                                name: 'Dashboard frame',
                            }),
                        ],
                    }),
                ],
            },
            { timeout: 180_000 },
        );
    });
});
