import { describe, expect, it, vi } from 'vitest';
import type { FigmaContext, PlannerMessage } from './planner';
import { generatePlan, sendPlannerChat } from './planner';

const { postMock } = vi.hoisted(() => ({
    postMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    default: {
        post: postMock,
    },
}));

describe('planner API', () => {
    const messages: PlannerMessage[] = [{ role: 'user', content: 'Plan the dashboard' }];
    const figmaContext: FigmaContext = {
        file_key: 'abc123',
        node_id: '12:34',
        url: 'https://www.figma.com/design/abc123/App?node-id=12-34',
        source_name: 'Dashboard',
        summary: 'Dashboard design context',
        components: ['Task card'],
        tokens: ['Primary blue'],
        interactions: ['Open details drawer'],
        screenshots: [],
    };

    it('includes figma_context when sending planner chat', async () => {
        postMock.mockResolvedValueOnce({
            data: {
                reply: 'Looks good',
                confidence: 85,
                missing_areas: [],
                ready_to_plan: true,
            },
        });

        await sendPlannerChat(messages, [], figmaContext);

        expect(postMock).toHaveBeenCalledWith(
            '/planner/chat',
            {
                messages,
                file_contents: [],
                figma_context: figmaContext,
            },
            { signal: undefined, timeout: 600_000 },
        );
    });

    it('includes figma_context when generating a plan', async () => {
        postMock.mockResolvedValueOnce({
            data: {
                plan: {
                    project_name: 'Dashboard',
                    project_description: 'Build dashboard',
                    milestones: [],
                    summary: 'Plan summary',
                },
                confidence: 90,
            },
        });

        await generatePlan(messages, [], figmaContext);

        expect(postMock).toHaveBeenCalledWith(
            '/planner/generate-plan',
            {
                messages,
                file_contents: [],
                figma_context: figmaContext,
            },
            { timeout: 600_000 },
        );
    });
});
