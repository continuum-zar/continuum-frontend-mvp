import { Link } from "react-router";

import { WelcomeMetricsRow } from "../components/welcome/WelcomeMetricsRow";

const imgVector = "https://www.figma.com/api/mcp/asset/cacdb2e3-e05a-4b8c-8af9-92f40d7d18dc";
const imgVector4 = "https://www.figma.com/api/mcp/asset/c3b52218-d733-48d4-bdc8-06bb9e9a483b";
const imgVector5 = "https://www.figma.com/api/mcp/asset/4bb96863-dcd1-4992-adc3-89235afafcce";
const imgLucideHouse = "https://www.figma.com/api/mcp/asset/3f251344-9625-4758-8378-ab9e36ac0a08";
const imgLucideTarget = "https://www.figma.com/api/mcp/asset/8d4c8e75-6f30-480a-80b8-811ca12f8b39";
const imgLucideListTodo = "https://www.figma.com/api/mcp/asset/3d5520c2-3c0f-4d4b-b509-08e0e720ff35";
const imgLucideSearch = "https://www.figma.com/api/mcp/asset/816b3301-2710-49b5-b489-cfed543179c2";
const imgLucideScrollText = "https://www.figma.com/api/mcp/asset/b6085f62-deab-4bf5-a3ab-ce34315798ac";
const imgLucideFolderOpenDot = "https://www.figma.com/api/mcp/asset/565be4ed-fc29-4562-a26f-1c943a6d5847";
const imgLucideSettings = "https://www.figma.com/api/mcp/asset/fbf5329b-aa45-4cb6-8b40-087712a4088d";
const imgVector6 = "https://www.figma.com/api/mcp/asset/742275dd-26b4-4316-bfb1-47486a4607f5";
const imgVector7 = "https://www.figma.com/api/mcp/asset/df985590-409e-419a-9294-2aa12acc296b";
const imgLucideBuilding2 = "https://www.figma.com/api/mcp/asset/71a5ce6a-04cd-4e3a-bf8d-8982fbc63fe8";
const imgLucideX = "https://www.figma.com/api/mcp/asset/74ddb36d-7bc2-46ad-838d-6170796e1694";
const imgLucideBell = "https://www.figma.com/api/mcp/asset/0e2a64e9-ee3f-4ce3-aa60-05063accc712";
const imgLucideFolderCog = "https://www.figma.com/api/mcp/asset/5cad83cc-0f0b-48f5-9afd-c5124c0169e6";
const imgLucideShare = "https://www.figma.com/api/mcp/asset/00b88546-c39b-453e-aa9d-34f496edd586";
const imgLucideChevronDown = "https://www.figma.com/api/mcp/asset/72ab3ac0-aebf-4278-859f-4205108fb16c";
const imgVector8 = "https://www.figma.com/api/mcp/asset/1acc14a4-997e-4b19-b81a-91ef21ff09c2";
const imgFrame273 = "https://www.figma.com/api/mcp/asset/ac507bb9-a208-4172-9994-88e7c4869ce4";
const imgLucidePlus = "https://www.figma.com/api/mcp/asset/a8bb95b4-2e9b-4e0d-861b-fa00d8582ce7";
const imgLucidePaperclip = "https://www.figma.com/api/mcp/asset/4f0c9d53-e72c-473e-981a-13f5b9320156";
const imgLucideInfo = "https://www.figma.com/api/mcp/asset/f597ed55-c78f-481a-a433-abcd6a07d507";
const imgLucideCircleCheckBig = "https://www.figma.com/api/mcp/asset/22239b8b-27ab-4973-ad00-4eaffd3f837b";
const imgDivider = "https://www.figma.com/api/mcp/asset/7a877d5e-6a85-4a7f-ae6d-3c1d119e5fb4";
const imgLucideCircleDashed = "https://www.figma.com/api/mcp/asset/ccaffd7b-80ba-4413-ada6-9324ab249688";
const imgLucideTrafficCone = "https://www.figma.com/api/mcp/asset/df64d315-4479-4557-86ce-eebf48f8e6ec";
const imgLucidePlus1 = "https://www.figma.com/api/mcp/asset/1da1cc85-0c45-4470-a43f-e9a9f1a1e4f5";

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

type ComponentProps = {
  className?: string;
  property1?: "Default" | "Hover" | "Pressing";
  type?: "Ellipse" | "Plus";
};

function Component({ className, property1: _property1 = "Default", type = "Plus" }: ComponentProps) {
  const isDefaultAndPlus = _property1 === "Default" && type === "Plus";
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
type Component1Props = {
  className?: string;
  state?: "Default" | "Hover" | "Pressing" | "Selected";
  type?: "Home" | "Invoice" | "Assigned to Me" | "Created by Me";
};

function Component1({ className, state = "Default", type = "Home" }: Component1Props) {
  const isDefaultAndAssignedToMe = state === "Default" && type === "Assigned to Me";
  const isDefaultAndCreatedByMe = state === "Default" && type === "Created by Me";
  return (
    <div className={className || "bg-[#edf0f3] content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] w-[47px]"} id={isDefaultAndCreatedByMe ? "node-7_43" : isDefaultAndAssignedToMe ? "node-7_31" : "node-7_7"}>
      {state === "Default" && type === "Home" && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/house" data-node-id="7:8">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideHouse} />
        </div>
      )}
      {isDefaultAndAssignedToMe && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/target" data-node-id="7:33">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideTarget} />
        </div>
      )}
      {isDefaultAndCreatedByMe && (
        <div className="relative shrink-0 size-[16px]" data-name="lucide/list-todo" data-node-id="7:44">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideListTodo} />
        </div>
      )}
    </div>
  );
}

export function WelcomeContinuumView() {
  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden pb-[8px] pl-[12px] pr-[8px] pt-[12px]"
      data-name="Welcome to Continuum"
      data-node-id="8:3495"
      style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2" data-node-id="8:3496">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]" data-node-id="8:3497">
          <div className="flex h-full min-h-0 w-[212px] shrink-0 flex-col items-start justify-between overflow-hidden z-[2]" data-node-id="8:3498">
            <div className="flex min-h-0 w-full flex-1 flex-col gap-[16px] items-start overflow-hidden" data-node-id="8:3499">
              <div className="content-stretch flex flex-col gap-[9.534px] items-center pb-[16px] pt-[32px] relative shrink-0 w-full" data-node-id="8:3501">
                <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="8:3503">
                  <p
                    className="relative shrink-0 text-center font-normal font-['Sarina',sans-serif] text-[26.219px] leading-[29.397px] tracking-[-0.5244px] whitespace-nowrap text-[#1A4659]"
                    data-node-id="8:3504"
                  >
                    Continuum
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-node-id="8:3506">
                <div className="bg-[#edf0f3] content-stretch flex gap-[8px] h-[40px] items-center px-[16px] py-[8px] relative rounded-[999px] shrink-0 w-full" data-name="Component 6" data-node-id="I8:3506;2172:35233">
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/search" data-node-id="I8:3506;2172:35234">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideSearch} />
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] text-center whitespace-nowrap" data-node-id="I8:3506;2172:35236">
                    Search Projects
                  </p>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I8:3506;2172:35237">
                  <div className="bg-[#edf0f3] content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 w-[47px]" data-name="Component 80" data-node-id="I8:3506;2172:35237;2172:35161">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/house" data-node-id="I8:3506;2172:35237;2172:35161;2172:35021">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideHouse} />
                    </div>
                  </div>
                  <div className="bg-[#edf0f3] content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 w-[47px]" data-name="Component 81" data-node-id="I8:3506;2172:35237;2172:35162">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/scroll-text" data-node-id="I8:3506;2172:35237;2172:35162;2172:35025">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideScrollText} />
                    </div>
                  </div>
                  <Component1 className="bg-[#edf0f3] content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 w-[47px]" type="Assigned to Me" />
                  <Component1 className="bg-[#edf0f3] content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[12px] relative rounded-[8px] shrink-0 w-[47px]" type="Created by Me" />
                </div>
              </div>
              <div className="content-stretch flex flex-col isolate items-start relative shrink-0 w-full" data-node-id="8:3507">
                <div className="content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full z-[5]" data-node-id="I8:3507;2172:27463">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I8:3507;2172:27464">
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="I8:3507;2172:27466">
                      Projects
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I8:3507;2172:27467">
                    <Component className="content-stretch flex flex-col items-start overflow-clip px-[2.667px] py-[7.333px] relative rounded-[4px] shrink-0 w-[16px]" type="Ellipse" />
                    <div className="overflow-clip relative rounded-[16px] shrink-0 size-[16px]" data-name="Component 35" data-node-id="I8:3507;2172:27469">
                      <div className="absolute inset-[20.83%]" data-name="Vector" data-node-id="I8:3507;2172:27469;2119:3014">
                        <div className="absolute inset-[-5.36%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector5} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[rgba(220,227,229,0.68)] content-stretch flex gap-[4px] h-[40px] items-center px-[12px] relative rounded-[8px] shrink-0 w-full z-[2]" data-name="Component 69" data-node-id="I8:3507;2172:27472">
                  <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px min-w-px relative" data-node-id="I8:3507;2172:27472;2172:25268">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-open-dot" data-node-id="I8:3507;2172:27472;2172:25271">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderOpenDot} />
                    </div>
                    <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic overflow-hidden relative text-[#0b191f] text-[14px] text-ellipsis whitespace-nowrap" data-node-id="I8:3507;2172:27472;2172:25273">
                      Welcome to Continuum!
                    </p>
                  </div>
                </div>
                <Link
                  to="/dashboard-placeholder"
                  className="content-stretch flex h-[40px] items-center pl-[24px] pr-[12px] relative rounded-[8px] shrink-0 w-full z-[1] text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                  data-name="Component 70"
                  data-node-id="I8:3507;2172:27567"
                >
                  <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px min-w-px relative" data-node-id="I8:3507;2172:27567;2172:27072">
                    <CornerDownRight className="overflow-clip relative shrink-0 size-[16px]" />
                    <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic overflow-hidden relative text-[#0b191f] text-[14px] text-ellipsis whitespace-nowrap" data-node-id="I8:3507;2172:27567;2172:27075">
                      Get started
                    </p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-[8px] items-start" data-node-id="8:3508">
              <div className="content-stretch flex gap-[12px] h-[40px] items-center opacity-0 px-[12px] relative rounded-[8px] shrink-0 w-full" data-name="Component 12" data-node-id="8:3509">
                <div className="relative shrink-0 size-[16px]" data-name="lucide/settings" data-node-id="8:3510">
                  <img alt="" className="absolute block max-w-none size-full" src={imgLucideSettings} />
                </div>
                <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="8:3512">
                  Settings
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-full" data-node-id="8:3513">
                <div className="absolute inset-[-0.5px_-0.24%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector6} />
                </div>
              </div>
              <div className="content-stretch flex h-[40px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-name="Component 13" data-node-id="8:3514">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3515">
                  <div className="bg-[#f17173] content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" data-name="Component 31" data-node-id="8:3516">
                    <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[9px] text-white whitespace-nowrap" data-node-id="I8:3516;2032:902">
                      <p className="leading-[0.4]">AS</p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] items-start justify-center leading-[normal] not-italic relative shrink-0 whitespace-nowrap" data-node-id="8:3517">
                    <p className="relative shrink-0 text-[#0b191f] text-[14px]" data-node-id="8:3518">
                      Amukelani Shiringani
                    </p>
                    <p className="relative shrink-0 text-[#727d83] text-[12px]" data-node-id="8:3519">
                      amushiringani@gmail.com
                    </p>
                  </div>
                </div>
                <div className="overflow-clip relative shrink-0 size-[16px]" data-name="lucide" data-node-id="8:3520">
                  <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector" data-node-id="I8:3520;2032:589">
                    <div className="absolute inset-[-16.67%_-8.33%]">
                      <img alt="" className="block max-w-none size-full" src={imgVector7} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col items-end gap-[16px] overflow-x-clip overflow-y-auto rounded-[8px] border border-[#ebedee] border-solid bg-white py-[16px] pl-[24px] pr-[16px] shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]" data-node-id="8:3521">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="8:3522">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3523">
                <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-open-dot" data-node-id="8:3524">
                  <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderOpenDot} />
                </div>
                <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] whitespace-nowrap" data-node-id="8:3526">
                  Welcome to Continuum!
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3530">
                <div className="bg-[#edf0f3] content-stretch flex gap-[12px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[999px] shrink-0" data-name="Component 7" data-node-id="8:3531">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3532">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/building-2" data-node-id="8:3533">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideBuilding2} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="8:3535">
                      Client name will appear here
                    </p>
                  </div>
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/x" data-node-id="8:3536">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideX} />
                  </div>
                </div>
                <div className="bg-white border border-[#ededed] border-solid content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0 w-[32px]" data-name="Component 5" data-node-id="8:3538">
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/bell" data-node-id="8:3539">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideBell} />
                  </div>
                </div>
                <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0" data-name="Component 9" data-node-id="8:3541">
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-cog" data-node-id="8:3542">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderCog} />
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="8:3544">
                    Edit
                  </p>
                </div>
                <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0" data-name="Component 6" data-node-id="8:3545">
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/share" data-node-id="8:3546">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideShare} />
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="8:3548">
                    Share
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] h-[32px] items-center justify-center pl-[16px] pr-[12px] py-[8px] relative rounded-[8px] shrink-0" data-name="Component 8" data-node-id="8:3549" style={{ backgroundImage: "linear-gradient(164.94079331184741deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
                  <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap" data-node-id="8:3550">
                    Export
                  </p>
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/chevron-down" data-node-id="8:3551">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideChevronDown} />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="8:3553">
              <div className="absolute inset-[-0.57px_0]">
                <img alt="" className="block max-w-none size-full" src={imgVector8} />
              </div>
            </div>
            <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col items-start" data-node-id="8:3554">
              <div className="content-stretch flex flex-col gap-[64px] items-center pb-[32px] pt-[48px] relative shrink-0 w-full" data-node-id="8:3555">
                <div className="h-[191px] relative shrink-0 w-full" data-node-id="8:3556">
                  <div className="-translate-x-1/2 absolute h-[175.151px] left-1/2 top-0 w-[350.302px]" data-node-id="8:3557">
                    <div className="absolute inset-[-4.85%_-2.43%]">
                      <img alt="" className="block max-w-none size-full" src={imgFrame273} />
                    </div>
                  </div>
                  <p className="absolute font-['Satoshi:Regular',sans-serif] leading-[normal] left-[calc(50%-24px)] not-italic overflow-hidden text-[#0b191f] text-[70.704px] text-ellipsis top-[49px] whitespace-nowrap" data-node-id="8:3560">
                    0
                  </p>
                  <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[calc(50%-86px)] not-italic overflow-hidden text-[#727d83] text-[24px] text-ellipsis top-[159px] whitespace-nowrap" data-node-id="8:3561">
                    Project on track
                  </p>
                </div>
                <WelcomeMetricsRow />
                <div className="content-stretch flex flex-col gap-[64px] items-start max-w-[815px] relative shrink-0 w-[815px]" data-node-id="8:3562">
                  <div className="content-stretch flex gap-[10px] h-[156px] items-start relative shrink-0 w-full" data-node-id="8:3563">
                    <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-h-px min-w-px relative self-stretch shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)]" data-node-id="8:3580">
                      <div className="bg-white border border-[#ededed] border-solid content-stretch flex flex-[1_0_0] h-full items-start min-h-px min-w-px p-[24px] relative rounded-[12px]" data-node-id="8:3581">
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-end min-h-px min-w-px relative" data-node-id="8:3582">
                          <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Component 7" data-node-id="8:3583">
                            <div className="relative shrink-0 size-[16px]" data-name="lucide/plus" data-node-id="8:3586">
                              <img alt="" className="absolute block max-w-none size-full" src={imgLucidePlus} />
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3588">
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3589">
                              <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[4px] items-start leading-[normal] not-italic relative shrink-0 w-full" data-node-id="8:3590">
                                <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-[16px] text-ellipsis whitespace-nowrap" data-node-id="8:3591">
                                  New sprint
                                </p>
                                <p className="min-w-full relative shrink-0 text-[#727d83] text-[14px] w-[min-content]" data-node-id="8:3592">
                                  Create new sprint
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-[#ededed] border-solid content-stretch flex flex-[1_0_0] h-full items-start min-h-px min-w-px p-[24px] relative rounded-[12px]" data-node-id="8:3593">
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-end min-h-px min-w-px relative" data-node-id="8:3594">
                          <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Component 7" data-node-id="8:3595">
                            <div className="relative shrink-0 size-[16px]" data-name="lucide/paperclip" data-node-id="8:3598">
                              <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3600">
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3601">
                              <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[4px] items-start not-italic relative shrink-0 w-full" data-node-id="8:3602">
                                <p className="leading-[normal] overflow-hidden relative shrink-0 text-[#0b191f] text-[16px] text-ellipsis whitespace-nowrap" data-node-id="8:3603">
                                  Drop files here
                                </p>
                                <p className="leading-[0] min-w-full relative shrink-0 text-[#727d83] text-[14px] w-[min-content]" data-node-id="8:3604">
                                  <span className="leading-[normal]">{`or `}</span>
                                  <span className="[text-decoration-skip-ink:none] decoration-solid leading-[normal] underline">browse your computer</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="8:3605">
                    <div className="content-stretch flex flex-col gap-[16px] h-[40px] items-start relative shrink-0 w-full" data-node-id="8:3606">
                      <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative w-full" data-node-id="8:3607">
                        <div className="content-stretch flex items-center relative shrink-0" data-node-id="8:3608">
                          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="8:3609">
                            <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-node-id="8:3610">
                              <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[24px] whitespace-nowrap" data-node-id="8:3611">
                                Sprints
                              </p>
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/info" data-node-id="8:3612">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideInfo} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="8:3650">
                      <div className="border border-[#ebedee] border-solid content-stretch flex items-start overflow-clip relative rounded-[12px] shrink-0 w-full" data-node-id="8:3651">
                        <div className="bg-white content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px p-[24px] relative" data-node-id="8:3652">
                          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-h-px min-w-px relative" data-node-id="8:3653">
                            <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Component 7" data-node-id="8:3654">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/circle-check-big" data-node-id="8:3657">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideCircleCheckBig} />
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3659">
                              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="8:3660">
                                <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[4px] items-start leading-[normal] not-italic relative shrink-0 w-full" data-node-id="8:3661">
                                  <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-[16px] text-ellipsis whitespace-nowrap" data-node-id="8:3662">
                                    Done
                                  </p>
                                  <p className="min-w-full relative shrink-0 text-[#727d83] text-[14px] w-[min-content]" data-node-id="8:3663">
                                    Short message goes here
                                  </p>
                                </div>
                                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3664">
                                  <div className="bg-[#e4eaec] h-[6px] overflow-clip relative rounded-[26px] shrink-0 w-full" data-node-id="8:3665">
                                    <div className="absolute bg-[#0b191f] left-0 rounded-[999px] size-[6px] top-0" data-node-id="8:3666" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-name="Divider" data-node-id="8:3667">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgDivider} />
                          </div>
                        </div>
                        <div className="bg-white content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px p-[24px] relative" data-node-id="8:3669">
                          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-h-px min-w-px relative" data-node-id="8:3670">
                            <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Component 7" data-node-id="8:3671">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/circle-dashed" data-node-id="8:3674">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideCircleDashed} />
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3676">
                              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="8:3677">
                                <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[4px] items-start leading-[normal] not-italic relative shrink-0 w-full" data-node-id="8:3678">
                                  <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-[16px] text-ellipsis whitespace-nowrap" data-node-id="8:3679">
                                    In progress
                                  </p>
                                  <p className="min-w-full relative shrink-0 text-[#727d83] text-[14px] w-[min-content]" data-node-id="8:3680">
                                    Short message goes here
                                  </p>
                                </div>
                                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3681">
                                  <div className="bg-[#e4eaec] h-[6px] overflow-clip relative rounded-[26px] shrink-0 w-full" data-node-id="8:3682">
                                    <div className="absolute bg-[#0b191f] left-[0.33px] rounded-[999px] size-[6px] top-0" data-node-id="8:3683" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-name="Divider" data-node-id="8:3684">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgDivider} />
                          </div>
                        </div>
                        <div className="bg-white content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px p-[24px] relative" data-node-id="8:3686">
                          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-h-px min-w-px relative" data-node-id="8:3687">
                            <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Component 7" data-node-id="8:3688">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/traffic-cone" data-node-id="8:3691">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideTrafficCone} />
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3693">
                              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="8:3694">
                                <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[4px] items-start leading-[normal] not-italic relative shrink-0 w-full" data-node-id="8:3695">
                                  <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-[16px] text-ellipsis whitespace-nowrap" data-node-id="8:3696">
                                    Blocked
                                  </p>
                                  <p className="min-w-full relative shrink-0 text-[#727d83] text-[14px] w-[min-content]" data-node-id="8:3697">
                                    Short message goes here
                                  </p>
                                </div>
                                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3698">
                                  <div className="bg-[#e4eaec] h-[6px] overflow-clip relative rounded-[26px] shrink-0 w-full" data-node-id="8:3699">
                                    <div className="absolute bg-[#0b191f] left-[-0.33px] rounded-[999px] size-[6px] top-0" data-node-id="8:3700" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="8:3717">
                    <div className="content-stretch flex flex-col gap-[16px] h-[40px] items-start justify-center relative shrink-0 w-full" data-node-id="8:3718">
                      <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative w-full" data-node-id="8:3719">
                        <div className="content-stretch flex items-center relative shrink-0" data-node-id="8:3720">
                          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="8:3721">
                            <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-node-id="8:3722">
                              <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[24px] whitespace-nowrap" data-node-id="8:3723">
                                Members
                              </p>
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/info" data-node-id="8:3724">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideInfo} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border border-[#ebedee] border-solid content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0" data-name="Component 2" data-node-id="8:3726" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(168.89065931200642deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)" }}>
                          <div className="relative shrink-0 size-[24px]" data-name="lucide/plus" data-node-id="8:3727">
                            <img alt="" className="absolute block max-w-none size-full" src={imgLucidePlus1} />
                          </div>
                          <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="8:3729">
                            Invite Members
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="8:3761">
                      <div className="bg-white border border-[#ebedee] border-solid content-stretch flex items-start p-[24px] relative rounded-[12px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-[260px]" data-node-id="8:3762">
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-h-px min-w-px relative" data-node-id="8:3763">
                          <div className="content-stretch flex h-[40px] items-center relative rounded-[8px] shrink-0 w-full" data-name="Component 13" data-node-id="8:3764">
                            <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3765">
                              <div className="bg-[#f17173] content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[35px]" data-name="Component 31" data-node-id="8:3766">
                                <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13.13px] text-white whitespace-nowrap" data-node-id="I8:3766;2032:902">
                                  <p className="leading-[0.4]">AS</p>
                                </div>
                              </div>
                              <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] items-start justify-center leading-[normal] not-italic relative shrink-0 whitespace-nowrap" data-node-id="8:3767">
                                <p className="relative shrink-0 text-[#0b191f] text-[14px]" data-node-id="8:3768">
                                  Amukelani Shiringani
                                </p>
                                <p className="relative shrink-0 text-[#727d83] text-[12px]" data-node-id="8:3769">
                                  Product Designer
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="8:3770">
                            <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[8px] items-start leading-[normal] not-italic relative shrink-0 text-[14px] w-full whitespace-nowrap" data-node-id="8:3771">
                              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="8:3772">
                                <p className="relative shrink-0 text-[#727d83]" data-node-id="8:3773">
                                  Total hours
                                </p>
                                <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-ellipsis w-[34px]" data-node-id="8:3774">
                                  0
                                </p>
                              </div>
                              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="8:3775">
                                <p className="relative shrink-0 text-[#727d83]" data-node-id="8:3776">
                                  Task completed
                                </p>
                                <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-ellipsis w-[34px]" data-node-id="8:3777">
                                  0
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
