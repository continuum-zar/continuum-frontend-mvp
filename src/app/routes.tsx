/* eslint-disable react-refresh/only-export-components -- route table: lazy page imports + `router` export */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation, useParams } from "react-router";
import { RouterStaleChunkErrorRecovery } from "./components/RouterStaleChunkErrorRecovery";
import {
  LEGACY_WORKSPACE_BASE,
  LEGACY_WORKSPACE_GET_STARTED_SEGMENT,
  WORKSPACE_BASE,
  WORKSPACE_SPRINT_SEGMENT,
  workspaceJoin,
  workspaceMyTasksHref,
} from "@/lib/workspacePaths";
import { Login } from "./pages/auth/Login";
import { WaitlistSignUp } from "./pages/auth/WaitlistSignUp";
import { SignUp } from "./pages/auth/SignUp";
import { Loading } from "./pages/auth/Loading";
import { PostAuthBoardRedirect } from "./pages/auth/PostAuthBoardRedirect";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { projectSprintHref } from "./data/dashboardPlaceholderProjects";
import { AuthGuard } from "./components/auth/AuthGuard";
import { RouteSkeleton } from "./components/ui/RouteSkeleton";
import { WorkspaceShellSkeleton } from "./components/dashboard-placeholder/WorkspaceShellSkeleton";
import { LandingRoute } from "./pages/public/LandingRoute";
import { InviteHandler } from "./pages/InviteHandler";

// Lazy-loaded pages
const RoleSelection = lazy(() => import("./pages/RoleSelection").then(m => ({ default: m.RoleSelection })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));
const CursorMcpTask = lazy(() =>
  import("./pages/CursorMcpTask").then((m) => ({ default: m.CursorMcpTask }))
);
const McpOAuth = lazy(() => import("./pages/McpOAuth").then((m) => ({ default: m.McpOAuth })));
const McpSetup = lazy(() => import("./pages/McpSetup").then((m) => ({ default: m.McpSetup })));
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
const DashboardPlaceholderMyTasks = lazy(() =>
  import("./pages/DashboardPlaceholderMyTasks").then((m) => ({ default: m.DashboardPlaceholderMyTasks }))
);
const DashboardPlaceholderProductivityRhythm = lazy(() =>
  import("./pages/DashboardPlaceholderProductivityRhythm").then((m) => ({
    default: m.DashboardPlaceholderProductivityRhythm,
  }))
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
const AdminReleaseNotes = lazy(() =>
  import("./pages/AdminReleaseNotes").then((m) => ({ default: m.AdminReleaseNotes }))
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

/** Legacy `/projects/:id` and `/tasks/:id` (hub layout) → workspace sprint / task. */
function withPreservedSearchHash(destination: string, location: ReturnType<typeof useLocation>): string {
  const url = new URL(destination, "http://localhost");
  if (location.search) {
    const extra = new URLSearchParams(location.search);
    extra.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }
  if (location.hash) url.hash = location.hash;
  return `${url.pathname}${url.search}${url.hash}`;
}

function LegacyHubProjectRedirect() {
  const { projectId } = useParams();
  const location = useLocation();
  const target = projectId ? projectSprintHref(String(projectId)) : WORKSPACE_BASE;
  return <Navigate to={withPreservedSearchHash(target, location)} replace />;
}

function LegacyHubTaskRedirect() {
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

const appRoutes = [
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
    path: "/mcp-setup",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <McpSetup />
        </Suspense>
      </AuthGuard>
    ),
  },
  /** Bookmarks / old links: skip async board resolver (was prone to hanging on skeleton). */
  {
    path: `${WORKSPACE_BASE}/entry`,
    element: (
      <AuthGuard>
        <LegacyWorkspacePathRedirect targetPathname={WORKSPACE_BASE} />
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
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
          <DashboardPlaceholderHome />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}/time-logs`,
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="list" />}>
          <DashboardPlaceholderGetStartedTimeLogs />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}`,
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="board" />}>
          <DashboardPlaceholder />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/welcome`,
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
          <WelcomeContinuumView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: workspaceJoin("admin", "release-notes"),
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
          <AdminReleaseNotes />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/project/:projectId`,
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
          <WelcomeContinuumView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/task/:taskId`,
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
          <DashboardPlaceholderTaskView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/assigned`,
    element: (
      <AuthGuard>
        <Navigate to={workspaceMyTasksHref("assigned")} replace />
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/created`,
    element: (
      <AuthGuard>
        <Navigate to={workspaceMyTasksHref("created")} replace />
      </AuthGuard>
    ),
  },
  {
    path: workspaceJoin("my-tasks"),
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="list" />}>
          <DashboardPlaceholderMyTasks />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: workspaceJoin("productivity-rhythm"),
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
          <DashboardPlaceholderProductivityRhythm />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: `${WORKSPACE_BASE}/ai-planner`,
    element: (
      <AuthGuard>
        <Suspense fallback={<WorkspaceShellSkeleton variant="generic" />}>
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
    element: <LegacyWorkspacePathRedirect targetPathname={WORKSPACE_BASE} />,
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
    element: <Navigate to={workspaceMyTasksHref("assigned")} replace />,
  },
  {
    path: `${LEGACY_WORKSPACE_BASE}/created`,
    element: <Navigate to={workspaceMyTasksHref("created")} replace />,
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
  /** Legacy hub URLs (former `DashboardLayout` children) → workspace. */
  {
    path: "/projects/ai-planner",
    element: (
      <AuthGuard>
        <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/ai-planner`} />
      </AuthGuard>
    ),
  },
  {
    path: "/projects/:projectId",
    element: (
      <AuthGuard>
        <LegacyHubProjectRedirect />
      </AuthGuard>
    ),
  },
  {
    path: "/tasks/new",
    element: (
      <AuthGuard>
        <LegacyWorkspacePathRedirect targetPathname={`${WORKSPACE_BASE}/${WORKSPACE_SPRINT_SEGMENT}`} />
      </AuthGuard>
    ),
  },
  {
    path: "/tasks/:taskId",
    element: (
      <AuthGuard>
        <LegacyHubTaskRedirect />
      </AuthGuard>
    ),
  },
  {
    path: "/client",
    element: (
      <AuthGuard>
        <LegacyWorkspacePathRedirect targetPathname={WORKSPACE_BASE} />
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <NotFound />
      </Suspense>
    ),
  },
];

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <RouterStaleChunkErrorRecovery />,
    children: [...appRoutes],
  },
]);
