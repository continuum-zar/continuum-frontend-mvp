import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { Login } from "./pages/auth/Login";
import { SignUp } from "./pages/auth/SignUp";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { RouteSkeleton } from "./components/ui/RouteSkeleton";
import { LandingRoute } from "./pages/public/LandingRoute";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const ProjectsList = lazy(() => import("./pages/ProjectsList").then(m => ({ default: m.ProjectsList })));
const ProjectBoard = lazy(() => import("./pages/ProjectBoard").then(m => ({ default: m.ProjectBoard })));
const TaskDetail = lazy(() => import("./pages/TaskDetail").then(m => ({ default: m.TaskDetail })));
const TimeTracking = lazy(() => import("./pages/TimeTracking").then(m => ({ default: m.TimeTracking })));
const CreateTask = lazy(() => import("./pages/CreateTask").then(m => ({ default: m.CreateTask })));
const Invoices = lazy(() => import("./pages/Invoices").then(m => ({ default: m.Invoices })));
const ClientPortal = lazy(() => import("./pages/ClientPortal").then(m => ({ default: m.ClientPortal })));
const RoleSelection = lazy(() => import("./pages/RoleSelection").then(m => ({ default: m.RoleSelection })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

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
    path: "/reset-password",
    Component: ResetPassword,
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
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "projects",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProjectsList />
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
        path: "time",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <TimeTracking />
          </Suspense>
        ),
      },
      {
        path: "invoices",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <Invoices />
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
