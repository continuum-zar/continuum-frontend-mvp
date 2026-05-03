"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "./utils";

function TooltipProvider({
  delayDuration = 0,
  /** Matches Tooltip root default — avoids Radix hoverable-tooltip polygon crashes; pass `false` to restore bridge. */
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      {...props}
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
    />
  );
}

function Tooltip({
  /**
   * When false, Radix keeps the tooltip open while the pointer moves from the trigger onto the
   * tooltip ("hoverable" bridge). That path builds a pointer-grace polygon; with nested
   * `asChild` triggers (e.g. Tooltip → Popover on the same control) the polygon can be undefined
   * and Radix throws (`isPointInPolygon` reads `.length` on it — Firefox: "can't access property
   * length, t is undefined"). Default off for stability; pass `false` only where needed.
   */
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider disableHoverableContent={disableHoverableContent}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        {...props}
        disableHoverableContent={disableHoverableContent}
      />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  /** Radix arrow fill; should match the tooltip surface when overriding background. */
  arrowClassName?: string;
};

function TooltipContent({
  className,
  arrowClassName,
  sideOffset = 0,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className={cn(
            "bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]",
            arrowClassName,
          )}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
