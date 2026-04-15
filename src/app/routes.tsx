/* eslint-disable react-refresh/only-export-components -- route table: lazy page imports + `router` export */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation, useParams } from "react-router";
import {
  LEGACY_WORKSPACE_BASE,
  LEGACY_WORKSPACE_GET_STARTED_SEGMENT,
  WORKSPACE_BASE,
  WORKSPACE_SPRINT_SEGMENT,
  workspaceJoin,
} from "@/lib/workspacePaths";
import { Login } from "./pages/auth/Login";
import { WaitlistSignUp } from "./pages/auth/WaitlistSignUp";
import { SignUp } from "./pages/auth/SignUp";
import { Loading } from "./pages/auth/Loading";
import { PostAuthBoardRedirect } from "./pages/auth/PostAuthBoardRedirect";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { RouteSkeleton } from "./components/ui/RouteSkeleton";
import { LandingRoute } from "./pages/public/LandingRoute";
import { InviteHandler } from "./pages/InviteHandler";

// Lazy-loaded pages
const ProjectBoard = lazy(() => import("./pages/ProjectBoard").then(m => ({ default: m.ProjectBoard })));
const TaskDetail = lazy(() => import("./pages/TaskDetail").then(m => ({ default: m.TaskDetail })));
const CreateTask = lazy(() => import("./pages/CreateTask").then(m => ({ default: m.CreateTask })));
const ClientPortal = lazy(() => import("./pages/ClientPortal").then(m => ({ default: m.ClientPortal })));
const RoleSelection = lazy(() => import("./pages/RoleSelection").then(m => ({ default: m.RoleSelection })));
const AIProjectPlanner = lazy(() => import("./pages/AIProjectPlanner").then(m => ({ default: m.AIProjectPlanner })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));
const CursorMcpTask = lazy(() =>
  import("./pages/CursorMcpTask").then((m) => ({ default: m.CursorMcpTask }))
);
const McpOAuth = lazy(() => import("./pages/McpOAuth").then((m) => ({ default: m.McpOAuth })));
const DashboardPlaceholder = lazy(() =>
  import("./pages/DashboardPlaceholder").then((m) => ({ default: m.DashboardPlaceholder }))
);
const DashboardPlaceholderHome = lazy(() =>
  import("./pages/DashboardPlaceholderHome").then((m) => ({ default: m.DashboardPlaceholderHome }))
);
const WelcomeContinuumView = lazy(() =>
  import("./pages/WelcomeContinuumView").then((m) => ({ default: m.WelcomeContinuumView }))
);
const DashboardPlaceholderTaskView = lazy(() =>
  import("./pages/DashboardPlaceholderTaskView").then((m) => ({ default: m.DashboardPlaceholderTaskView }))
);
const DashboardPlaceholderAssigned = lazy(() =>
  import("./pages/DashboardPlaceholderAssigned").then((m) => ({ default: m.DashboardPlaceholderAssigned }))
);
const DashboardPlaceholderCreated = lazy(() =>
  import("./pages/DashboardPlaceholderCreated").then((m) => ({ default: m.DashboardPlaceholderCreated }))
);
const DashboardPlaceholderAIPlanner = lazy(() =>
  import("./pages/DashboardPlaceholderAIPlanner").then((m) => ({
    default: m.DashboardPlaceholderAIPlanner,
  }))
);
const DashboardPlaceholderGetStartedTimeLogs = lazy(() =>
  import("./pages/DashboardPlaceholderGetStartedTimeLogs").then((m) => ({
    default: m.DashboardPlaceholderGetStartedTimeLogs,
  }))
);

const OnboardingUsage = lazy(() => import("./pages/onboarding/Usage"));
const OnboardingCollaboration = lazy(() => import("./pages/onboarding/Collaboration"));
const OnboardingRoleChips = lazy(() => import("./pages/onboarding/RoleSelection"));
const OnboardingFunctionSelection = lazy(() => import("./pages/onboarding/FunctionSelection"));
const OnboardingUseCaseSelection = lazy(() => import("./pages/onboarding/UseCaseSelection"));
const OnboardingFeatureInterestSelection = lazy(() =>
  import("./pages/onboarding/FeatureInterestSelection")
);
const OnboardingMindSelection = lazy(() => import("./pages/onboarding/MindSelection"));

/** Preserves query + hash when rewriting legacy `/dashboard-placeholder/*` URLs. */
function LegacyWorkspacePathRedirect({ targetPathname }: { targetPathname: string }) {
  const location = useLocation();
  return <Navigate to={{ pathname: targetPathname, search: location.search, hash: location.hash }} replace />;
}

function LegacyWorkspaceProjectRedirect() {
  const { projectId } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={{
        pathname: `${WORKSPACE_BASE}/project/${projectId ?? ""}`,
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
}

function LegacyWorkspaceTaskRedirect() {
  const { taskId } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={{
        pathname: `${WORKSPACE_BASE}/task/${taskId ?? ""}`,
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingRoute />,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: SignUp,
  },
  {
    path: "/sign-up",
    Component: WaitlistSignUp,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/loading",
    Component: Loading,
  },
  {
    path: "/invite",
    element: <InviteHandler />,
  },
  {
    path: "/cursor-mcp/task/:taskId",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <CursorMcpTask />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/mcp-oauth",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <McpOAuth />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/entry`,
    element: (
      <AuthGuard>
        <PostAuthBoardRedirect />
      </AuthGuard>
    ),
  },
  {
    path: "onboarding",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <Outlet />
        </Suspense>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="usage" replace />,
      },
      {
        path: "usage",
        element: <OnboardingUsage />,
      },
      {
        path: "collaboration",
        element: <OnboardingCollaboration />,
      },
      {
        path: "features",
        element: <OnboardingFeatureInterestSelection />,
      },
      {
        path: "mind",
        element: <OnboardingMindSelection />,
      },
      {
        path: "role",
        element: <OnboardingRoleChips />,
      },
      {
        path: "function",
        element: <OnboardingFunctionSelection />,
      },
      {
        path: "use-case",
        element: <OnboardingUseCaseSelection />,
      },
    ],
  },
  {
    path: "/role-selection",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <RoleSelection />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: WORKSPACE_BASE,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderHome />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}/time-logs`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderGetStartedTimeLogs />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholder />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/welcome`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <WelcomeContinuumView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/project/:projectId`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <WelcomeContinuumView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/task/:taskId`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderTaskView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/assigned`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderAssigned />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/created`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderCreated />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/ai-planner`,
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderAIPlanner />
        </Suspense>
      </AuthGuard>
    ),
  },
  /** Legacy `/dashboard-placeholder/*` → `/workspace/*` (bookmarks). */
  {
    path: LEGACY_WORKSPACE_BASE,
    element: <LegacyWorkspacePathRedirect targetPathname={WORKSPACE_BASE} />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/entry`,
    element: <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/entry`} />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/${LEGACY_WORKSPACE_GET_STARTED_SEGMENT}`,
    element: (
      <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}`} />
    ),
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/${LEGACY_WORKSPACE_GET_STARTED_SEGMENT}/time-logs`,
    element: (
      <LegacyWorkspacePathRedirect
        targetPathname={`${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}/time-logs`}
      />
    ),
  },
  /** Legacy `/workspace/get-started/*` → `/workspace/sprint/*` */
  {
    path: `${WORKSPACE_BASE}/${LEGACY_WORKSPACE_GET_STARTED_SEGMENT}/time-logs`,
    element: (
      <LegacyWorkspacePathRedirect
        targetPathname={`${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}/time-logs`}
      />
    ),
  },
  {
    path: `${WORKSPACE_BASE}/${LEGACY_WORKSPACE_GET_STARTED_SEGMENT}`,
    element: (
      <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}`} />
    ),
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/welcome`,
    element: <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/welcome`} />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/project/:projectId`,
    element: <LegacyWorkspaceProjectRedirect />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/task/:taskId`,
    element: <LegacyWorkspaceTaskRedirect />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/assigned`,
    element: <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/assigned`} />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/created`,
    element: <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/created`} />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/ai-planner`,
    element: <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/ai-planner`} />,
  },
  /** Legacy hub URL → workspace home. */
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Navigate to={WORKSPACE_BASE} replace />
      </AuthGuard>
    ),
  },
  {
    path: "/projects",
    element: (
      <AuthGuard>
        <PostAuthBoardRedirect />
      </AuthGuard>
    ),
  },
  {
    path: "/time",
    element: (
      <AuthGuard>
        <Navigate
          to={`${workspaceJoin(WORKSPACE_SPRINT_SEGMENT, "time-logs")}?populated=1&tab=time-logs`}
          replace
        />
      </AuthGuard>
    ),
  },
  {
    path: "/invoices",
    element: (
      <AuthGuard>
        <Navigate to={WORKSPACE_BASE} replace />
      </AuthGuard>
    ),
  },
  {
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: "projects/ai-planner",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AIProjectPlanner />
          </Suspense>
        ),
      },
      {
        path: "projects/:projectId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProjectBoard />
          </Suspense>
        ),
      },
      {
        path: "tasks/:taskId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <TaskDetail />
          </Suspense>
        ),
      },
      {
        path: "tasks/new",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CreateTask />
          </Suspense>
        ),
      },
      {
        path: "client",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ClientPortal />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <NotFound />
      </Suspense>
    ),
  },
]);
