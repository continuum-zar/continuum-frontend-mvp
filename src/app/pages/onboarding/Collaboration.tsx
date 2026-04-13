import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import UsageOptionCard from "../../components/onboarding/UsageOptionCard";
import { onboardingRootClassName } from "./onboardingViewportStyles";

type CollaborationMode = "with-others" | "on-my-own";

export default function Collaboration() {
  const navigate = useNavigate();

  const handleCardClick = (mode: CollaborationMode) => {
    localStorage.setItem("continuum_collaboration_mode", mode);
    navigate("/onboarding/role");
  };

  const handleBack = () => {
    navigate("/onboarding/usage");
  };

  return (
    <div
      className={onboardingRootClassName}
      style={{
        background: "linear-gradient(180deg, #B2E6F7 -17.26%, #FFFFFF 17.31%)",
        paddingTop: "40px",
        paddingBottom: "40px",
      }}
    >
      <div
        className="w-full px-12"
        style={{ height: "134px", display: "flex", alignItems: "flex-start" }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
          style={{ marginLeft: "0" }}
        >
          <ChevronLeft size={20} style={{ color: "#252014" }} />
          <span
            style={{
              fontFamily: "Sarina",
              fontWeight: 400,
              fontSize: "20.89px",
              lineHeight: "23.42px",
              letterSpacing: "-0.02em",
              color: "#252014",
              textAlign: "center",
            }}
          >
            Continuum
          </span>
        </button>
      </div>

      <div className="flex flex-col items-center w-full max-w-[511px] px-6">
        <div className="flex flex-col gap-2 w-full text-center mb-12">
          <h1
            style={{
              fontFamily: "Satoshi",
              fontWeight: 700,
              fontSize: "28px",
              lineHeight: "100%",
              letterSpacing: "-0.02em",
              color: "#0B191F",
            }}
          >
            How do you want to collaborate?
          </h1>
          <p
            style={{
              fontFamily: "Satoshi",
              fontWeight: 700,
              fontSize: "24px",
              fontStyle: "normal",
              lineHeight: "normal",
              letterSpacing: "-0.48px",
              color: "#727D83",
              textAlign: "center",
            }}
          >
            This helps customise your experience
          </p>
        </div>

        <div className="flex flex-col w-full gap-6">
          <UsageOptionCard
            title="With others"
            description="Work with your team in shared spaces"
            iconSrc="/onboarding-icons/users-round.svg"
            onClick={() => handleCardClick("with-others")}
          />
          <UsageOptionCard
            title="On my own"
            description="Use Continuum for your personal workflow"
            iconSrc="/onboarding-icons/user-round.svg"
            onClick={() => handleCardClick("on-my-own")}
          />
        </div>
      </div>
    </div>
  );
}
