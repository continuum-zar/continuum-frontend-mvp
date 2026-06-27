/**
 * Markdown renderer for the Task detail page's description field.
 *
 * Same library + safe-by-default posture as
 * `PlannerAssistantMarkdown` (no raw HTML, no GFM plugins — pure
 * CommonMark). Typography matches the surrounding panel so plain-text
 * descriptions written before Markdown was supported render identically:
 * base size 16px, `font-medium`, color `#0b191f`. Emphasis bumps weight
 * via `**bold**` → semibold; everything else (lists, headings, links,
 * code blocks) lands in the visual idiom of the rest of the task view.
 *
 * Click-to-edit is preserved by the parent. Links inside the rendered
 * markdown stop propagation so clicking a URL doesn't ALSO toggle the
 * description into edit mode.
 */

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const baseText =
    "text-[16px] font-medium leading-relaxed text-foreground";

const components: Components = {
    p: ({ children }) => (
        <p className={`mb-3 last:mb-0 ${baseText}`}>{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
    h1: ({ children }) => (
        <h1 className="mb-2 mt-4 first:mt-0 font-['Satoshi',sans-serif] text-[20px] font-semibold text-foreground">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="mb-2 mt-3 first:mt-0 font-['Satoshi',sans-serif] text-[18px] font-semibold text-foreground">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="mb-1.5 mt-2 first:mt-0 font-['Satoshi',sans-serif] text-[16px] font-semibold text-foreground">
            {children}
        </h3>
    ),
    ul: ({ children }) => (
        <ul className="mb-3 ml-5 list-disc space-y-1 marker:text-muted-foreground last:mb-0">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-3 ml-5 list-decimal space-y-1 marker:text-muted-foreground last:mb-0">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className={baseText}>{children}</li>,
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            // Don't let a link click trigger the parent's click-to-edit handler.
            onClick={(e) => e.stopPropagation()}
            className="text-primary underline underline-offset-2 hover:text-primary"
        >
            {children}
        </a>
    ),
    code: ({ children }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="mb-3 overflow-x-auto rounded-[6px] bg-[#0b191f] p-3 font-mono text-[13px] leading-snug text-[#e9eef2] last:mb-0">
            {children}
        </pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-3 border-l-2 border-border pl-3 italic text-foreground last:mb-0">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-4 border-border" />,
};

interface TaskDescriptionMarkdownProps {
    children: string;
}

export function TaskDescriptionMarkdown({ children }: TaskDescriptionMarkdownProps) {
    return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
