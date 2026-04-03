import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Check } from "lucide-react";

const functions = [
  "Administrative assistance",
  "Communications",
  "Customer experience",
  "Data or Analytics",
  "Design",
  "Education professional",
  "Engineering",
  "Finance and Accounting",
  "Other",
  "Software development",
];

function getInitialSelectedFunctions(): string[] {
  const saved = localStorage.getItem("continuum_functions");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((f) => functions.includes(f));
        if (valid.length) return valid;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export default function FunctionSelection() {
  const navigate = useNavigate();
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>(getInitialSelectedFunctions);

  const handleFunctionClick = (fn: string) => {
    setSelectedFunctions((prev) => {
      const next = prev.includes(fn) ? prev.filter((f) => f !== fn) : [...prev, fn];
      localStorage.setItem("continuum_functions", JSON.stringify(next));
      return next;
    });
  };

  const handleBack = () => {
    navigate("/onboarding/role");
  };

  const handleContinue = () => {
    if (selectedFunctions.length > 0) {
      navigate("/onboarding/use-case");
    }
  };

  const handleSkip = () => {
    navigate("/dashboard-placeholder/entry");
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
        <div className="flex flex-col gap-2 w-full text-center" style={{ marginBottom: "48px" }}>
          <h1
            style={{
              fontFamily: "Satoshi",
              fontWeight: 700,
              fontSize: "24px",
              lineHeight: "100%",
              letterSpacing: "-0.02em",
              color: "#0B191F",
            }}
          >
            What function best describes your work?
          </h1>
          <p
            style={{
              color: "#727D83",
              fontFamily: "Satoshi",
              fontSize: "24px",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "normal",
              letterSpacing: "-0.48px",
              textAlign: "center",
            }}
          >
            This helps customise your experience
          </p>
        </div>

        <div
          className="w-full text-left mb-3"
          style={{
            fontFamily: "Satoshi",
            fontWeight: 500,
            color: "#727D83",
            fontSize: "14px",
            lineHeight: "100%",
          }}
        >
          {selectedFunctions.length} Selected
        </div>

        <div
          className="w-full"
          style={{
            display: "flex",
            alignItems: "flex-start",
            alignContent: "flex-start",
            gap: "8px",
            alignSelf: "stretch",
            flexWrap: "wrap",
            marginBottom: "190px",
          }}
        >
          {functions.map((fn) => {
            const isSelected = selectedFunctions.includes(fn);
            return (
              <button
                key={fn}
                type="button"
                onClick={() => handleFunctionClick(fn)}
                className="flex items-center gap-2 border transition-all rounded-lg"
                style={{
                  height: "44px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  fontFamily: "Satoshi",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "100%",
                  color: isSelected ? "#0B191F" : "#727D83",
                  backgroundColor: isSelected ? "#FFFFFF" : "#F5F6F7",
                  borderWidth: "1px",
                  borderColor: isSelected ? "#0B191F" : "#D3D7DA",
                }}
              >
                {fn}
                {isSelected && <Check size={16} color="#2563EB" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center w-full" style={{ gap: "8px" }}>
          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedFunctions.length === 0}
            className="text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              display: "flex",
              width: "297px",
              height: "40px",
              padding: "8px 16px",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              borderRadius: "8px",
              borderTop: "1px solid #FFF",
              background:
                "linear-gradient(142deg, #24B5F8 -123.02%, #5521FE 802.55%), linear-gradient(142deg, #24B5F8 -123.02%, #5521FE 802.55%), #24B5F8",
              boxShadow: "0 3px 9.3px 0 rgba(44, 158, 249, 0.10)",
              fontFamily: "Satoshi",
              fontWeight: 500,
              fontSize: "16px",
            }}
          >
            Continue
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-[#727D83] transition-colors cursor-pointer"
            style={{
              display: "flex",
              width: "297px",
              minWidth: "297px",
              height: "32px",
              minHeight: "32px",
              padding: "8px 16px",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              borderRadius: "8px",
              fontFamily: "Satoshi",
              fontWeight: 500,
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0B191F";
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#727D83";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
