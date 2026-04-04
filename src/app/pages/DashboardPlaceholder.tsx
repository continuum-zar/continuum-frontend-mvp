import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { GetStartedKanbanLive } from "../components/dashboard-placeholder/GetStartedKanbanLive";
import {
  DASHBOARD_WELCOME_PROJECT,
  isApiProjectId,
  projectMainHref,
  projectSprintHref,
} from "../data/dashboardPlaceholderProjects";

import { useProject, useProjectMembers, useProjectMilestones } from "@/api/hooks";
import { useAuthStore } from "@/store/authStore";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { memberAvatarBackground } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { LogTimeModal } from "../components/dashboard-placeholder/LogTimeModal";
import { WelcomeAiChatModal } from "../components/welcome/WelcomeAiChatModal";
import { WelcomeShareProjectModal } from "../components/welcome/WelcomeShareProjectModal";
import { WelcomeToContinuumModal } from "../components/welcome/WelcomeToContinuumModal";
import {
  SESSION_POST_ONBOARDING_WELCOME_KEY,
  welcomeModalDismissedKeyForUser,
} from "../components/welcome/welcomeModalAssets";

const imgLucideListTodo = mcpAsset("2a12c1eb-b745-4bea-b9f1-f67045f8c03a");
const imgLucideTimer = mcpAsset("5b386900-0988-47bc-b5fd-da0ce6db2015");
const imgEllipse21 = mcpAsset("a0e3fea4-5911-470e-aa3e-64387b06a92f");
const imgEllipse23 = mcpAsset("2124fad3-f5ec-427e-8aff-5bda335eb761");
const imgEllipse22 = mcpAsset("a56dc45a-533f-4e63-bc8b-51b4d45b59a1");
const imgEllipse24 = mcpAsset("7ff4e012-4905-4a45-a625-9fc5dced43b4");
const imgEllipse25 = mcpAsset("5985192e-9166-4d87-a96f-61995d56f1f2");
const imgEllipse26 = mcpAsset("422f6266-5393-471e-8e01-384fc37ef619");
const imgFrame416 = mcpAsset("777201f6-1844-44c2-92cb-2546191dcf25");
const imgEllipse27 = mcpAsset("20a71caa-55f3-45e7-9fb8-ebfb602fe6dc");
const imgEllipse28 = mcpAsset("bdacad62-bbe1-4de2-b3e7-a4f9418fdd4c");
const imgEllipse29 = mcpAsset("710e523e-163a-4f70-9ad4-56391a61a3ac");
const imgLucideFolderOpenDot = mcpAsset("941ffd1f-d458-4dea-b5e5-49e021a96475");
const imgLucideChevronRight = mcpAsset("3c9be13d-56ac-42e3-a5bd-d538ded07d91");
const imgLucideBell = mcpAsset("bff9ccf9-de26-47c4-bee7-385dad67d583");
const imgLucideFolderCog = mcpAsset("c887e8ab-eac8-49d0-a552-df4e52754a78");
const imgLucideShare = mcpAsset("6bac045f-4082-4943-bb21-c2b42ea3f721");
const imgVector9 = mcpAsset("10787a11-3019-4285-b605-c74442b6fd28");
const imgLucideEllipsis = mcpAsset("9baf5fcb-1676-4740-8a31-f190f218b100");
const imgLucideSquareKanban = mcpAsset("474af36e-77b4-44af-86ae-df298c677a75");
const imgLucideList = mcpAsset("bfa2c9b5-8c39-466a-adad-c4e6e7cf4a05");
const imgLucideSquareChartGantt = mcpAsset("30e802fb-d333-4025-88ef-ce25339a3318");
const imgLucideCalendar = mcpAsset("6b669401-0e47-41db-b963-8a02bb677ba9");
const imgEllipse12 = mcpAsset("68b61d8d-b4a5-465d-a7ce-940bfc1fe188");
const imgEllipse11 = mcpAsset("5f4a1f4f-65c5-43b7-a099-f7dbddb9c1c7");
const imgLucideUserRoundPlus = mcpAsset("1a1f6047-d8c5-462f-bc2a-1e5c4695e5f0");
const imgLucidePlus = mcpAsset("4d8a17c0-2d4e-466b-97d6-045bf4a51cd8");
const imgLucideSearch1 = mcpAsset("c5ee61c3-f628-42e7-b456-58f9c49a5cfe");
const imgVector10 = mcpAsset("0d58a9e0-9d27-4eb3-ad07-b2ad64a15f10");
const imgVector11 = mcpAsset("4912f83a-d378-4c38-9bf2-ce38aa20cc19");
const imgVector12 = mcpAsset("64e38728-fa1b-4a8c-97d3-cbb7f586a27c");
const imgLucideFlag = mcpAsset("299f17ae-de59-4012-9bb8-ae6509081405");
const imgVector13 = mcpAsset("c1ddd3b4-d26b-4a92-b752-d84ba0208f8a");
const imgFrame308 = mcpAsset("5b22b8e9-bd31-437e-a559-232247be56a0");
const imgVector14 = mcpAsset("a92d5710-b68e-4205-9b7a-c40338695c51");
const imgLucidePaperclip = mcpAsset("c4929b2e-a9fc-4fce-913e-ecf4dafe6944");
const imgLucideMessageCircle = mcpAsset("ff8c6057-7f55-46be-8899-4cb59d2eda1a");
const imgLucideSquircleDashed = mcpAsset("e2efeca9-31cd-4cf9-ac56-b2799ee8a450");
const imgLucideCircleCheckBig = mcpAsset("244bb570-3aed-481d-8cf9-f067c69c50b0");
const imgVector15 = mcpAsset("41d4c7e7-e987-4d3e-b39f-b0a8c1791b01");
const imgVector16 = mcpAsset("e5382ed0-7c62-4b1c-8956-100137a0d887");
const imgVector17 = mcpAsset("bbe03028-458c-482b-b79f-de194af6fcb4");
const imgVector18 = mcpAsset("46fd527c-70b1-4379-a8d4-7e2e7815734d");
const imgVector19 = mcpAsset("14a8de50-34e0-4b11-af87-5ea05963c40d");
const imgVector20 = mcpAsset("5f55c469-83d2-4f97-9cb9-f48196e0e890");
const imgVector21 = mcpAsset("b3719b5c-ed25-42db-a8fe-da0aeeceee0b");
const imgVector22 = mcpAsset("0a8e6b5c-95b8-4050-8755-f2787f342c6f");
type ComponentProps = {
  className?: string;
  profilePic?: "True" | "False" | "Add user";
};

function Component({ className }: Pick<ComponentProps, "className">) {
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

function Component3({ className }: Pick<Component3Props, "className">) {
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

function Component4({ className }: Pick<Component4Props, "className">) {
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

type ColumnId = "todo" | "in-progress" | "completed";

interface TaskCardData {
  id: number;
  title: string;
  descriptionLines?: string[];
  multiLineDesc?: boolean;
  clipCount: number;
  msgCount: number;
  badgesHidden: boolean;
}

const TASKS: TaskCardData[] = [
  { id: 1, title: "View project overview", descriptionLines: ['To view the project status, select "Welcome to Continuum!" in the top left under the "Projects" label.'], clipCount: 1, msgCount: 1, badgesHidden: false },
  { id: 2, title: "Add a new task", descriptionLines: ['To find, organise, and add a new task, use the "+" icon in the top right corner of ', "To-Do."], multiLineDesc: true, clipCount: 1, msgCount: 1, badgesHidden: false },
  { id: 3, title: "Add a new project", descriptionLines: ["Find, organise, and add a new project using the sidebar to the left."], clipCount: 1, msgCount: 1, badgesHidden: false },
  { id: 4, title: "Create an account with Continuum", clipCount: 5, msgCount: 3, badgesHidden: true },
];

const INITIAL_COLUMNS: Record<number, ColumnId> = { 1: "todo", 2: "todo", 3: "todo", 4: "completed" };
const INITIAL_COLUMN_ORDER: Record<ColumnId, number[]> = {
  todo: [1, 2, 3],
  "in-progress": [],
  completed: [4],
};

/** Overlapping member avatars next to Log Time — show up to this many, then a +N chip. */
const LIVE_BOARD_HEADER_MEMBER_AVATAR_MAX = 5;

export function DashboardPlaceholder() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [logTimeOpen, setLogTimeOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [shareProjectOpen, setShareProjectOpen] = useState(false);
  const [welcomeToContinuumOpen, setWelcomeToContinuumOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("project");
  const milestoneParam = searchParams.get("milestone");
  const isLiveBoard = projectParam != null && isApiProjectId(projectParam);
  const liveProjectId = isLiveBoard && projectParam ? Number(projectParam) : null;
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId) return;
    if (localStorage.getItem(welcomeModalDismissedKeyForUser(userId)) === "1") return;
    if (sessionStorage.getItem(SESSION_POST_ONBOARDING_WELCOME_KEY) !== "1") return;
    setWelcomeToContinuumOpen(true);
  }, [userId]);

  const handleWelcomeToContinuumOpenChange = (open: boolean) => {
    setWelcomeToContinuumOpen(open);
    if (!open) {
      if (userId) {
        localStorage.setItem(welcomeModalDismissedKeyForUser(userId), "1");
      }
      sessionStorage.removeItem(SESSION_POST_ONBOARDING_WELCOME_KEY);
    }
  };
  const liveMembersQuery = useProjectMembers(liveProjectId, { enabled: liveProjectId != null });
  const liveProjectQuery = useProject(liveProjectId);
  const liveMilestonesQuery = useProjectMilestones(liveProjectId);
  const liveMembers: Member[] = liveMembersQuery.data ?? [];

  const breadcrumbProjectLabel =
    isLiveBoard && liveProjectId != null
      ? liveProjectQuery.data?.name ?? (liveProjectQuery.isLoading ? "…" : "Project")
      : DASHBOARD_WELCOME_PROJECT.name;

  const breadcrumbProjectHref =
    isLiveBoard && projectParam != null && isApiProjectId(projectParam)
      ? projectMainHref(projectParam)
      : "/dashboard-placeholder/welcome";

  const sprintBoardHref =
    isLiveBoard && projectParam != null && isApiProjectId(projectParam)
      ? projectSprintHref(projectParam, milestoneParam ?? undefined)
      : "/dashboard-placeholder/get-started";

  /** Second breadcrumb segment + main page title under the rule — milestone name for API projects, mock label for welcome-only. */
  const milestonePageTitle =
    isLiveBoard && liveProjectId != null
      ? milestoneParam
        ? liveMilestonesQuery.data?.find((m) => m.id === milestoneParam)?.name ??
          (liveMilestonesQuery.isLoading ? "…" : "Milestone")
        : "Sprint"
      : DASHBOARD_WELCOME_PROJECT.sprintLabel;
  const liveHeaderVisibleMembers = liveMembers.slice(0, LIVE_BOARD_HEADER_MEMBER_AVATAR_MAX);
  const liveHeaderMemberOverflow = Math.max(0, liveMembers.length - LIVE_BOARD_HEADER_MEMBER_AVATAR_MAX);

  const [cardColumns, setCardColumns] = useState<Record<number, ColumnId>>(INITIAL_COLUMNS);
  const [columnOrder, setColumnOrder] = useState<Record<ColumnId, number[]>>(INITIAL_COLUMN_ORDER);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);

  const handleDragStart = (taskId: number) => (e: DragEvent<HTMLDivElement>) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(taskId));
    const el = e.currentTarget;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.transform = "rotate(3deg)";
    const ghostCard = ghost.querySelector(".bg-white") as HTMLElement | null;
    if (ghostCard) {
      ghostCard.style.border = "2px solid #24B5F8";
    }
    ghost.style.width = `${el.offsetWidth}px`;
    ghost.style.position = "fixed";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleColumnDragOver = (col: ColumnId) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingId !== null && cardColumns[draggingId] !== col) {
      setDragOverCol(col);
    }
  };

  const handleColumnDragLeave = (col: ColumnId) => (e: DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target.contains(e.relatedTarget as Node)) {
      if (dragOverCol === col) setDragOverCol(null);
    }
  };

  const moveCard = (taskId: number, destinationCol: ColumnId, targetId?: number, placeAfter = false) => {
    setColumnOrder(prev => {
      const next: Record<ColumnId, number[]> = {
        todo: [...prev.todo],
        "in-progress": [...prev["in-progress"]],
        completed: [...prev.completed],
      };

      (Object.keys(next) as ColumnId[]).forEach(col => {
        next[col] = next[col].filter(id => id !== taskId);
      });

      if (targetId === undefined) {
        next[destinationCol].push(taskId);
      } else {
        const targetIndex = next[destinationCol].indexOf(targetId);
        const insertIndex = targetIndex === -1 ? next[destinationCol].length : targetIndex + (placeAfter ? 1 : 0);
        next[destinationCol].splice(insertIndex, 0, taskId);
      }

      return next;
    });
    setCardColumns(prev => ({ ...prev, [taskId]: destinationCol }));
  };

  const handleDrop = (col: ColumnId) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(taskId)) {
      // Board-level drop inserts at the top of the destination column.
      moveCard(taskId, col, col === cardColumns[taskId] ? undefined : columnOrder[col][0], false);
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleCardDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCardDrop = (destinationCol: ColumnId, targetId: number) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    if (isNaN(taskId) || taskId === targetId) return;
    // Card-on-card drop always inserts above the target card.
    moveCard(taskId, destinationCol, targetId, false);
    setDraggingId(null);
    setDragOverCol(null);
  };

  const tasksInColumn = (col: ColumnId) =>
    columnOrder[col]
      .map(taskId => TASKS.find(t => t.id === taskId))
      .filter((task): task is TaskCardData => task !== undefined);

  const cardOrderFor = (taskId: number) => {
    const col = cardColumns[taskId];
    const idx = columnOrder[col]?.indexOf(taskId) ?? -1;
    return idx === -1 ? undefined : idx;
  };

  const renderCard = (task: TaskCardData) => {
    const isDragging = draggingId === task.id;
    return (
      <div
        key={task.id}
        className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${isDragging ? "cursor-grabbing opacity-0" : "cursor-grab"}`}
        draggable
        onDragStart={handleDragStart(task.id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleCardDragOver}
        onDrop={handleCardDrop(cardColumns[task.id], task.id)}
        onClick={() => navigate(`/dashboard-placeholder/task/${task.id}`)}
        style={{ order: cardOrderFor(task.id) }}
      >
        <div className={`bg-white ${isDragging ? "border-2 border-[#24B5F8]" : "border border-[#ebedee]"} border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full`}>
          <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full">
                  <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[20px] tracking-[-0.2px]">
                    {task.title}
                  </p>
                  <div className="content-stretch flex items-center justify-center relative shrink-0 size-[27px]">
                    <div className="relative shrink-0 size-[16px]">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
                    </div>
                  </div>
                </div>
              </div>
              {task.descriptionLines && (
                <>
                  <div className="h-0 relative shrink-0 w-full">
                    <div className="absolute inset-[-0.57px_0]">
                      <img alt="" className="block max-w-none size-full" src={imgVector13} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    {task.multiLineDesc ? (
                      <div className="font-['Satoshi:Medium',sans-serif] leading-[0] not-italic relative shrink-0 text-[#606d76] text-[16px] w-full whitespace-pre-wrap">
                        {task.descriptionLines.map((line, i) => (
                          <p key={i} className={`leading-[normal]${i === 0 ? " mb-0" : ""}`}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] w-full">
                        {task.descriptionLines[0]}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="content-stretch flex gap-[6px] h-[15px] isolate items-center justify-center relative shrink-0 w-full">
                <div className="relative shrink-0 size-[12px] z-[2]">
                  <div className="absolute inset-[-33.33%]">
                    <img alt="" className="block max-w-none size-full" src={imgFrame308} />
                  </div>
                </div>
                <div className="flex-[1_0_0] h-0 min-h-px min-w-px relative z-[1]">
                  <div className="absolute inset-[-2.5px_-0.84%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector14} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="content-stretch flex items-center relative shrink-0">
                <Component className="bg-[#f17173] border border-solid border-white content-stretch flex items-center justify-center relative rounded-[999px] shrink-0 size-[24px]" />
              </div>
              <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0">
                <div className={`bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0${task.badgesHidden ? " opacity-0" : ""}`}>
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
                    {task.clipCount}
                  </p>
                </div>
                <div className={`bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0${task.badgesHidden ? " opacity-0" : ""}`}>
                  <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]">
                    <div className="relative shrink-0 size-[13.33px]">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
                    </div>
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
                    {task.msgCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
      data-name="Dashboard placeholder"
      data-node-id="7:2816"
      style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2" data-node-id="7:2817">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]" data-node-id="7:2818">
          <DashboardLeftRail />
          <div className="relative z-[1] isolate flex min-h-0 min-w-0 flex-1 flex-col items-end gap-[24px] overflow-x-clip overflow-y-hidden rounded-[8px] border border-[#ebedee] border-solid bg-white py-[16px] pl-[24px] pr-[16px] shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]" data-node-id="7:2850">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full z-[3]" data-node-id="7:2851">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="7:2852">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2853">
                  <Link
                    to={breadcrumbProjectHref}
                    className="content-stretch flex min-w-0 max-w-[min(100%,320px)] gap-[8px] items-center relative shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                    title={breadcrumbProjectLabel}
                  >
                    <div className="relative shrink-0 size-[16px]" data-name="lucide/folder-open-dot" data-node-id="7:2854">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideFolderOpenDot} />
                    </div>
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative min-w-0 shrink text-[#606d76] text-[16px] truncate" data-node-id="7:2856">
                      {breadcrumbProjectLabel}
                    </p>
                  </Link>
                  <div className="relative shrink-0 size-[16px]" data-name="lucide/chevron-right" data-node-id="7:2860">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucideChevronRight} />
                  </div>
                  <Link
                    to={sprintBoardHref}
                    className="font-['Satoshi:Medium',sans-serif] min-w-0 max-w-[min(100%,280px)] leading-[normal] not-italic relative shrink truncate text-[#606d76] text-[16px] no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                    data-node-id="7:2862"
                    title={milestonePageTitle}
                  >
                    {milestonePageTitle}
                  </Link>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="7:2866">
                  <Component4 className="bg-[#d7fede] content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[999px] shrink-0" />
                  <div className="bg-[#f0f3f5] content-stretch flex gap-[2px] h-[32px] items-center p-[2px] relative rounded-[8px] shrink-0 w-[251px]" data-node-id="7:2868">
                    <Link
                      to="/dashboard-placeholder/get-started"
                      className="bg-white border border-[#ededed] border-solid content-stretch flex h-[36px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)] shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                      data-name="Component 2"
                      data-node-id="7:2869"
                    >
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap" data-node-id="7:2870">
                        Sprint
                      </p>
                    </Link>
                    <Link
                      to="/dashboard-placeholder/get-started/time-logs?populated=1&tab=time-logs"
                      className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                      data-name="Component 3"
                      data-node-id="7:2871"
                    >
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] text-right whitespace-nowrap" data-node-id="7:2872">
                        Time logs
                      </p>
                    </Link>
                    <Link
                      to="/dashboard-placeholder/get-started/time-logs?populated=1&tab=activity"
                      className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                      data-name="Component 4"
                      data-node-id="7:2874"
                    >
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap" data-node-id="7:2875">
                        Activity
                      </p>
                    </Link>
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
                  <p
                    className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative min-w-0 max-w-[min(100%,480px)] shrink truncate text-[#0b191f] text-[24px]"
                    data-node-id="7:2891"
                    title={milestonePageTitle}
                  >
                    {milestonePageTitle}
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
                    {isLiveBoard ? (
                      liveMembersQuery.isLoading ? (
                        <>
                          <div className="mr-[-10.667px] size-[32px] shrink-0 animate-pulse rounded-[999px] bg-[#e4e8eb]" aria-hidden />
                          <div className="mr-[-10.667px] size-[32px] shrink-0 animate-pulse rounded-[999px] bg-[#e4e8eb]" aria-hidden />
                          <div className="mr-[-10.667px] size-[32px] shrink-0 animate-pulse rounded-[999px] bg-[#e4e8eb]" aria-hidden />
                        </>
                      ) : (
                        <>
                          {liveHeaderVisibleMembers.map((m, i) => (
                            <div
                              key={m.id}
                              className="content-stretch flex items-center justify-center border-[1.333px] border-solid border-white mr-[-10.667px] relative rounded-[999px] shrink-0 size-[32px]"
                              style={{ zIndex: i + 1, backgroundColor: memberAvatarBackground(m.userId) }}
                              title={m.name}
                              data-name="Component 29"
                            >
                              <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap">
                                <p className="leading-[0.4]">{m.initials}</p>
                              </div>
                            </div>
                          ))}
                          {liveHeaderMemberOverflow > 0 ? (
                            <div
                              className="content-stretch flex items-center justify-center border-[1.333px] border-solid border-white mr-[-10.667px] relative z-10 rounded-[999px] shrink-0 size-[32px] bg-[#e8ecef]"
                              title={`${liveHeaderMemberOverflow} more member${liveHeaderMemberOverflow === 1 ? "" : "s"}`}
                            >
                              <span className="font-['Satoshi:Medium',sans-serif] text-[11px] leading-[0.4] text-[#606d76]">
                                +{liveHeaderMemberOverflow}
                              </span>
                            </div>
                          ) : null}
                        </>
                      )
                    ) : (
                      <div className="bg-[#f17173] border-[1.333px] border-solid border-white content-stretch flex items-center justify-center mr-[-10.667px] relative rounded-[999px] shrink-0 size-[32px]" data-name="Component 29" data-node-id="I7:2903;2032:932">
                        <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap" data-node-id="I7:2903;2032:932;2032:902">
                          <p className="leading-[0.4]">AS</p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShareProjectOpen(true)}
                      aria-label="Invite members"
                      className="border-0 bg-[#e19c02] content-stretch flex cursor-pointer gap-[5.714px] items-center mr-[-10.667px] p-[9.143px] relative rounded-[428.143px] shrink-0 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                      data-name="Component 31"
                      data-node-id="I7:2903;2032:931"
                    >
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
                    </button>
                  </div>
                  <div className="flex flex-row items-center self-stretch">
                    <button
                      type="button"
                      onClick={() => setLogTimeOpen(true)}
                      className="content-stretch flex h-full shrink-0 items-center justify-center gap-[8px] rounded-[8px] px-[16px] py-[10px]"
                      data-name="Component 4"
                      data-node-id="7:2904"
                      style={{ backgroundImage: "linear-gradient(165.24069544367063deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)" }}
                    >
                      <div className="relative shrink-0 size-[16px]" data-name="lucide/plus" data-node-id="7:2905">
                        <img alt="" className="absolute block max-w-none size-full" src={imgLucidePlus} />
                      </div>
                      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap" data-node-id="7:2907">
                        Log Time
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
{isLiveBoard ? (
              <GetStartedKanbanLive
                projectId={Number(projectParam)}
                milestoneId={milestoneParam}
                members={liveMembers}
              />
            ) : (
              <div className="content-stretch relative z-[1] flex w-full flex-1 min-h-0 items-stretch gap-[16px]" data-node-id="7:2908">
              <div className={`content-stretch flex h-full min-h-0 flex-[1_0_0] flex-col items-start overflow-hidden min-w-px p-[16px] relative rounded-[16px] min-h-[120px] transition-colors duration-200 ${dragOverCol === "todo" ? "border-2 border-dashed border-[#cdd2d5]" : ""}`} data-node-id="7:2909" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)" }} onDragOver={handleColumnDragOver("todo")} onDragLeave={handleColumnDragLeave("todo")} onDrop={handleDrop("todo")}>
                <div className="flex w-full shrink-0 flex-col gap-4 bg-[#f9fafb]">
                <div className="content-stretch flex flex-col gap-[16px] isolate items-start relative shrink-0 w-full" data-name="Component 125" data-node-id="7:2910">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full z-[2]" data-node-id="I7:2910;2444:24776">
                    <Component3 className="content-stretch flex gap-[8px] items-center relative shrink-0" />
                    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 ml-auto" data-node-id="I7:2910;2444:24781">
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
                </div>
                <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pt-4">
                {dragOverCol === "todo" && draggingId !== null && (
                  <div className="h-[184px] w-full rounded-[16px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.45)]" />
                )}
                <div
                  className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${draggingId === 1 ? "cursor-grabbing opacity-0" : "cursor-grab"}`}
                  draggable
                  onDragStart={handleDragStart(1)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop("todo", 1)}
                  style={{ display: cardColumns[1] !== "todo" ? "none" : undefined, order: cardOrderFor(1) }}
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
                  className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${draggingId === 2 ? "cursor-grabbing opacity-0" : "cursor-grab"}`}
                  draggable
                  onDragStart={handleDragStart(2)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop("todo", 2)}
                  style={{ display: cardColumns[2] !== "todo" ? "none" : undefined, order: cardOrderFor(2) }}
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
                  className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${draggingId === 3 ? "cursor-grabbing opacity-0" : "cursor-grab"}`}
                  draggable
                  onDragStart={handleDragStart(3)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop("todo", 3)}
                  style={{ display: cardColumns[3] !== "todo" ? "none" : undefined, order: cardOrderFor(3) }}
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
                {tasksInColumn("todo").filter(t => INITIAL_COLUMNS[t.id] !== "todo").map(renderCard)}
                </div>
              </div>
              <div className={`content-stretch flex h-full min-h-0 flex-[1_0_0] flex-col items-start overflow-hidden min-w-px p-[16px] relative rounded-[16px] min-h-[120px] transition-colors duration-200 ${dragOverCol === "in-progress" ? "border-2 border-dashed border-[#cdd2d5]" : ""}`} data-node-id="7:2915" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)" }} onDragOver={handleColumnDragOver("in-progress")} onDragLeave={handleColumnDragLeave("in-progress")} onDrop={handleDrop("in-progress")}>
                <div className="flex w-full shrink-0 flex-col gap-4 bg-[#f9fafb]">
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
                <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pt-4">
                {dragOverCol === "in-progress" && draggingId !== null && (
                  <div className="h-[184px] w-full rounded-[16px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.45)]" />
                )}
                {tasksInColumn("in-progress").map(renderCard)}
                </div>
              </div>
              <div className={`content-stretch flex h-full min-h-0 flex-[1_0_0] flex-col items-start overflow-hidden min-w-px p-[16px] relative rounded-[16px] min-h-[120px] transition-colors duration-200 ${dragOverCol === "completed" ? "border-2 border-dashed border-[#cdd2d5]" : ""}`} data-node-id="7:2925" style={{ backgroundImage: "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)" }} onDragOver={handleColumnDragOver("completed")} onDragLeave={handleColumnDragLeave("completed")} onDrop={handleDrop("completed")}>
                <div className="flex w-full shrink-0 flex-col gap-4 bg-[#f9fafb]">
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
                </div>
                <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pt-4">
                {dragOverCol === "completed" && draggingId !== null && (
                  <div className="h-[184px] w-full rounded-[16px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.45)]" />
                )}
                <div
                  className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${draggingId === 4 ? "cursor-grabbing opacity-0" : "cursor-grab"}`}
                  draggable
                  onDragStart={handleDragStart(4)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop("completed", 4)}
                  style={{ display: cardColumns[4] !== "completed" ? "none" : undefined, order: cardOrderFor(4) }}
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
                {tasksInColumn("completed").filter(t => INITIAL_COLUMNS[t.id] !== "completed").map(renderCard)}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAiChatOpen(true)}
          className="absolute bottom-[14px] right-[14px] isolate flex size-[48px] cursor-pointer flex-col items-start overflow-clip rounded-[48px] border border-solid border-[#edecea] bg-white p-0 shadow-[0px_10.32px_2.88px_0px_rgba(11,25,31,0),0px_6.6px_2.64px_0px_rgba(11,25,31,0.01),0px_3.72px_2.28px_0px_rgba(11,25,31,0.03),0px_1.68px_1.68px_0px_rgba(11,25,31,0.04),0px_0.36px_0.96px_0px_rgba(11,25,31,0.05)] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open AI assistant"
          data-node-id="7:2936"
        >
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
        </button>
      </div>
      <CreateTaskModal open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
      <LogTimeModal open={logTimeOpen} onOpenChange={setLogTimeOpen} />
      <WelcomeShareProjectModal open={shareProjectOpen} onOpenChange={setShareProjectOpen} projectId={isLiveBoard ? Number(projectParam) : undefined} />
      <WelcomeAiChatModal open={aiChatOpen} onOpenChange={setAiChatOpen} showQuickActions={false} />
      <WelcomeToContinuumModal open={welcomeToContinuumOpen} onOpenChange={handleWelcomeToContinuumOpenChange} />
    </div>
  );
}
