import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { CreateTaskModal } from "../components/CreateTaskModal";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";

const imgLucideListTodo = "https://www.figma.com/api/mcp/asset/2a12c1eb-b745-4bea-b9f1-f67045f8c03a";
const imgLucideTimer = "https://www.figma.com/api/mcp/asset/5b386900-0988-47bc-b5fd-da0ce6db2015";
const imgEllipse21 = "https://www.figma.com/api/mcp/asset/a0e3fea4-5911-470e-aa3e-64387b06a92f";
const imgEllipse23 = "https://www.figma.com/api/mcp/asset/2124fad3-f5ec-427e-8aff-5bda335eb761";
const imgEllipse22 = "https://www.figma.com/api/mcp/asset/a56dc45a-533f-4e63-bc8b-51b4d45b59a1";
const imgEllipse24 = "https://www.figma.com/api/mcp/asset/7ff4e012-4905-4a45-a625-9fc5dced43b4";
const imgEllipse25 = "https://www.figma.com/api/mcp/asset/5985192e-9166-4d87-a96f-61995d56f1f2";
const imgEllipse26 = "https://www.figma.com/api/mcp/asset/422f6266-5393-471e-8e01-384fc37ef619";
const imgFrame416 = "https://www.figma.com/api/mcp/asset/777201f6-1844-44c2-92cb-2546191dcf25";
const imgEllipse27 = "https://www.figma.com/api/mcp/asset/20a71caa-55f3-45e7-9fb8-ebfb602fe6dc";
const imgEllipse28 = "https://www.figma.com/api/mcp/asset/bdacad62-bbe1-4de2-b3e7-a4f9418fdd4c";
const imgEllipse29 = "https://www.figma.com/api/mcp/asset/710e523e-163a-4f70-9ad4-56391a61a3ac";
const imgLucideFolderOpenDot = "https://www.figma.com/api/mcp/asset/941ffd1f-d458-4dea-b5e5-49e021a96475";
const imgLucideChevronRight = "https://www.figma.com/api/mcp/asset/3c9be13d-56ac-42e3-a5bd-d538ded07d91";
const imgVector8 = "https://www.figma.com/api/mcp/asset/c091d350-44e5-4a58-bc3c-6f975b84b12a";
const imgLucideBell = "https://www.figma.com/api/mcp/asset/bff9ccf9-de26-47c4-bee7-385dad67d583";
const imgLucideFolderCog = "https://www.figma.com/api/mcp/asset/c887e8ab-eac8-49d0-a552-df4e52754a78";
const imgLucideShare = "https://www.figma.com/api/mcp/asset/6bac045f-4082-4943-bb21-c2b42ea3f721";
const imgVector9 = "https://www.figma.com/api/mcp/asset/10787a11-3019-4285-b605-c74442b6fd28";
const imgLucideEllipsis = "https://www.figma.com/api/mcp/asset/9baf5fcb-1676-4740-8a31-f190f218b100";
const imgLucideSquareKanban = "https://www.figma.com/api/mcp/asset/474af36e-77b4-44af-86ae-df298c677a75";
const imgLucideList = "https://www.figma.com/api/mcp/asset/bfa2c9b5-8c39-466a-adad-c4e6e7cf4a05";
const imgLucideSquareChartGantt = "https://www.figma.com/api/mcp/asset/30e802fb-d333-4025-88ef-ce25339a3318";
const imgLucideCalendar = "https://www.figma.com/api/mcp/asset/6b669401-0e47-41db-b963-8a02bb677ba9";
const imgEllipse12 = "https://www.figma.com/api/mcp/asset/68b61d8d-b4a5-465d-a7ce-940bfc1fe188";
const imgEllipse11 = "https://www.figma.com/api/mcp/asset/5f4a1f4f-65c5-43b7-a099-f7dbddb9c1c7";
const imgLucideUserRoundPlus = "https://www.figma.com/api/mcp/asset/1a1f6047-d8c5-462f-bc2a-1e5c4695e5f0";
const imgLucidePlus = "https://www.figma.com/api/mcp/asset/4d8a17c0-2d4e-466b-97d6-045bf4a51cd8";
const imgLucideSearch1 = "https://www.figma.com/api/mcp/asset/c5ee61c3-f628-42e7-b456-58f9c49a5cfe";
const imgVector10 = "https://www.figma.com/api/mcp/asset/0d58a9e0-9d27-4eb3-ad07-b2ad64a15f10";
const imgVector11 = "https://www.figma.com/api/mcp/asset/4912f83a-d378-4c38-9bf2-ce38aa20cc19";
const imgVector12 = "https://www.figma.com/api/mcp/asset/64e38728-fa1b-4a8c-97d3-cbb7f586a27c";
const imgLucideFlag = "https://www.figma.com/api/mcp/asset/299f17ae-de59-4012-9bb8-ae6509081405";
const imgVector13 = "https://www.figma.com/api/mcp/asset/c1ddd3b4-d26b-4a92-b752-d84ba0208f8a";
const imgFrame308 = "https://www.figma.com/api/mcp/asset/5b22b8e9-bd31-437e-a559-232247be56a0";
const imgVector14 = "https://www.figma.com/api/mcp/asset/a92d5710-b68e-4205-9b7a-c40338695c51";
const imgLucidePaperclip = "https://www.figma.com/api/mcp/asset/c4929b2e-a9fc-4fce-913e-ecf4dafe6944";
const imgLucideMessageCircle = "https://www.figma.com/api/mcp/asset/ff8c6057-7f55-46be-8899-4cb59d2eda1a";
const imgLucideSquircleDashed = "https://www.figma.com/api/mcp/asset/e2efeca9-31cd-4cf9-ac56-b2799ee8a450";
const imgLucideCircleCheckBig = "https://www.figma.com/api/mcp/asset/244bb570-3aed-481d-8cf9-f067c69c50b0";
const imgVector15 = "https://www.figma.com/api/mcp/asset/41d4c7e7-e987-4d3e-b39f-b0a8c1791b01";
const imgVector16 = "https://www.figma.com/api/mcp/asset/e5382ed0-7c62-4b1c-8956-100137a0d887";
const imgVector17 = "https://www.figma.com/api/mcp/asset/bbe03028-458c-482b-b79f-de194af6fcb4";
const imgVector18 = "https://www.figma.com/api/mcp/asset/46fd527c-70b1-4379-a8d4-7e2e7815734d";
const imgVector19 = "https://www.figma.com/api/mcp/asset/14a8de50-34e0-4b11-af87-5ea05963c40d";
const imgVector20 = "https://www.figma.com/api/mcp/asset/5f55c469-83d2-4f97-9cb9-f48196e0e890";
const imgVector21 = "https://www.figma.com/api/mcp/asset/b3719b5c-ed25-42db-a8fe-da0aeeceee0b";
const imgVector22 = "https://www.figma.com/api/mcp/asset/0a8e6b5c-95b8-4050-8755-f2787f342c6f";
type ComponentProps = {
  className?: string;
  profilePic?: "True" | "False" | "Add user";
};

function Component({ className, profilePic: _profilePic = "False" }: ComponentProps) {
  return (
    <div className={className || "bg-[#f17173] border border-solid border-white content-stretch flex items-center justify-center relative rounded-[999px] size-[24px]"} data-node-id="7:769">
      <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[9px] text-white whitespace-nowrap" data-node-id="7:770">
        <p className="leading-[0.4]">AS</p>
      </div>
    </div>
  );
}
type Component3Props = {
  className?: string;
  chevron?: "False";
  type?: "To-Do";
};

function Component3({ className, chevron: _chevron = "False", type: _type = "To-Do" }: Component3Props) {
  return (
    <div className={className || "content-stretch flex gap-[8px] items-center relative"} data-node-id="7:1027">
      <div className="relative shrink-0 size-[16px]" data-name="lucide/list-todo" data-node-id="7:1028">
        <img alt="" className="absolute block max-w-none size-full" src={imgLucideListTodo} />
      </div>
      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="7:1030">
        To-do
      </p>
    </div>
  );
}
type Component4Props = {
  className?: string;
  property1?: "Component 7" | "Component 8";
};

function Component4({ className, property1: _property1 = "Component 8" }: Component4Props) {
  return (
    <div className={className || "bg-[#d7fede] content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[999px]"} data-node-id="7:846">
      <div className="relative shrink-0 size-[16px]" data-name="lucide/timer" data-node-id="7:847">
        <img alt="" className="absolute block max-w-none size-full" src={imgLucideTimer} />
      </div>
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#108e27] text-[14px] whitespace-nowrap" data-node-id="7:849">
        Sprint on track
      </p>
      <div className="-translate-x-1/2 absolute bg-white border-[#ebedee] border-[0.824px] border-solid content-stretch flex items-start justify-between left-[calc(50%+0.5px)] opacity-0 px-[39.557px] py-[19.778px] rounded-[823.271px] shadow-[0px_41.205px_11.537px_0px_rgba(26,59,84,0),0px_26.371px_10.713px_0px_rgba(26,59,84,0.01),0px_14.834px_9.065px_0px_rgba(26,59,84,0.05),0px_6.593px_6.593px_0px_rgba(26,59,84,0.09),0px_1.648px_3.296px_0px_rgba(26,59,84,0.1)] top-[38.2px] w-[671.637px]" data-node-id="7:850">
        <div className="bg-white content-stretch flex items-start relative shrink-0" data-node-id="7:851">
          <div className="content-stretch flex gap-[19.778px] items-center relative shrink-0" data-node-id="7:852">
            <div className="h-[67.239px] relative shrink-0 w-[68.288px]" data-node-id="7:853">
              <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[calc(50%-19.42px)] not-italic overflow-hidden text-[#0b191f] text-[26.371px] text-ellipsis top-[14.83px] whitespace-nowrap" data-node-id="7:854">
                1.17
              </p>
              <div className="absolute h-[54.789px] left-0 top-0 w-[68.288px]" data-node-id="7:855">
                <div className="absolute inset-[-6.52%_-5.23%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse21} />
                </div>
              </div>
              <div className="absolute h-[50.985px] left-0 top-[3.8px] w-[18.466px]" data-node-id="7:856">
                <div className="absolute inset-[-7.01%_-19.35%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse23} />
                </div>
              </div>
              <div className="absolute left-[15.09px] size-[7.146px] top-0" data-node-id="7:857">
                <div className="absolute inset-[-44.44%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse22} />
                </div>
              </div>
              <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[9.78px] not-italic opacity-50 overflow-hidden text-[#0b191f] text-[9.889px] text-ellipsis top-[54.39px] whitespace-nowrap" data-node-id="7:858">
                0
              </p>
              <p className="-translate-x-full absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[57.81px] not-italic opacity-50 overflow-hidden text-[#0b191f] text-[9.889px] text-ellipsis text-right top-[54.39px] whitespace-nowrap" data-node-id="7:859">
                3
              </p>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="7:860">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-[100.54px]" data-node-id="7:861">
                <div className="content-stretch flex flex-col gap-[3.296px] items-start relative shrink-0 w-full" data-node-id="7:862">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#0b191f] text-[13.186px] text-ellipsis w-[100.54px] whitespace-nowrap" data-node-id="7:863">
                    Efficiency Rate
                  </p>
                  <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-node-id="7:864">
                    <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#727d83] text-[11.537px] tracking-[-0.1154px]" data-node-id="7:865">
                      Safe Zone
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex items-start relative shrink-0" data-node-id="7:866">
          <div className="content-stretch flex gap-[19.778px] items-center relative shrink-0" data-node-id="7:867">
            <div className="h-[67.239px] relative shrink-0 w-[68.288px]" data-node-id="7:868">
              <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[calc(50%-16.84px)] not-italic overflow-hidden text-[#0b191f] text-[26.371px] text-ellipsis top-[14.83px] whitespace-nowrap" data-node-id="7:869">
                46
              </p>
              <div className="absolute h-[54.789px] left-0 top-0 w-[68.288px]" data-node-id="7:870">
                <div className="absolute inset-[-6.52%_-5.23%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse24} />
                </div>
              </div>
              <div className="absolute h-[54.789px] left-0 top-0 w-[34.144px]" data-node-id="7:871">
                <div className="absolute inset-[-6.52%_-10.47%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse25} />
                </div>
              </div>
              <div className="absolute left-[30.49px] size-[7.146px] top-[-3.3px]" data-node-id="7:872">
                <div className="absolute inset-[-44.44%]">
                  <img alt="" className="block max-w-none size-full" src={imgEllipse22} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="7:873">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-[102px]" data-node-id="7:874">
                <div className="content-stretch flex flex-col gap-[3.296px] items-start relative shrink-0 w-full" data-node-id="7:875">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#0b191f] text-[13.186px] text-ellipsis whitespace-nowrap" data-node-id="7:876">
                    Tasks Completed
                  </p>
                  <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="7:877">
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[11.537px] tracking-[-0.1154px] whitespace-nowrap" data-node-id="7:878">
                      of 150 Total Points
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[13.186px] items-start relative shrink-0" data-node-id="7:879">
          <div className="h-[67.239px] relative shrink-0 w-[68.288px]" data-name="Component 145" data-node-id="7:880">
            <p className="-translate-x-1/2 absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[calc(50%-0.22px)] not-italic overflow-hidden text-[#0b191f] text-[26.371px] text-center text-ellipsis top-[14.83px] whitespace-nowrap" data-node-id="7:881">
              12
            </p>
            <div className="absolute left-[-3.3px] size-[74.169px] top-[-3.3px]" data-node-id="7:884">
              <div className="absolute inset-[37.56%_0_15.57%_79.82%]">
                <img alt="" className="block max-w-none size-full" src={imgEllipse26} />
              </div>
            </div>
            <div className="absolute left-[-3.3px] size-[74.169px] top-[-3.3px]" data-node-id="7:885">
              <img alt="" className="absolute block max-w-none size-full" src={imgFrame416} />
            </div>
            <div className="absolute left-[-3.3px] size-[74.169px] top-[-3.3px]" data-node-id="7:887">
              <div className="absolute inset-[3.03%_63.16%_15.57%_0]">
                <img alt="" className="block max-w-none size-full" src={imgEllipse27} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="7:888">
            <div className="content-stretch flex flex-col gap-[3.296px] items-start relative shrink-0" data-node-id="7:889">
              <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#0b191f] text-[13.186px] text-ellipsis whitespace-nowrap" data-node-id="7:890">
                Commits
              </p>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="7:891">
                <div className="content-stretch flex gap-[4.945px] items-center relative shrink-0" data-node-id="7:892">
                  <div className="relative shrink-0 size-[3.296px]" data-node-id="7:893">
                    <div className="absolute inset-[-44.44%]">
                      <img alt="" className="block max-w-none size-full" src={imgEllipse28} />
                    </div>
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#727d83] text-[11.537px] text-ellipsis whitespace-nowrap" data-node-id="7:894">
                    Shipped
                  </p>
                </div>
                <div className="content-stretch flex gap-[4.945px] items-center relative shrink-0" data-node-id="7:895">
                  <div className="relative shrink-0 size-[3.296px]" data-node-id="7:896">
                    <div className="absolute inset-[-44.44%]">
                      <img alt="" className="block max-w-none size-full" src={imgEllipse29} />
                    </div>
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#727d83] text-[11.537px] text-ellipsis whitespace-nowrap" data-node-id="7:897">
                    In Progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPlaceholder() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px]"
      data-name="Dashboard placeholder"
      data-node-id="7:2816"
      style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2" data-node-id="7:2817">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]" data-node-id="7:2818">
          <DashboardLeftRail />
          <div className="relative z-[1] isolate flex min-h-0 min-w-0 flex-1 flex-col items-end gap-[24px] overflow-x-clip overflow-y-auto rounded-[8px] border border-[#ebedee] border-solid bg-white py-[16px] pl-[24px] pr-[16px] shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]" data-node-id="7:2850">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full z-[3]" data-node-id="7:2851">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="7:2852">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2853">
                  <Link
                    to="/dashboard-placeholder/welcome"
                    className="content-stretch flex gap-[8px] items-center relative shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-open-dot" data-node-id="7:2854">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderOpenDot} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] whitespace-nowrap" data-node-id="7:2856">
                      Welcome to Continuum!
                    </p>
                  </Link>
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/chevron-right" data-node-id="7:2860">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideChevronRight} />
                  </div>
                  <Link
                    to="/dashboard-placeholder"
                    className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] whitespace-nowrap no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                    data-node-id="7:2862"
                  >
                    Get started
                  </Link>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2866">
                  <Component4 className="bg-[#d7fede] content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[999px] shrink-0" />
                  <div className="bg-[#f0f3f5] content-stretch flex gap-[2px] h-[32px] items-center p-[2px] relative rounded-[8px] shrink-0 w-[251px]" data-node-id="7:2868">
                    <div className="bg-white border border-[#ededed] border-solid content-stretch flex h-[36px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0" data-name="Component 2" data-node-id="7:2869">
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="7:2870">
                        Sprint
                      </p>
                    </div>
                    <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="Component 3" data-node-id="7:2871">
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] text-right whitespace-nowrap" data-node-id="7:2872">
                        Time logs
                      </p>
                    </div>
                    <div className="h-full relative shrink-0 w-0" data-node-id="7:2873">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgVector8} />
                      </div>
                    </div>
                    <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="Component 4" data-node-id="7:2874">
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="7:2875">
                        Activity
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-[#ededed] border-solid content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0 w-[32px]" data-name="Component 5" data-node-id="7:2876">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/bell" data-node-id="7:2877">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideBell} />
                    </div>
                  </div>
                  <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0" data-name="Component 6" data-node-id="7:2879">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-cog" data-node-id="7:2880">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderCog} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="7:2882">
                      Edit
                    </p>
                  </div>
                  <div className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0" data-name="Component 8" data-node-id="7:2883">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/share" data-node-id="7:2884">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideShare} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="7:2886">
                      Share
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full" data-node-id="7:2887">
                <div className="absolute inset-[-0.57px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgVector9} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full z-[2]" data-node-id="7:2888">
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="7:2889">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2890">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[24px] whitespace-nowrap" data-node-id="7:2891">
                    Get started
                  </p>
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2892">
                    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]" data-node-id="7:2897">
                      <div className="relative shrink-0 size-[16px]" data-name="lucide/ellipsis" data-node-id="7:2898">
                        <img alt="" className="absolute block max-w-none size-full" src={imgLucideEllipsis} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="7:2900">
                <div className="content-stretch flex gap-[8px] h-[40px] items-center relative rounded-[10px] shrink-0" data-name="Component 121" data-node-id="7:2901">
                  <div className="bg-[#cfecff] content-stretch flex gap-[8px] h-full items-center justify-center overflow-clip px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="Component 2" data-node-id="I7:2901;2444:24560">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/square-kanban" data-node-id="I7:2901;2444:24561">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideSquareKanban} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#043e59] text-[14px] whitespace-nowrap" data-node-id="I7:2901;2444:24563">
                      Board
                    </p>
                  </div>
                  <button className="bg-[#edf0f3] content-stretch cursor-pointer flex gap-[8px] h-full items-center justify-center overflow-clip px-[16px] py-[8px] relative rounded-[8px] shrink-0 w-[40px]" data-name="Component 3" data-node-id="I7:2901;2444:24564">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/list" data-node-id="I7:2901;2444:24565">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideList} />
                    </div>
                  </button>
                  <button className="bg-[#edf0f3] content-stretch cursor-pointer flex gap-[8px] h-full items-center justify-center overflow-clip px-[16px] py-[8px] relative rounded-[8px] shrink-0 w-[40px]" data-name="Component 5" data-node-id="I7:2901;2444:24568">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/square-chart-gantt" data-node-id="I7:2901;2444:24569">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideSquareChartGantt} />
                    </div>
                  </button>
                  <button className="bg-[#edf0f3] content-stretch cursor-pointer flex gap-[8px] h-full items-center justify-center overflow-clip px-[16px] py-[8px] relative rounded-[8px] shrink-0 w-[40px]" data-name="Component 4" data-node-id="I7:2901;2444:24572">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/calendar" data-node-id="I7:2901;2444:24573">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideCalendar} />
                    </div>
                  </button>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2902">
                  <div className="content-stretch flex items-center pr-[10.667px] relative shrink-0" data-name="Component 33" data-node-id="7:2903">
                    <div className="bg-[#f17173] border-[1.333px] border-solid border-white content-stretch flex items-center justify-center mr-[-10.667px] relative rounded-[999px] shrink-0 size-[32px]" data-name="Component 29" data-node-id="I7:2903;2032:932">
                      <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap" data-node-id="I7:2903;2032:932;2032:902">
                        <p className="leading-[0.4]">AS</p>
                      </div>
                    </div>
                    <div className="bg-[#e19c02] content-stretch flex gap-[5.714px] items-center mr-[-10.667px] p-[9.143px] relative rounded-[428.143px] shrink-0" data-name="Component 31" data-node-id="I7:2903;2032:931">
                      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[37.333px] top-1/2" data-node-id="I7:2903;2032:931;2469:49931">
                        <img alt="" className="absolute block max-w-none size-full" src={imgEllipse12} />
                      </div>
                      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[32px] top-1/2" data-node-id="I7:2903;2032:931;2469:49921">
                        <div className="absolute inset-[-2.08%]">
                          <img alt="" className="block max-w-none size-full" src={imgEllipse11} />
                        </div>
                      </div>
                      <div className="relative shrink-0 size-[13.714px]" data-name="lucide/user-round-plus" data-node-id="I7:2903;2032:931;2469:48877">
                        <img alt="" className="absolute block max-w-none size-full" src={imgLucideUserRoundPlus} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center self-stretch">
                    <div className="content-stretch flex gap-[8px] h-full items-center justify-center px-[16px] py-[10px] relative rounded-[8px] shrink-0" data-name="Component 4" data-node-id="7:2904" style={{ backgroundImage: "linear-gradient(165.24069544367063deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)" }}>
                      <div className="relative shrink-0 size-[16px]" data-name="lucide/plus" data-node-id="7:2905">
                        <img alt="" className="absolute block max-w-none size-full" src={imgLucidePlus} />
                      </div>
                      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap" data-node-id="7:2907">
                        Log Time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full z-[1]" data-node-id="7:2908">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px p-[16px] relative rounded-[16px]" data-node-id="7:2909" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)" }}>
                <div className="content-stretch flex flex-col gap-[16px] isolate items-start relative shrink-0 w-[365.333px]" data-name="Component 125" data-node-id="7:2910">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full z-[2]" data-node-id="I7:2910;2444:24776">
                    <Component3 className="content-stretch flex gap-[8px] items-center relative shrink-0" />
                    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I7:2910;2444:24781">
                      <button
                        type="button"
                        className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                        data-name="lucide/search"
                        data-node-id="I7:2910;2444:24782"
                      >
                        <img alt="" className="block size-full max-h-full max-w-full object-contain" src={imgLucideSearch1} />
                      </button>
                      <div className="content-stretch flex flex-col items-start overflow-clip px-[4px] py-[11px] relative rounded-[4px] shrink-0 w-[24px]" data-name="Component 35" data-node-id="I7:2910;2444:24784">
                        <div className="h-[2px] relative shrink-0 w-[16px]" data-name="Vector" data-node-id="I7:2910;2444:24784;2119:3012">
                          <div className="absolute inset-[-50%_-6.25%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector10} />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreateTaskOpen(true)}
                        className="content-stretch flex cursor-pointer items-center overflow-clip border-0 bg-transparent p-[5px] relative rounded-[6px] shrink-0"
                        data-name="Component 134"
                        data-node-id="I7:2910;2469:50013"
                        aria-label="Create task"
                      >
                        <div className="relative shrink-0 size-[14px]" data-name="Vector" data-node-id="I7:2910;2469:50013;2469:50004">
                          <div className="absolute inset-[-5.36%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector11} />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full" data-node-id="7:2911">
                  <div className="absolute inset-[-0.57px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgVector12} />
                  </div>
                </div>
                <div
                  className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full"
                  data-name="Component 118"
                  data-node-id="7:2912"
                  onClick={() => navigate("/dashboard-placeholder/task/1")}
                >
                  <div className="bg-white border border-[#ebedee] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full" data-name="Component 117" data-node-id="I7:2912;2437:23801">
                    <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative shrink-0 w-full" data-node-id="I7:2912;2437:23802">
                      <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I7:2912;2437:23803">
                        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2912;2437:23804">
                          <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2912;2437:23805">
                            <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[20px] tracking-[-0.2px]" data-node-id="I7:2912;2437:23806">
                              View project overview
                            </p>
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[27px]" data-node-id="I7:2912;2437:23807">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/flag" data-node-id="I7:2912;2437:23808">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-0 relative shrink-0 w-full" data-node-id="I7:2912;2437:23812">
                          <div className="absolute inset-[-0.57px_0]">
                            <img alt="" className="block max-w-none size-full" src={imgVector13} />
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2912;2437:23813">
                          <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] w-full" data-node-id="I7:2912;2437:23814">
                            To view the project status, select “Welcome to Continuum!” in the top left under the “Projects” label.
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2912;2437:23815">
                        <div className="content-stretch flex gap-[6px] h-[15px] isolate items-center justify-center relative shrink-0 w-full" data-node-id="I7:2912;2437:23819">
                          <div className="relative shrink-0 size-[12px] z-[2]" data-node-id="I7:2912;2437:23820">
                            <div className="absolute inset-[-33.33%]">
                              <img alt="" className="block max-w-none size-full" src={imgFrame308} />
                            </div>
                          </div>
                          <div className="flex-[1_0_0] h-0 min-h-px min-w-px relative z-[1]" data-node-id="I7:2912;2437:23823">
                            <div className="absolute inset-[-2.5px_-0.84%]">
                              <img alt="" className="block max-w-none size-full" src={imgVector14} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I7:2912;2437:23824">
                        <div className="content-stretch flex items-center relative shrink-0" data-name="Component 33" data-node-id="I7:2912;2437:23825">
                          <Component className="bg-[#f17173] border border-solid border-white content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" />
                        </div>
                        <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0" data-node-id="I7:2912;2437:23826">
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2912;2437:23827">
                            <div className="relative shrink-0 size-[16px]" data-name="lucide/paperclip" data-node-id="I7:2912;2437:23828">
                              <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2912;2437:23830">
                              1
                            </p>
                          </div>
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2912;2437:23831">
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]" data-node-id="I7:2912;2437:23832">
                              <div className="relative shrink-0 size-[13.33px]" data-name="lucide/message-circle" data-node-id="I7:2912;2437:23833">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
                              </div>
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2912;2437:23835">
                              1
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full"
                  data-name="Component 127"
                  data-node-id="7:2913"
                  onClick={() => navigate("/dashboard-placeholder/task/2")}
                >
                  <div className="bg-white border border-[#ebedee] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full" data-name="Component 117" data-node-id="I7:2913;2437:23801">
                    <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative shrink-0 w-full" data-node-id="I7:2913;2437:23802">
                      <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I7:2913;2437:23803">
                        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2913;2437:23804">
                          <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2913;2437:23805">
                            <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[20px] tracking-[-0.2px]" data-node-id="I7:2913;2437:23806">
                              Add a new task
                            </p>
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[27px]" data-node-id="I7:2913;2437:23807">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/flag" data-node-id="I7:2913;2437:23808">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-0 relative shrink-0 w-full" data-node-id="I7:2913;2437:23812">
                          <div className="absolute inset-[-0.57px_0]">
                            <img alt="" className="block max-w-none size-full" src={imgVector13} />
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2913;2437:23813">
                          <div className="font-['Satoshi:Medium',sans-serif] leading-[0] not-italic relative shrink-0 text-[#606d76] text-[16px] w-full whitespace-pre-wrap" data-node-id="I7:2913;2437:23814">
                            <p className="leading-[normal] mb-0">{`To find, organise, and add a new task, use the “+” icon in the top right corner of `}</p>
                            <p className="leading-[normal]">To-Do.</p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2913;2437:23815">
                        <div className="content-stretch flex gap-[6px] h-[15px] isolate items-center justify-center relative shrink-0 w-full" data-node-id="I7:2913;2437:23819">
                          <div className="relative shrink-0 size-[12px] z-[2]" data-node-id="I7:2913;2437:23820">
                            <div className="absolute inset-[-33.33%]">
                              <img alt="" className="block max-w-none size-full" src={imgFrame308} />
                            </div>
                          </div>
                          <div className="flex-[1_0_0] h-0 min-h-px min-w-px relative z-[1]" data-node-id="I7:2913;2437:23823">
                            <div className="absolute inset-[-2.5px_-0.84%]">
                              <img alt="" className="block max-w-none size-full" src={imgVector14} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I7:2913;2437:23824">
                        <div className="content-stretch flex items-center relative shrink-0" data-name="Component 33" data-node-id="I7:2913;2437:23825">
                          <Component className="bg-[#f17173] border border-solid border-white content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" />
                        </div>
                        <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0" data-node-id="I7:2913;2437:23826">
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2913;2437:23827">
                            <div className="relative shrink-0 size-[16px]" data-name="lucide/paperclip" data-node-id="I7:2913;2437:23828">
                              <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2913;2437:23830">
                              1
                            </p>
                          </div>
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2913;2437:23831">
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]" data-node-id="I7:2913;2437:23832">
                              <div className="relative shrink-0 size-[13.33px]" data-name="lucide/message-circle" data-node-id="I7:2913;2437:23833">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
                              </div>
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2913;2437:23835">
                              1
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full"
                  data-name="Component 126"
                  data-node-id="7:2914"
                  onClick={() => navigate("/dashboard-placeholder/task/3")}
                >
                  <div className="bg-white border border-[#ebedee] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full" data-name="Component 117" data-node-id="I7:2914;2437:23801">
                    <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative shrink-0 w-full" data-node-id="I7:2914;2437:23802">
                      <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I7:2914;2437:23803">
                        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2914;2437:23804">
                          <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2914;2437:23805">
                            <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[20px] tracking-[-0.2px]" data-node-id="I7:2914;2437:23806">
                              Add a new project
                            </p>
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[27px]" data-node-id="I7:2914;2437:23807">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/flag" data-node-id="I7:2914;2437:23808">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-0 relative shrink-0 w-full" data-node-id="I7:2914;2437:23812">
                          <div className="absolute inset-[-0.57px_0]">
                            <img alt="" className="block max-w-none size-full" src={imgVector13} />
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2914;2437:23813">
                          <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] w-full" data-node-id="I7:2914;2437:23814">
                            Find, organise, and add a new project using the sidebar to the left.
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2914;2437:23815">
                        <div className="content-stretch flex gap-[6px] h-[15px] isolate items-center justify-center relative shrink-0 w-full" data-node-id="I7:2914;2437:23819">
                          <div className="relative shrink-0 size-[12px] z-[2]" data-node-id="I7:2914;2437:23820">
                            <div className="absolute inset-[-33.33%]">
                              <img alt="" className="block max-w-none size-full" src={imgFrame308} />
                            </div>
                          </div>
                          <div className="flex-[1_0_0] h-0 min-h-px min-w-px relative z-[1]" data-node-id="I7:2914;2437:23823">
                            <div className="absolute inset-[-2.5px_-0.84%]">
                              <img alt="" className="block max-w-none size-full" src={imgVector14} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I7:2914;2437:23824">
                        <div className="content-stretch flex items-center relative shrink-0" data-name="Component 33" data-node-id="I7:2914;2437:23825">
                          <Component className="bg-[#f17173] border border-solid border-white content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" />
                        </div>
                        <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0" data-node-id="I7:2914;2437:23826">
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2914;2437:23827">
                            <div className="relative shrink-0 size-[16px]" data-name="lucide/paperclip" data-node-id="I7:2914;2437:23828">
                              <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2914;2437:23830">
                              1
                            </p>
                          </div>
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2914;2437:23831">
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]" data-node-id="I7:2914;2437:23832">
                              <div className="relative shrink-0 size-[13.33px]" data-name="lucide/message-circle" data-node-id="I7:2914;2437:23833">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
                              </div>
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2914;2437:23835">
                              1
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px p-[16px] relative rounded-[16px]" data-node-id="7:2915" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)" }}>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="7:2916">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2917">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/squircle-dashed" data-node-id="7:2919">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideSquircleDashed} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="7:2921">
                      In-Progress
                    </p>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="7:2922">
                    <div className="content-stretch flex flex-col items-start overflow-clip px-[4px] py-[11px] relative rounded-[4px] shrink-0 w-[24px]" data-name="Component 35" data-node-id="7:2923">
                      <div className="h-[2px] relative shrink-0 w-[16px]" data-name="Vector" data-node-id="I7:2923;2119:3012">
                        <div className="absolute inset-[-50%_-6.25%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector10} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px p-[16px] relative rounded-[16px]" data-node-id="7:2925" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)" }}>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="7:2926">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2927">
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/circle-check-big" data-node-id="7:2929">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideCircleCheckBig} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="7:2931">
                      Completed
                    </p>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="7:2932">
                    <div className="content-stretch flex flex-col items-start overflow-clip px-[4px] py-[11px] relative rounded-[4px] shrink-0 w-[24px]" data-name="Component 35" data-node-id="7:2933">
                      <div className="h-[2px] relative shrink-0 w-[16px]" data-name="Vector" data-node-id="I7:2933;2119:3012">
                        <div className="absolute inset-[-50%_-6.25%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector10} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full"
                  data-name="Component 118"
                  data-node-id="7:2935"
                  onClick={() => navigate("/dashboard-placeholder/task/4")}
                >
                  <div className="bg-white border border-[#ebedee] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full" data-name="Component 117" data-node-id="I7:2935;2437:23801">
                    <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative shrink-0 w-full" data-node-id="I7:2935;2437:23802">
                      <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I7:2935;2437:23803">
                        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2935;2437:23804">
                          <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full" data-node-id="I7:2935;2437:23805">
                            <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[20px] tracking-[-0.2px]" data-node-id="I7:2935;2437:23806">
                              Create an account with Continuum
                            </p>
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[27px]" data-node-id="I7:2935;2437:23807">
                              <div className="relative shrink-0 size-[16px]" data-name="lucide/flag" data-node-id="I7:2935;2437:23808">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I7:2935;2437:23815">
                        <div className="content-stretch flex gap-[6px] h-[15px] isolate items-center justify-center relative shrink-0 w-full" data-node-id="I7:2935;2437:23819">
                          <div className="relative shrink-0 size-[12px] z-[2]" data-node-id="I7:2935;2437:23820">
                            <div className="absolute inset-[-33.33%]">
                              <img alt="" className="block max-w-none size-full" src={imgFrame308} />
                            </div>
                          </div>
                          <div className="flex-[1_0_0] h-0 min-h-px min-w-px relative z-[1]" data-node-id="I7:2935;2437:23823">
                            <div className="absolute inset-[-2.5px_-0.84%]">
                              <img alt="" className="block max-w-none size-full" src={imgVector14} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I7:2935;2437:23824">
                        <div className="content-stretch flex items-center relative shrink-0" data-name="Component 33" data-node-id="I7:2935;2437:23825">
                          <Component className="bg-[#f17173] border border-solid border-white content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" />
                        </div>
                        <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0" data-node-id="I7:2935;2437:23826">
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center opacity-0 px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2935;2437:23827">
                            <div className="relative shrink-0 size-[16px]" data-name="lucide/paperclip" data-node-id="I7:2935;2437:23828">
                              <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2935;2437:23830">
                              5
                            </p>
                          </div>
                          <div className="bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center opacity-0 px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0" data-node-id="I7:2935;2437:23831">
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]" data-node-id="I7:2935;2437:23832">
                              <div className="relative shrink-0 size-[13.33px]" data-name="lucide/message-circle" data-node-id="I7:2935;2437:23833">
                                <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
                              </div>
                            </div>
                            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap" data-node-id="I7:2935;2437:23835">
                              3
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
        <div className="absolute border border-[#edecea] border-solid bottom-[14px] content-stretch flex flex-col isolate items-start overflow-clip right-[14px] rounded-[48px] shadow-[0px_10.32px_2.88px_0px_rgba(11,25,31,0),0px_6.6px_2.64px_0px_rgba(11,25,31,0.01),0px_3.72px_2.28px_0px_rgba(11,25,31,0.03),0px_1.68px_1.68px_0px_rgba(11,25,31,0.04),0px_0.36px_0.96px_0px_rgba(11,25,31,0.05)] size-[48px]" data-node-id="7:2936">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center left-[calc(50%+0.5px)] top-[calc(50%+0.5px)] z-[3]" data-node-id="I7:2936;3646:40266">
            <div className="overflow-clip relative shrink-0 size-[28px]" data-name="Frame 453/bot" data-node-id="I7:2936;3646:40267">
              <div className="absolute inset-[16.67%_8.33%]" data-name="Vector" data-node-id="I7:2936;3646:40267;3392:54498">
                <div className="absolute inset-[-5.15%_-4.12%]">
                  <img alt="" className="block max-w-none size-full" src={imgVector15} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex items-center justify-between pl-[0.96px] pr-[1.92px] py-[0.96px] relative shrink-0 w-[48.4px] z-[2]" data-node-id="I7:2936;3646:40268">
            <div className="content-stretch flex gap-[0.96px] items-center opacity-0 px-[0.96px] py-[0.48px] relative rounded-[40px] shrink-0" data-name="Component 155" data-node-id="I7:2936;3646:40268;3404:19479">
              <div className="content-stretch flex items-center relative shrink-0" data-node-id="I7:2936;3646:40268;3404:19479;3404:19418">
                <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#151515] text-[1.68px] text-ellipsis whitespace-nowrap" data-node-id="I7:2936;3646:40268;3404:19479;3404:19419">
                  New AI chat
                </p>
              </div>
              <div className="flex items-center justify-center relative shrink-0 size-[1.92px]">
                <div className="flex-none rotate-90">
                  <div className="overflow-clip relative size-[1.92px]" data-name="chevron-right" data-node-id="I7:2936;3646:40268;3404:19479;3404:19420">
                    <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector" data-node-id="I7:2936;3646:40268;3404:19479;3404:19420;2219:35084">
                      <div className="absolute inset-[-8.33%_-16.67%]">
                        <img alt="" className="block max-w-none size-full" src={imgVector16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bg-white border-[#edecea] border-[0.09px] border-solid content-stretch flex flex-col items-start left-0 opacity-0 p-[0.72px] rounded-[6px] shadow-[0px_7.74px_2.16px_0px_rgba(11,25,31,0),0px_4.95px_1.98px_0px_rgba(11,25,31,0.01),0px_2.79px_1.71px_0px_rgba(11,25,31,0.03),0px_1.26px_1.26px_0px_rgba(11,25,31,0.04),0px_0.27px_0.72px_0px_rgba(11,25,31,0.05)] top-[3.84px] w-[21.24px]" data-node-id="I7:2936;3646:40268;3404:19479;3404:19723">
                <div className="content-stretch flex items-start p-[0.72px] relative shrink-0 w-full" data-node-id="I7:2936;3646:40268;3404:19479;3404:19724">
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[0.99px] text-center whitespace-nowrap" data-node-id="I7:2936;3646:40268;3404:19479;3404:19725">
                    Previous 7 days
                  </p>
                </div>
                <div className="content-stretch flex items-center px-[0.72px] py-[0.54px] relative rounded-[8px] shrink-0 w-[19.8px]" data-name="List Label" data-node-id="I7:2936;3646:40268;3404:19479;3404:19726">
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="I7:2936;3646:40268;3404:19479;3404:19726;3404:19654">
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#606d76] text-[1.44px] text-ellipsis whitespace-nowrap" data-node-id="I7:2936;3646:40268;3404:19479;3404:19726;3404:19655">
                      How is the project going?
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[0.72px] py-[0.54px] relative rounded-[8px] shrink-0 w-[19.8px]" data-name="List Label" data-node-id="I7:2936;3646:40268;3404:19479;3404:19727">
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="I7:2936;3646:40268;3404:19479;3404:19727;3404:19654">
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#606d76] text-[1.44px] text-ellipsis whitespace-nowrap" data-node-id="I7:2936;3646:40268;3404:19479;3404:19727;3404:19655">
                      Is the project data reliable?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[0.48px] items-center opacity-0 relative shrink-0" data-node-id="I7:2936;3646:40268;3404:19228">
              <div className="bg-white content-stretch flex items-center justify-center relative rounded-[24px] shrink-0 size-[2.88px]" data-name="Component 153" data-node-id="I7:2936;3646:40268;3404:19214">
                <div className="overflow-clip relative shrink-0 size-[1.92px]" data-name="Frame 453/square-pen" data-node-id="I7:2936;3646:40268;3404:19214;3404:19176">
                  <div className="absolute inset-[8.35%_8.35%_12.5%_12.5%]" data-name="Vector" data-node-id="I7:2936;3646:40268;3404:19214;3404:19176;3387:36755">
                    <div className="absolute inset-[-3.95%]">
                      <img alt="" className="block max-w-none size-full" src={imgVector17} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-center relative rounded-[24px] shrink-0 size-[2.88px]" data-name="Component 154" data-node-id="I7:2936;3646:40268;3404:19223">
                <div className="overflow-clip relative shrink-0 size-[1.92px]" data-name="Frame 453/minus" data-node-id="I7:2936;3646:40268;3404:19223;3404:19176">
                  <div className="absolute bottom-1/2 left-[20.83%] right-[20.83%] top-1/2" data-name="Vector" data-node-id="I7:2936;3646:40268;3404:19223;3404:19176;3387:36761">
                    <div className="absolute inset-[-0.09px_-8.04%]">
                      <img alt="" className="block max-w-none size-full" src={imgVector18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[4.08px] h-[59.76px] items-start relative shrink-0 w-full z-[1]" data-node-id="I7:2936;3646:40269">
            <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[1.92px] items-start min-h-px min-w-px overflow-x-clip overflow-y-auto pb-[137px] pt-[5.76px] px-[1.92px] relative w-[48px]" data-node-id="I7:2936;3646:40270">
              <div className="content-stretch flex flex-col gap-[1.8px] items-start opacity-0 relative shrink-0 w-full" data-node-id="I7:2936;3646:40270;3404:18727">
                <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I7:2936;3646:40270;3404:18730">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[1.89px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18731">
                    How can I help you today?
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[0.96px] items-start opacity-0 relative shrink-0 w-full" data-node-id="I7:2936;3646:40270;3404:18732">
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 6" data-node-id="I7:2936;3646:40270;3404:18733">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18734">
                    How is the project going?
                  </p>
                </div>
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 7" data-node-id="I7:2936;3646:40270;3404:18735">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18736">
                    Is the project data reliable?
                  </p>
                </div>
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 8" data-node-id="I7:2936;3646:40270;3404:18737">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18738">
                    What is blocking progress
                  </p>
                </div>
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 9" data-node-id="I7:2936;3646:40270;3404:18739">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18740">
                    Are there any health risks?
                  </p>
                </div>
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 10" data-node-id="I7:2936;3646:40270;3404:18741">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18742">
                    Show recent key updates
                  </p>
                </div>
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 11" data-node-id="I7:2936;3646:40270;3404:18743">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18744">
                    How is our current velocity?
                  </p>
                </div>
                <div className="bg-white border-[#ededed] border-[0.12px] border-solid content-stretch flex h-[3.84px] items-center justify-center px-[1.92px] py-[0.96px] relative rounded-[32px] shrink-0" data-name="Component 12" data-node-id="I7:2936;3646:40270;3404:18745">
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] whitespace-nowrap" data-node-id="I7:2936;3646:40270;3404:18746">
                    Is the timeline on track?
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bg-gradient-to-b bottom-[-120.64px] content-stretch flex flex-col from-[rgba(255,255,255,0)] items-center left-0 opacity-0 pb-[3.24px] px-[1.92px] to-[25.182%] to-white w-[47.4px]" data-node-id="I7:2936;3646:40271">
              <div className="bg-[#e7f2fc] content-stretch flex items-center justify-center mb-[-1.32px] pb-[2.52px] pt-[1.2px] px-[1.2px] relative rounded-tl-[1.68px] rounded-tr-[1.68px] shrink-0 w-full" data-node-id="I7:2936;3646:40271;3404:18748">
                <div className="content-stretch flex gap-[0.96px] items-center relative shrink-0 w-[41.52px]" data-node-id="I7:2936;3646:40271;3404:18749">
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="I7:2936;3646:40271;3404:18750">
                    <div className="overflow-clip relative shrink-0 size-[1.56px]" data-name="Frame 453/bot" data-node-id="I7:2936;3646:40271;3404:18751">
                      <div className="absolute inset-[16.67%_8.33%]" data-name="Vector" data-node-id="I7:2936;3646:40271;3404:18751;3392:54498">
                        <div className="absolute inset-[-3.13%_-2.5%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector19} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#727d83] text-[1.32px] text-center whitespace-nowrap" data-node-id="I7:2936;3646:40271;3404:18752">
                    <span className="leading-[normal]">{`The AI is restricted to reporting on system states. `}</span>
                    <span className="leading-[normal] text-[#2e96f9]">Learn more</span>
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#edecea] border-[0.12px] border-solid content-stretch flex flex-col h-[10.56px] items-start justify-between mb-[-1.32px] pb-[0.84px] pt-[1.32px] relative rounded-[14px] shadow-[0px_0.6px_0.12px_0px_rgba(14,14,34,0),0px_0.36px_0.12px_0px_rgba(14,14,34,0.01),0px_0.24px_0.12px_0px_rgba(14,14,34,0.02),0px_0.12px_0.12px_0px_rgba(14,14,34,0.03)] shrink-0 w-full" data-node-id="I7:2936;3646:40271;3404:18753">
                <div className="content-stretch flex items-center justify-center px-[1.56px] relative shrink-0 w-full" data-node-id="I7:2936;3646:40271;3404:18754">
                  <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic opacity-50 relative text-[#727d83] text-[1.56px] tracking-[-0.0156px]" data-node-id="I7:2936;3646:40271;3404:18755">
                    Do anything with AI...
                  </p>
                </div>
                <div className="content-stretch flex items-center justify-between px-[1.32px] relative shrink-0 w-full" data-node-id="I7:2936;3646:40271;3404:18756">
                  <div className="content-stretch flex gap-[0.84px] items-center relative shrink-0" data-node-id="I7:2936;3646:40271;3404:18757">
                    <div className="overflow-clip relative shrink-0 size-[2.16px]" data-name="Frame 453/lucide/plus" data-node-id="I7:2936;3646:40271;3404:18758">
                      <div className="absolute inset-[20.83%]" data-name="Vector" data-node-id="I7:2936;3646:40271;3404:18758;3386:36699">
                        <div className="absolute inset-[-4.76%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector20} />
                        </div>
                      </div>
                    </div>
                    <div className="overflow-clip relative shrink-0 size-[2.16px]" data-name="Frame 453/settings-2" data-node-id="I7:2936;3646:40271;3404:18759">
                      <div className="absolute inset-[16.67%]" data-name="Vector" data-node-id="I7:2936;3646:40271;3404:18759;3386:36709">
                        <div className="absolute inset-[-4.17%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector21} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[1.2px] items-center relative shrink-0" data-node-id="I7:2936;3646:40271;3404:18760">
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#727d83] text-[1.56px] tracking-[-0.0156px] whitespace-nowrap" data-node-id="I7:2936;3646:40271;3404:18761">
                      Auto
                    </p>
                    <div className="bg-[#f9f9f8] content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[3.12px]" data-node-id="I7:2936;3646:40271;3404:18762">
                      <div className="opacity-20 overflow-clip relative shrink-0 size-[2.16px]" data-name="Frame 453/arrow-up" data-node-id="I7:2936;3646:40271;3404:18763">
                        <div className="absolute inset-[20.83%]" data-name="Vector" data-node-id="I7:2936;3646:40271;3404:18763;3386:36723">
                          <div className="absolute inset-[-9.52%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector22} />
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
      <CreateTaskModal open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
    </div>
  );
}
