import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
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

// Lazy-loaded pages
const ProjectBoard = lazy(() => import("./pages/ProjectBoard").then(m => ({ default: m.ProjectBoard })));
const TaskDetail = lazy(() => import("./pages/TaskDetail").then(m => ({ default: m.TaskDetail })));
const CreateTask = lazy(() => import("./pages/CreateTask").then(m => ({ default: m.CreateTask })));
const ClientPortal = lazy(() => import("./pages/ClientPortal").then(m => ({ default: m.ClientPortal })));
const RoleSelection = lazy(() => import("./pages/RoleSelection").then(m => ({ default: m.RoleSelection })));
const AIProjectPlanner = lazy(() => import("./pages/AIProjectPlanner").then(m => ({ default: m.AIProjectPlanner })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));
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
    path: "/dashboard-placeholder/entry",
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
    path: "/dashboard-placeholder",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderHome />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/get-started",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholder />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/get-started/time-logs",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderGetStartedTimeLogs />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/welcome",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <WelcomeContinuumView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/project/:projectId",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <WelcomeContinuumView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/task/:taskId",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderTaskView />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/assigned",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderAssigned />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/created",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderCreated />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/dashboard-placeholder/ai-planner",
    element: (
      <AuthGuard>
        <Suspense fallback={<RouteSkeleton />}>
          <DashboardPlaceholderAIPlanner />
        </Suspense>
      </AuthGuard>
    ),
  },
  /** Legacy hub URLs → dashboard-placeholder (bookmarks). */
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Navigate to="/dashboard-placeholder" replace />
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
          to="/dashboard-placeholder/get-started/time-logs?populated=1&tab=time-logs"
          replace
        />
      </AuthGuard>
    ),
  },
  {
    path: "/invoices",
    element: (
      <AuthGuard>
        <Navigate to="/dashboard-placeholder" replace />
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
