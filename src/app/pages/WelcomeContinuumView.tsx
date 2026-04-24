import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";

import { useProject, useProjectMembers } from "@/api/hooks";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { DiscordIntegrationModal } from "../components/dashboard-placeholder/DiscordIntegrationModal";
import { EditProjectModal } from "../components/dashboard-placeholder/EditProjectModal";
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
import { WORKSPACE_BASE, workspaceJoin } from "@/lib/workspacePaths";

const imgLucideFolderOpenDot = mcpAsset("565be4ed-fc29-4562-a26f-1c943a6d5847");
const imgLucideBuilding2 = mcpAsset("71a5ce6a-04cd-4e3a-bf8d-8982fbc63fe8");
const imgLucideX = mcpAsset("74ddb36d-7bc2-46ad-838d-6170796e1694");
const imgLucideBell = mcpAsset("0e2a64e9-ee3f-4ce3-aa60-05063accc712");
const imgLucideFolderCog = mcpAsset("5cad83cc-0f0b-48f5-9afd-c5124c0169e6");
const imgLucideShare = mcpAsset("00b88546-c39b-453e-aa9d-34f496edd586");
const imgLucideChevronDown = mcpAsset("72ab3ac0-aebf-4278-859f-4205108fb16c");
const imgVector8 = mcpAsset("1acc14a4-997e-4b19-b81a-91ef21ff09c2");
const imgLucideInfo = mcpAsset("f597ed55-c78f-481a-a433-abcd6a07d507");
const imgLucidePlus1 = mcpAsset("1da1cc85-0c45-4470-a43f-e9a9f1a1e4f5");
const imgVector15 = mcpAsset("41d4c7e7-e987-4d3e-b39f-b0a8c1791b01");

export function WelcomeContinuumView() {
  const { projectId: routeProjectId } = useParams();
  const { pathname } = useLocation();
  const welcomePath = workspaceJoin("welcome");
  const isWelcomeDemo = pathname === welcomePath || pathname.startsWith(`${welcomePath}/`);
  const isApiRoute =
    Boolean(routeProjectId && isApiProjectId(routeProjectId)) &&
    pathname.startsWith(`${WORKSPACE_BASE}/project/`);
  const projectQuery = useProject(isApiRoute ? routeProjectId : undefined);
  const membersQuery = useProjectMembers(isApiRoute ? routeProjectId : undefined);

  const clientPillLabel = (() => {
    if (!isApiRoute) return "Client name will appear here";
    const clients = (membersQuery.data ?? []).filter((m) => {
      const k = (m.role || "").toLowerCase().replace(/\s+/g, "_");
      return k === "client";
    });
    if (clients.length === 0) return "Client name will appear here";
    return clients
      .map((c) => c.name.trim())
      .filter(Boolean)
      .join(", ");
  })();

  const headerTitle = isWelcomeDemo
    ? DASHBOARD_WELCOME_PROJECT.name
    : projectQuery.data?.name ?? (projectQuery.isLoading ? "Loading…" : "Project");

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [shareProjectOpen, setShareProjectOpen] = useState(false);
  const [discordIntegrationOpen, setDiscordIntegrationOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const canEditProject =
    isApiRoute &&
    routeProjectId &&
    isApiProjectId(routeProjectId) &&
    projectQuery.isSuccess &&
    projectQuery.data != null;

  const apiProjectIdForDiscord =
    isApiRoute && routeProjectId && isApiProjectId(routeProjectId)
      ? Number(routeProjectId)
      : undefined;

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
                    <p
                      className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative max-w-[min(280px,40vw)] shrink truncate text-[#606d76] text-[14px]"
                      title={clientPillLabel}
                      data-node-id="8:3535"
                    >
                      {clientPillLabel}
                    </p>
                  </div>
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/x" data-node-id="8:3536">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideX} />
                  </div>
                </div>
                <button
                  type="button"
                  className="bg-white border border-[#ededed] border-solid content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0 w-[32px] outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                  data-name="Component 5"
                  data-node-id="8:3538"
                  aria-label="Discord notifications"
                  onClick={() => setDiscordIntegrationOpen(true)}
                >
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/bell" data-node-id="8:3539">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideBell} />
                  </div>
                </button>
                <button
                  type="button"
                  data-tour="welcome-edit-project"
                  data-node-id="8:3541"
                  disabled={!canEditProject}
                  onClick={() => {
                    if (canEditProject) setEditProjectOpen(true);
                  }}
                  className="bg-white border border-[#ededed] border-solid content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0 outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                  data-name="Component 9"
                  aria-label="Edit project"
                >
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-cog" data-node-id="8:3542">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderCog} />
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="8:3544">
                    Edit
                  </p>
                </button>
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
                  <WelcomeMilestoneTimeline variant="demo" />
                  <div className="flex w-full flex-col gap-16">
                    <WelcomeRecentActivity />
                    <WelcomeResources />
                    <WelcomeRepo />
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
                          data-tour="welcome-invite-members"
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
                  <Link to={WORKSPACE_BASE} className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#1466ff] underline">
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
              data-tour="welcome-project-assistant"
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
      <WelcomeAiChatModal
        open={aiChatOpen}
        onOpenChange={setAiChatOpen}
        projectId={
          isApiRoute && routeProjectId && isApiProjectId(routeProjectId)
            ? Number(routeProjectId)
            : undefined
        }
      />
      <WelcomeShareProjectModal
        open={shareProjectOpen}
        onOpenChange={setShareProjectOpen}
        projectId={
          isApiRoute && routeProjectId && isApiProjectId(routeProjectId)
            ? Number(routeProjectId)
            : undefined
        }
      />
      <DiscordIntegrationModal
        open={discordIntegrationOpen}
        onOpenChange={setDiscordIntegrationOpen}
        projectId={apiProjectIdForDiscord}
      />
      {canEditProject && routeProjectId && (
        <EditProjectModal
          open={editProjectOpen}
          onOpenChange={setEditProjectOpen}
          projectId={Number(routeProjectId)}
          initialName={projectQuery.data!.name}
          initialDescription={projectQuery.data!.description}
          initialStartDateIso={projectQuery.data!.startDateIso}
          initialDueDateIso={projectQuery.data!.dueDateIso}
        />
      )}
    </div>
  );
}
