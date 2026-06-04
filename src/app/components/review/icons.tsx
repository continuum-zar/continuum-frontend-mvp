import { cn } from "../ui/utils";

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  "aria-label"?: string;
};

function svgProps({ size = 14, className, strokeWidth = 1.75, ...rest }: IconProps) {
  const labelled = !!rest["aria-label"];
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("shrink-0", className),
    role: labelled ? "img" : undefined,
    "aria-hidden": labelled ? undefined : true,
    "aria-label": rest["aria-label"],
  };
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...svgProps({ ...props, className: cn("animate-spin", props.className) })}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.25h.01" />
    </svg>
  );
}

export function DotIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="8" cy="14" r="3.5" />
      <path d="M10.5 11.5L20 4" />
      <path d="M17 7l2.5 2.5" />
      <path d="M14.5 9.5L17 12" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M7 3.5h7L19 8.5V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5z" />
      <path d="M14 3.5V8.5h5" />
      <path d="M9 13h7" />
      <path d="M9 16.5h5" />
    </svg>
  );
}

export function ReviewIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M7 3.5h7L19 8.5V12" />
      <path d="M14 3.5V8.5h5" />
      <path d="M6 19A1.5 1.5 0 0 0 7.5 20.5h4" />
      <circle cx="15.5" cy="16.5" r="3" />
      <path d="M17.75 18.75L20 21" />
    </svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-3.5 3v-3H6.5a2 2 0 0 1-2-2z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function PullRequestIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="6.5" cy="6" r="2" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <path d="M6.5 8v8" />
      <path d="M14 6h2a1.5 1.5 0 0 1 1.5 1.5V16" />
      <path d="M11.5 3.5L14 6l-2.5 2.5" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M13 5h6v6" />
      <path d="M19 5l-8 8" />
      <path d="M19 14v4.5A1.5 1.5 0 0 1 17.5 20H6.5A1.5 1.5 0 0 1 5 18.5V7.5A1.5 1.5 0 0 1 6.5 6H11" />
    </svg>
  );
}
