import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const baseText =
    "font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] text-foreground";

/**
 * Renders AI planner assistant replies as Markdown (**bold**, lists, headings, code).
 * Safe by default: no raw HTML (react-markdown escapes content).
 */
const components: Components = {
    p: ({ children }) => <p className={`mb-2 last:mb-0 ${baseText}`}>{children}</p>,
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
    h1: ({ children }) => (
        <h1
            className={`mb-2 mt-4 first:mt-0 font-['Satoshi',sans-serif] text-[15px] font-semibold text-foreground`}
        >
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2
            className={`mb-2 mt-3 first:mt-0 font-['Satoshi',sans-serif] text-[14px] font-semibold text-foreground`}
        >
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3
            className={`mb-1.5 mt-2 first:mt-0 font-['Satoshi',sans-serif] text-[13px] font-semibold text-foreground`}
        >
            {children}
        </h3>
    ),
    ul: ({ children }) => (
        <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-muted-foreground last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 ml-4 list-decimal space-y-1 marker:font-medium marker:text-muted-foreground last:mb-0">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className={`${baseText} pl-0.5`}>{children}</li>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-3 border-border" />,
    code: ({ className, children, ...props }) => {
        const isBlock = Boolean(className?.includes('language-'));
        if (isBlock) {
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }
        return (
            <code
                className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="mb-2 overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-[12px] leading-[18px] text-foreground last:mb-0">
            {children}
        </pre>
    ),
};

export function PlannerAssistantMarkdown({ content }: { content: string }) {
    return (
        <div className="w-full min-w-0 [&_*]:break-words">
            <ReactMarkdown components={components}>{content}</ReactMarkdown>
        </div>
    );
}
