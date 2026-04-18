import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const baseText =
    "font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] text-[#0b191f]";

/**
 * Renders AI planner assistant replies as Markdown (**bold**, lists, headings, code).
 * Safe by default: no raw HTML (react-markdown escapes content).
 */
const components: Components = {
    p: ({ children }) => <p className={`mb-2 last:mb-0 ${baseText}`}>{children}</p>,
    strong: ({ children }) => (
        <strong className="font-semibold text-[#0b191f]">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-[#0b191f]">{children}</em>,
    h1: ({ children }) => (
        <h1
            className={`mb-2 mt-4 first:mt-0 font-['Satoshi',sans-serif] text-[15px] font-semibold text-[#0b191f]`}
        >
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2
            className={`mb-2 mt-3 first:mt-0 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]`}
        >
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3
            className={`mb-1.5 mt-2 first:mt-0 font-['Satoshi',sans-serif] text-[13px] font-semibold text-[#0b191f]`}
        >
            {children}
        </h3>
    ),
    ul: ({ children }) => (
        <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-[#606d76] last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 ml-4 list-decimal space-y-1 marker:font-medium marker:text-[#606d76] last:mb-0">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className={`${baseText} pl-0.5`}>{children}</li>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#2E96F9] underline decoration-[#2E96F9]/40 underline-offset-2 hover:text-[#1a7ed6]"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-[#edecea] pl-3 text-[#606d76] last:mb-0">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-3 border-[#edecea]" />,
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
                className="rounded bg-[#edf0f3] px-1 py-0.5 font-mono text-[12px] text-[#0b191f]"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="mb-2 overflow-x-auto rounded-lg border border-[#edecea] bg-[#f9fafb] p-3 font-mono text-[12px] leading-[18px] text-[#0b191f] last:mb-0">
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
