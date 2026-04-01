import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router";

import { CreateProjectModal } from "./CreateProjectModal";
import { InvoiceModal } from "./InvoiceModal";

const imgVector = "https://www.figma.com/api/mcp/asset/2470fa31-25cd-47ac-991d-d1c4219bd28d";
const imgVector4 = "https://www.figma.com/api/mcp/asset/78ced5be-4173-418f-974b-68c6e9f6125c";
const imgVector5 = "https://www.figma.com/api/mcp/asset/04dec58a-df34-4fc6-ba98-484eea4a0b4c";
const imgLucideScrollText = "https://www.figma.com/api/mcp/asset/8f3bfd7b-fb81-41c7-bc6d-5fcf8c73d1e4";
const imgLucideTarget = "https://www.figma.com/api/mcp/asset/6bf96cb4-388b-4e5f-961a-4656035c5b07";
const imgLucideListTodo1 = "https://www.figma.com/api/mcp/asset/c6b03a9f-19dc-4a05-9baa-139251a95efc";
const imgLucideHouse = "https://www.figma.com/api/mcp/asset/388d9d61-9282-4b33-a23c-be98ac66a1f7";
const imgLucideSearch = "https://www.figma.com/api/mcp/asset/96a4c70f-3ae8-48af-8935-3d2391a31d16";
const imgLucideFolderOpenDot = "https://www.figma.com/api/mcp/asset/941ffd1f-d458-4dea-b5e5-49e021a96475";
const imgVector105 = "https://www.figma.com/api/mcp/asset/17833d32-ab5b-4ab4-99e5-73910456563c";
const imgLucideSettings = "https://www.figma.com/api/mcp/asset/b6f4bb01-1341-4aa3-b63b-d4e00aa8f650";
const imgVector7 = "https://www.figma.com/api/mcp/asset/f982bdec-baa8-4afc-b88d-5e64cbe35a27";

function CornerDownRight({ className }: { className?: string }) {
  return (
    <div className={className || "overflow-clip relative size-[16px]"} data-name="corner-down-right" data-node-id="7:374">
      <div className="absolute inset-[16.67%]" data-name="Vector" data-node-id="7:375">
        <div className="absolute inset-[-6.25%]">
          <img alt="" className="block max-w-none size-full" src={imgVector} />
        </div>
      </div>
    </div>
  );
}

type Component1Props = {
  className?: string;
  property1?: "Default" | "Hover" | "Pressing";
  type?: "Ellipse" | "Plus";
};

function Component1({ className, property1 = "Default", type = "Plus" }: Component1Props) {
  const isDefaultAndPlus = property1 === "Default" && type === "Plus";
  return (
    <div className={className || `overflow-clip relative rounded-[4px] ${isDefaultAndPlus ? "size-[16px]" : "content-stretch flex flex-col items-start px-[2.667px] py-[7.333px] w-[16px]"}`} id={isDefaultAndPlus ? "node-7_364" : "node-7_357"}>
      <div className={isDefaultAndPlus ? "absolute inset-[20.83%]" : "h-[1.333px] relative shrink-0 w-[10.667px]"} data-name="Vector" id={isDefaultAndPlus ? "node-7_365" : "node-7_358"}>
        <div className={`absolute ${isDefaultAndPlus ? "inset-[-5.36%]" : "inset-[-50%_-6.25%]"}`}>
          <img alt="" className="block max-w-none size-full" src={isDefaultAndPlus ? imgVector5 : imgVector4} />
        </div>
      </div>
    </div>
  );
}

type Component2Props = {
  className?: string;
  state?: "Default" | "Hover" | "Pressing" | "Selected";
  type?: "Home" | "Invoice" | "Assigned to Me" | "Created by Me";
};

function Component2({ className, state = "Default", type = "Invoice" }: Component2Props) {
  const isDefaultAndHome = state === "Default" && type === "Home";
  const isSelectedAndInvoice = state === "Selected" && type === "Invoice";
  const isDefaultAndAssignedToMe = state === "Default" && type === "Assigned to Me";
  const isSelectedAndAssignedToMe = state === "Selected" && type === "Assigned to Me";
  const isDefaultAndCreatedByMe = state === "Default" && type === "Created by Me";
  const isSelectedAndCreatedByMe = state === "Selected" && type === "Created by Me";
  const isSelectedAndHome = state === "Selected" && type === "Home";
  return (
    <div className={className || `content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] w-[47px] ${isSelectedAndHome || isSelectedAndInvoice || isSelectedAndAssignedToMe || isSelectedAndCreatedByMe ? "border-b border-solid border-white shadow-[0px_0px_1px_0px_rgba(16,115,213,0),0px_0px_1px_0px_rgba(16,115,213,0.02),0px_0px_1px_0px_rgba(16,115,213,0.06),0px_0px_1px_0px_rgba(16,115,213,0.1)]" : "bg-[#edf0f3]"}`} id={isSelectedAndHome ? "node-7_55" : isDefaultAndCreatedByMe ? "node-7_43" : isDefaultAndAssignedToMe ? "node-7_31" : "node-7_19"} style={isSelectedAndHome || isSelectedAndInvoice || isSelectedAndAssignedToMe || isSelectedAndCreatedByMe ? { backgroundImage: "linear-gradient(90deg, rgb(215, 235, 254) 0%, rgb(215, 235, 254) 100%), linear-gradient(146.07354234425264deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(237, 240, 243) 0%, rgb(237, 240, 243) 100%)" } : undefined}>
      {type === "Invoice" && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/scroll-text" data-node-id="7:20">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideScrollText} />
        </div>
      )}
      {isDefaultAndHome && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/house">
          <img
            alt=""
            className="absolute block max-w-none size-full"
            src={imgLucideHouse}
            style={{ filter: "grayscale(1) saturate(0) opacity(0.7)" }}
          />
        </div>
      )}
      {(isDefaultAndAssignedToMe || isSelectedAndAssignedToMe) && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/target" data-node-id="7:33">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideTarget} />
        </div>
      )}
      {(isDefaultAndCreatedByMe || isSelectedAndCreatedByMe) && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/list-todo" data-node-id="7:44">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideListTodo1} />
        </div>
      )}
      {isSelectedAndHome && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/house" data-node-id="7:56">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideHouse} />
        </div>
      )}
    </div>
  );
}

type Frame1Props = {
  className?: string;
  isHomeActive?: boolean;
  isInvoiceActive?: boolean;
  onInvoiceClick: () => void;
};

function Frame1({
  className,
  isHomeActive = false,
  isInvoiceActive = false,
  onInvoiceClick,
  isAssignedActive = false,
  isCreatedActive = false,
}: Frame1Props & { isAssignedActive?: boolean; isCreatedActive?: boolean }) {
  return (
    <div className={className || "content-stretch flex gap-[8px] items-center relative"} data-node-id="7:72">
      <Link
        to="/dashboard-placeholder"
        className="text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Home"
      >
        <Component2
          className={`content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 w-[47px] ${
            isHomeActive
              ? "border-b border-solid border-white shadow-[0px_0px_1px_0px_rgba(16,115,213,0),0px_0px_1px_0px_rgba(16,115,213,0.02),0px_0px_1px_0px_rgba(16,115,213,0.06),0px_0px_1px_0px_rgba(16,115,213,0.1)]"
              : "bg-[#edf0f3]"
          }`}
          state={isHomeActive ? "Selected" : "Default"}
          type="Home"
        />
      </Link>
      <button
        type="button"
        onClick={onInvoiceClick}
        className="text-inherit outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Invoices"
      >
        <Component2
          className={`content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 w-[47px] ${
            isInvoiceActive ? "border-b border-solid border-white shadow-[0px_0px_1px_0px_rgba(16,115,213,0),0px_0px_1px_0px_rgba(16,115,213,0.02),0px_0px_1px_0px_rgba(16,115,213,0.06),0px_0px_1px_0px_rgba(16,115,213,0.1)]" : "bg-[#edf0f3]"
          }`}
          state={isInvoiceActive ? "Selected" : "Default"}
          type="Invoice"
        />
      </button>
      <Link
        to="/dashboard-placeholder/assigned"
        className="inline-flex h-[40px] w-[47px] shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Assigned to me"
      >
        <Component2
          className={`content-stretch flex h-full w-full gap-[12px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 ${
            isAssignedActive
              ? "border-b border-solid border-white shadow-[0px_0px_1px_0px_rgba(16,115,213,0),0px_0px_1px_0px_rgba(16,115,213,0.02),0px_0px_1px_0px_rgba(16,115,213,0.06),0px_0px_1px_0px_rgba(16,115,213,0.1)]"
              : "bg-[#edf0f3]"
          }`}
          state={isAssignedActive ? "Selected" : "Default"}
          type="Assigned to Me"
        />
      </Link>
      <Link
        to="/dashboard-placeholder/created"
        className="inline-flex h-[40px] w-[47px] shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Created by me"
      >
        <Component2
          className={`content-stretch flex h-full w-full gap-[12px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 ${
            isCreatedActive
              ? "border-b border-solid border-white shadow-[0px_0px_1px_0px_rgba(16,115,213,0),0px_0px_1px_0px_rgba(16,115,213,0.02),0px_0px_1px_0px_rgba(16,115,213,0.06),0px_0px_1px_0px_rgba(16,115,213,0.1)]"
              : "bg-[#edf0f3]"
          }`}
          state={isCreatedActive ? "Selected" : "Default"}
          type="Created by Me"
        />
      </Link>
    </div>
  );
}

function formatHms(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Figma 13:338 Frame 382 — idle: grey ring + red dot. Figma 13:841/13:858 Frame 383 — recording: rgba(235,67,53,0.1) circle + ~18px red square */
function LeftRailRecordButton({
  recording,
  onToggle,
}: {
  recording: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative box-border flex size-[42px] shrink-0 items-center justify-center rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring ${
        recording
          ? "border-0 bg-transparent p-[10.615px]"
          : "border border-solid border-[#8a8f91] bg-white p-[2.5px]"
      }`}
      aria-label={recording ? "Stop recording time" : "Start recording time"}
      aria-pressed={recording}
    >
      {recording ? (
        <>
          <span
            className="absolute left-1/2 top-1/2 size-[42.462px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(235,67,53,0.1)]"
            aria-hidden
          />
          <span
            className="relative z-[1] size-[17.692px] shrink-0 rounded-[3px] bg-[#eb4335]"
            aria-hidden
          />
        </>
      ) : (
        <span className="relative z-[1] size-[30px] shrink-0 rounded-full bg-[#eb4335]" aria-hidden />
      )}
    </button>
  );
}

function Frame({
  className,
  isHomeActive = false,
  isInvoiceActive = false,
  onInvoiceClick,
  isAssignedActive = false,
  isCreatedActive = false,
}: {
  className?: string;
  isHomeActive?: boolean;
  isInvoiceActive?: boolean;
  onInvoiceClick: () => void;
  isAssignedActive?: boolean;
  isCreatedActive?: boolean;
}) {
  return (
    <div className={className || "content-stretch flex flex-col gap-[8px] items-start relative"} data-node-id="7:92">
      <div className="bg-[#edf0f3] content-stretch flex gap-[8px] h-[40px] items-center px-[16px] py-[8px] relative rounded-[999px] shrink-0 w-full" data-name="Component 6" data-node-id="7:93">
        <div className="relative shrink-0 size-[16px]" data-name="lucide/search" data-node-id="7:94">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideSearch} />
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] text-center whitespace-nowrap" data-node-id="7:96">
          Search Projects
        </p>
      </div>
      <Frame1
        className="content-stretch flex gap-[8px] items-center relative shrink-0"
        isHomeActive={isHomeActive}
        isInvoiceActive={isInvoiceActive}
        onInvoiceClick={onInvoiceClick}
        isAssignedActive={isAssignedActive}
        isCreatedActive={isCreatedActive}
      />
    </div>
  );
}

export function DashboardLeftRail() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [timeRecording, setTimeRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!timeRecording) return;
    const id = window.setInterval(() => setElapsedSec((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [timeRecording]);
  const isHomeActive = pathname === "/dashboard-placeholder";
  const isInvoiceActive = invoiceOpen;
  const isAssignedActive = pathname.startsWith("/dashboard-placeholder/assigned");
  const isCreatedActive = pathname.startsWith("/dashboard-placeholder/created");
  const isGetStartedActive =
    pathname.startsWith("/dashboard-placeholder/get-started") ||
    pathname.startsWith("/dashboard-placeholder/task/");

  return (
    <>
      <div
        className="flex h-full min-h-0 w-[212px] shrink-0 flex-col items-stretch overflow-hidden z-[2]"
        data-node-id="7:2819"
      >
        <div className="content-stretch flex flex-col gap-[9.534px] items-center pb-[16px] pt-[32px] relative shrink-0 w-full" data-node-id="7:2822">
          <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="7:2824">
            <p
              className="relative shrink-0 text-center font-normal font-['Sarina',sans-serif] text-[26.219px] leading-[29.397px] tracking-[-0.5244px] whitespace-nowrap text-[#1A4659]"
              data-node-id="7:2825"
            >
              Continuum
            </p>
          </div>
        </div>
        <Frame
          className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0"
          isHomeActive={isHomeActive}
          isInvoiceActive={isInvoiceActive}
          onInvoiceClick={() => setInvoiceOpen(true)}
          isAssignedActive={isAssignedActive}
          isCreatedActive={isCreatedActive}
        />
        <div className="relative flex min-h-0 w-full flex-1 flex-col gap-[16px] overflow-x-hidden overflow-y-auto" data-node-id="7:2820">
        <div className="content-stretch flex flex-col isolate items-start relative shrink-0 w-full" data-node-id="7:2828">
          <div className="content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full z-[5]" data-node-id="I7:2828;2172:27463">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I7:2828;2172:27464">
              <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="I7:2828;2172:27466">
                Projects
              </p>
            </div>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I7:2828;2172:27467">
              <Component1 className="content-stretch flex flex-col items-start overflow-clip px-[2.667px] py-[7.333px] relative rounded-[4px] shrink-0 w-[16px]" type="Ellipse" />
              <button
                type="button"
                onClick={() => setCreateProjectOpen(true)}
                className="inline-flex size-[16px] shrink-0 items-center justify-center overflow-clip rounded-[16px] border-0 bg-transparent p-0"
                aria-label="Create project"
                data-name="Component 35"
                data-node-id="I7:2828;2172:27469"
              >
                <div className="relative size-[16px]">
                  <div className="absolute inset-[20.83%]" data-name="Vector" data-node-id="I7:2828;2172:27469;2119:3014">
                    <div className="absolute inset-[-5.36%]">
                      <img alt="" className="block max-w-none size-full" src={imgVector5} />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
          <Link
            to="/dashboard-placeholder/welcome"
            className="content-stretch flex h-[40px] cursor-pointer items-center px-[12px] relative rounded-[8px] shrink-0 w-full z-[2] text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
            data-name="Component 69"
            data-node-id="I7:2828;2172:27472"
          >
            <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px min-w-px relative" data-node-id="I7:2828;2172:27472;2172:25325">
              <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-open-dot" data-node-id="I7:2828;2172:27472;2172:25350">
                <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderOpenDot} />
              </div>
              <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic overflow-hidden relative text-[#0b191f] text-[14px] text-ellipsis text-left whitespace-nowrap" data-node-id="I7:2828;2172:27472;2172:25328">
                Welcome to Continuum!
              </p>
            </div>
          </Link>
          <Link
            to="/dashboard-placeholder/get-started"
            className={`content-stretch flex gap-[4px] h-[40px] items-center pl-[24px] pr-[12px] relative rounded-[8px] shrink-0 w-full z-[1] text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring ${
              isGetStartedActive ? "bg-[rgba(220,227,229,0.68)]" : ""
            }`}
            data-name="Component 70"
            data-node-id="I7:2828;2172:27567"
          >
            <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px min-w-px relative" data-node-id="I7:2828;2172:27567;2172:27061">
              <CornerDownRight className="overflow-clip relative shrink-0 size-[16px]" />
              <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic overflow-hidden relative text-[#0b191f] text-[14px] text-ellipsis whitespace-nowrap" data-node-id="I7:2828;2172:27567;2172:27066">
                Get started
              </p>
            </div>
          </Link>
        </div>
        <div className="pointer-events-none absolute content-stretch flex flex-col items-center left-[131px] opacity-0 top-[159px] w-[145px]" data-node-id="7:2829" aria-hidden="true">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-node-id="7:2830">
            <div className="bg-[#0b191f] content-stretch flex flex-col items-start py-[4px] relative rounded-[8px] shadow-[0px_26px_7px_0px_rgba(21,21,21,0),0px_16px_7px_0px_rgba(21,21,21,0),0px_9px_6px_0px_rgba(21,21,21,0.01),0px_4px_4px_0px_rgba(21,21,21,0.02),0px_1px_2px_0px_rgba(21,21,21,0.03)] shrink-0 w-full" data-name="Tooltip" data-node-id="7:2831">
              <div className="content-stretch flex flex-col items-start justify-center px-[16px] py-[4px] relative rounded-[8px] shrink-0 w-full" data-name="Component 9" data-node-id="7:2832">
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap" data-node-id="7:2833">
                  Create a projet
                </p>
              </div>
            </div>
          </div>
          <div className="h-[16.5px] relative shrink-0 w-[47px]" data-node-id="7:2836">
            <div className="absolute inset-[0_0_47.14%_0]">
              <img alt="" className="block max-w-none size-full" src={imgVector105} />
            </div>
          </div>
        </div>
        </div>
        {/* Figma 13:560 — timer + divider + profile stacked with no extra vertical gap */}
        <div className="flex w-full shrink-0 flex-col gap-0" data-node-id="7:2837">
        {/* Figma 13:571–13:573 — timer + Select ticket + record (13:575, 13:588) */}
        <div className="flex w-full shrink-0 items-center gap-2 pl-2 pr-0 py-1" data-name="Component 144">
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0 leading-none">
                <p className="whitespace-nowrap font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                  {formatHms(elapsedSec)}
                </p>
                <button
                  type="button"
                  className="mt-0.5 flex items-start gap-0.5 rounded-sm text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Select ticket"
                >
                  <span className="whitespace-nowrap font-['Satoshi',sans-serif] text-[12px] font-medium text-[#606d76]">
                    Select ticket
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-[#606d76]" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
              <LeftRailRecordButton
                recording={timeRecording}
                onToggle={() => {
                  setTimeRecording((r) => {
                    if (r) setElapsedSec(0);
                    return !r;
                  });
                }}
              />
        </div>
        <div
          className="pointer-events-none hidden gap-[12px] px-[12px] py-0"
          data-name="Component 12"
          data-node-id="7:2838"
          aria-hidden="true"
        >
          <div className="relative shrink-0 size-[16px]" data-name="lucide/settings" data-node-id="7:2839">
            <img alt="" className="absolute block max-w-none size-full" src={imgLucideSettings} />
          </div>
          <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="7:2841">
            Settings
          </p>
        </div>
        <div className="h-px w-full shrink-0 bg-[#ebedee]" data-node-id="7:2842" aria-hidden />
        <div className="content-stretch flex h-[40px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-name="Component 13" data-node-id="7:2843">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2844">
            <div className="bg-[#f17173] content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" data-name="Component 31" data-node-id="7:2845">
              <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[9px] text-white whitespace-nowrap" data-node-id="I7:2845;2032:902">
                <p className="leading-[0.4]">AS</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] items-start justify-center leading-[normal] not-italic relative shrink-0 whitespace-nowrap" data-node-id="7:2846">
              <p className="relative shrink-0 text-[#0b191f] text-[14px]" data-node-id="7:2847">
                Amukelani Shiringani
              </p>
              <p className="relative shrink-0 text-[#727d83] text-[12px]" data-node-id="7:2848">
                amushiringani@gmail.com
              </p>
            </div>
          </div>
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="lucide" data-node-id="7:2849">
            <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector" data-node-id="I7:2849;2032:589">
              <div className="absolute inset-[-16.67%_-8.33%]">
                <img alt="" className="block max-w-none size-full" src={imgVector7} />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <CreateProjectModal open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
      <InvoiceModal open={invoiceOpen} onOpenChange={setInvoiceOpen} />
    </>
  );
}
