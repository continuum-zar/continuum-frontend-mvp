import { cn } from "@/app/components/ui/utils";

export type GuidedTourSegment = { text: string; h?: "cyan" | "peach" };

type GuidedTourRichTextProps = {
  segments: GuidedTourSegment[];
  className?: string;
};

/** Matches MCP “Copy URL” tooltip: dark surface copy with optional cyan / peach emphasis. */
export function GuidedTourRichText({ segments, className }: GuidedTourRichTextProps) {
  return (
    <p className={cn("text-left text-[13px] leading-snug text-white", className)}>
      {segments.map((s, i) => (
        <span
          key={i}
          className={
            s.h === "cyan"
              ? "text-[#7dd3fc]"
              : s.h === "peach"
                ? "text-[#fdba74]"
                : undefined
          }
        >
          {s.text}
        </span>
      ))}
    </p>
  );
}
