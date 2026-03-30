import { useState } from "react";

type UsageType = "work" | "personal" | "school";

interface UsageOptionCardBaseProps {
  onClick: () => void;
}

interface UsageOptionCardWithType extends UsageOptionCardBaseProps {
  type: UsageType;
  title?: never;
  description?: never;
  iconSrc?: never;
}

interface UsageOptionCardWithCustom extends UsageOptionCardBaseProps {
  type?: never;
  title: string;
  description: string;
  iconSrc: string;
}

type UsageOptionCardProps = UsageOptionCardWithType | UsageOptionCardWithCustom;

const usageCardData: Record<UsageType, { iconSrc: string; title: string; description: string }> = {
  work: {
    iconSrc: "/onboarding-icons/briefcase-business.svg",
    title: "For work",
    description: "Track projects, company goals, meeting notes",
  },
  personal: {
    iconSrc: "/onboarding-icons/signature.svg",
    title: "For personal life",
    description: "Write better, think more clearly, stay organised",
  },
  school: {
    iconSrc: "/onboarding-icons/graduation-cap.svg",
    title: "For school",
    description: "Keep notes, research, and tasks in one place",
  },
};

export default function UsageOptionCard(props: UsageOptionCardProps) {
  const { onClick } = props;
  const [isHovered, setIsHovered] = useState(false);

  const data =
    "type" in props && props.type
      ? usageCardData[props.type]
      : { title: props.title, description: props.description, iconSrc: props.iconSrc };

  const isActive = isHovered;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      style={{
        width: "100%",
        minHeight: "140px",
        borderRadius: "16px",
        padding: "36px",
        border: isActive ? "1.5px solid #0B191F" : "1px solid #D3D7DA",
        backgroundColor: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "76.3px",
        opacity: isActive ? 1 : 0.65,
        transition:
          "opacity 0.2s ease, border-color 0.2s ease, filter 0.2s ease, color 0.2s ease",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <img
          src={data.iconSrc}
          alt={data.title}
          style={{
            width: "68px",
            height: "68px",
            filter: isActive ? "brightness(0)" : "opacity(0.75)",
            transition: "filter 0.2s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            fontFamily: "Satoshi",
            fontWeight: 500,
            fontSize: "20px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: isActive ? "#0B191F" : "#727D83",
            transition: "color 0.2s ease",
          }}
        >
          {data.title}
        </div>
        <div
          style={{
            fontFamily: "Satoshi",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: isActive ? "#0B191F" : "#727D83",
            opacity: isActive ? 1 : 0.9,
            transition: "color 0.2s ease, opacity 0.2s ease",
          }}
        >
          {data.description}
        </div>
      </div>
    </div>
  );
}
