import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import UsageOptionCard from "../../components/onboarding/UsageOptionCard";

type UsageMode = "work" | "personal" | "school";

export default function Usage() {
  const navigate = useNavigate();
  const [, setSelectedUsage] = useState<UsageMode | null>(null);

  const handleCardClick = (mode: UsageMode) => {
    setSelectedUsage(mode);
    localStorage.setItem("continuum_usage_mode", mode);
    if (mode === "work") {
      navigate("/onboarding/collaboration");
    } else if (mode === "personal") {
      navigate("/onboarding/features");
    } else {
      navigate("/onboarding/mind");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center"
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
            How do you want to use Continuum?
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
          <UsageOptionCard type="work" onClick={() => handleCardClick("work")} />
          <UsageOptionCard type="personal" onClick={() => handleCardClick("personal")} />
          <UsageOptionCard type="school" onClick={() => handleCardClick("school")} />
        </div>
      </div>
    </div>
  );
}
