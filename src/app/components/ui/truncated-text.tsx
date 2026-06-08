"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "./utils";

export type TruncatedTextProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  /** Full text to display; the tooltip shows this verbatim when truncated. */
  text: string;
  /** Tooltip placement when the text overflows. */
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  /** Maximum width applied to the tooltip surface so very long names wrap. */
  tooltipClassName?: string;
};

/**
 * Renders text in a truncating container and reveals a tooltip with the full
 * value only when the rendered text actually overflows its box. The visible
 * text remains in the DOM, so assistive tech reads the full name regardless.
 */
export function TruncatedText({
  text,
  className,
  side = "top",
  tooltipClassName,
  ...spanProps
}: TruncatedTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setIsTruncated(el.scrollWidth - el.clientWidth > 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const span = (
    <span
      ref={ref}
      className={cn("block min-w-0 truncate", className)}
      {...spanProps}
    >
      {text}
    </span>
  );

  if (!isTruncated) return span;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn("max-w-[320px] break-words", tooltipClassName)}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
