import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";

import { useProject } from "@/api/hooks";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import {
  WelcomeRecentActivity,
  WelcomeRepo,
  WelcomeResources,
} from "../components/welcome/WelcomeActivityResourcesRepo";
import { WelcomeMilestoneTimeline } from "../components/welcome/WelcomeMilestoneTimeline";
import { WelcomeProjectHeroGauge } from "../components/welcome/WelcomeProjectHeroGauge";
import { WelcomeAiChatModal } from "../components/welcome/WelcomeAiChatModal";
import { WelcomeEmptyProjectBody } from "../components/welcome/WelcomeEmptyProjectBody";
import { WelcomeMetricsRow } from "../components/welcome/WelcomeMetricsRow";
import { WelcomeShareProjectModal } from "../components/welcome/WelcomeShareProjectModal";
import {
  DASHBOARD_WELCOME_PROJECT,
  isApiProjectId,
} from "../data/dashboardPlaceholderProjects";

const imgLucideFolderOpenDot = mcpAsset("565be4ed-fc29-4562-a26f-1c943a6d5847");
const imgLucideBuilding2 = mcpAsset("71a5ce6a-04cd-4e3a-bf8d-8982fbc63fe8");
const imgLucideX = mcpAsset("74ddb36d-7bc2-46ad-838d-6170796e1694");
const imgLucideBell = mcpAsset("0e2a64e9-ee3f-4ce3-aa60-05063accc712");
const imgLucideFolderCog = mcpAsset("5cad83cc-0f0b-48f5-9afd-c5124c0169e6");
const imgLucideShare = mcpAsset("00b88546-c39b-453e-aa9d-34f496edd586");
const imgLucideChevronDown = mcpAsset("72ab3ac0-aebf-4278-859f-4205108fb16c");
const imgVector8 = mcpAsset("1acc14a4-997e-4b19-b81a-91ef21ff09c2");
const imgLucidePlus = mcpAsset("a8bb95b4-2e9b-4e0d-861b-fa00d8582ce7");
const imgLucidePaperclip = mcpAsset("4f0c9d53-e72c-473e-981a-13f5b9320156");
const imgLucideInfo = mcpAsset("f597ed55-c78f-481a-a433-abcd6a07d507");
const imgLucideCircleCheckBig = mcpAsset("22239b8b-27ab-4973-ad00-4eaffd3f837b");
const imgLucideCircleDashed = mcpAsset("ccaffd7b-80ba-4413-ada6-9324ab249688");
const imgLucideTrafficCone = mcpAsset("df64d315-4479-4557-86ce-eebf48f8e6ec");
const imgLucidePlus1 = mcpAsset("1da1cc85-0c45-4470-a43f-e9a9f1a1e4f5");
const imgVector15 = mcpAsset("41d4c7e7-e987-4d3e-b39f-b0a8c1791b01");

export function WelcomeContinuumView() {
  const { projectId: routeProjectId } = useParams();
  const { pathname } = useLocation();
  const isWelcomeDemo =
    pathname === "/dashboard-placeholder/welcome" || pathname.startsWith("/dashboard-placeholder/welcome/");
  const isApiRoute =
    Boolean(routeProjectId && isApiProjectId(routeProjectId)) &&
    pathname.startsWith("/dashboard-placeholder/project/");
  const projectQuery = useProject(isApiRoute ? routeProjectId : undefined);

  const headerTitle = isWelcomeDemo
    ? DASHBOARD_WELCOME_PROJECT.name
    : projectQuery.data?.name ?? (projectQuery.isLoading ? "Loading…" : "Project");

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [shareProjectOpen, setShareProjectOpen] = useState(false);

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden pb-[8px] pl-[12px] pr-[8px] pt-[12px]"
      data-name="Welcome to Continuum"
      data-node-id="8:3495"
      style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2" data-node-id="8:3496">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]" data-node-id="8:3497">
          <DashboardLeftRail />
          <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col items-end gap-[16px] overflow-hidden rounded-[8px] border border-[#ebedee] border-solid bg-white py-[16px] pl-[24px] pr-[16px] shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]" data-node-id="8:3521">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="8:3522">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3523">
                <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-open-dot" data-node-id="8:3524">
                  <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderOpenDot} />
                </div>
                <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] whitespace-nowrap" data-node-id="8:3526">
                  {headerTitle}
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
            <div className="relative min-h-0 w-full min-w-0 flex-1 self-stretch overflow-x-clip overflow-y-auto">
            {isWelcomeDemo ? (
            <div className="relative flex w-full min-w-0 flex-col items-start" data-node-id="8:3554">
              <div className="content-stretch flex flex-col gap-[64px] items-center pb-[32px] pt-[48px] relative shrink-0 w-full" data-node-id="8:3555">
                <WelcomeProjectHeroGauge />
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
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="8:3606">
                      <div className="content-stretch flex w-full items-center justify-between" data-node-id="8:3607">
                        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic text-[#0b191f] text-[24px] whitespace-nowrap" data-node-id="8:3611">
                          Sprints
                        </p>
                        <button
                          type="button"
                          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                        >
                          Add
                          <img alt="" className="size-4" src={imgLucidePlus} />
                        </button>
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
                                <div className="flex w-full flex-col gap-1" data-node-id="8:3664">
                                  <div className="relative h-[6px] w-full shrink-0 overflow-clip rounded-[26px] bg-[#e4eaec]">
                                    <div className="absolute top-0 left-0 size-[6px] rounded-full bg-[#0b191f]" data-node-id="8:3666" />
                                  </div>
                                  <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-[15px] text-[#727d83]">+12% this sprint</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="mt-5 h-8 min-w-[112px] rounded-[8px] border border-solid border-[#ededed] bg-white px-4 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                              >
                                Review tasks
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="border-l border-solid border-[#ebedee] bg-white content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px p-[24px] relative" data-node-id="8:3669">
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
                                <div className="flex w-full flex-col gap-1" data-node-id="8:3681">
                                  <div className="relative h-[6px] w-full shrink-0 overflow-clip rounded-[26px] bg-[#e4eaec]">
                                    <div className="absolute top-0 left-[0.33px] size-[6px] rounded-full bg-[#0b191f]" data-node-id="8:3683" />
                                  </div>
                                  <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-[15px] text-[#727d83]">+12% this sprint</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="mt-5 h-8 min-w-[112px] rounded-[8px] border border-solid border-[#ededed] bg-white px-4 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                              >
                                Review tasks
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="border-l border-solid border-[#ebedee] bg-white content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px p-[24px] relative" data-node-id="8:3686">
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
                                <div className="flex w-full flex-col gap-1" data-node-id="8:3698">
                                  <div className="relative h-[6px] w-full shrink-0 overflow-clip rounded-[26px] bg-[#e4eaec]">
                                    <div className="absolute top-0 left-[-0.33px] size-[6px] rounded-full bg-[#0b191f]" data-node-id="8:3700" />
                                  </div>
                                  <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-[15px] text-[#727d83]">
                                    +5 more blocked is sprint
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="mt-5 h-8 min-w-[112px] rounded-[8px] border border-solid border-[#ededed] bg-white px-4 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                              >
                                Review tasks
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-16">
                    <WelcomeRecentActivity />
                    <WelcomeResources />
                    <WelcomeRepo />
                    <WelcomeMilestoneTimeline variant="demo" />
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
                        <button
                          type="button"
                          className="border border-[#ebedee] border-solid content-stretch flex cursor-pointer gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                          data-name="Component 2"
                          data-node-id="8:3726"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(168.89065931200642deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)",
                          }}
                          onClick={() => setShareProjectOpen(true)}
                        >
                          <div className="relative shrink-0 size-[24px]" data-name="lucide/plus" data-node-id="8:3727">
                            <img alt="" className="absolute block max-w-none size-full" src={imgLucidePlus1} />
                          </div>
                          <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="8:3729">
                            Invite Members
                          </p>
                        </button>
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
            ) : (
            <div className="relative flex w-full min-w-0 flex-col items-start px-1">
              {isApiRoute && projectQuery.isLoading && (
                <div className="flex min-h-[280px] w-full items-center justify-center font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
                  Loading project…
                </div>
              )}
              {isApiRoute && projectQuery.isError && (
                <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-4 px-4 text-center">
                  <p className="font-['Satoshi',sans-serif] text-[16px] text-[#0b191f]">We couldn’t load this project.</p>
                  <Link to="/dashboard-placeholder" className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#1466ff] underline">
                    Back to dashboard
                  </Link>
                </div>
              )}
              {isApiRoute && projectQuery.isSuccess && routeProjectId && (
                <WelcomeEmptyProjectBody
                  projectId={Number(routeProjectId)}
                  onOpenInviteMembers={() => setShareProjectOpen(true)}
                />
              )}
            </div>
            )}
            </div>
            <button
              type="button"
              className="absolute bottom-[14px] right-[14px] z-20 flex size-[48px] flex-col items-start isolate overflow-clip rounded-[48px] border border-solid border-[#edecea] bg-white shadow-[0px_10.32px_2.88px_0px_rgba(11,25,31,0),0px_6.6px_2.64px_0px_rgba(11,25,31,0.01),0px_3.72px_2.28px_0px_rgba(11,25,31,0.03),0px_1.68px_1.68px_0px_rgba(11,25,31,0.04),0px_0.36px_0.96px_0px_rgba(11,25,31,0.05)] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open AI assistant"
              data-node-id="8:3521-fab"
              onClick={() => setAiChatOpen(true)}
            >
              <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] top-[calc(50%+0.5px)] z-[3] flex items-center">
                <div className="relative size-[28px] shrink-0 overflow-clip">
                  <div className="absolute inset-[16.67%_8.33%]">
                    <div className="absolute inset-[-5.15%_-4.12%]">
                      <img alt="" className="block size-full max-w-none" src={imgVector15} />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <WelcomeAiChatModal open={aiChatOpen} onOpenChange={setAiChatOpen} />
      <WelcomeShareProjectModal open={shareProjectOpen} onOpenChange={setShareProjectOpen} />
    </div>
  );
}
