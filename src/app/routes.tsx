import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { Login } from "./pages/auth/Login";
import { SignUp } from "./pages/auth/SignUp";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { RoleSelection } from "./pages/RoleSelection";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { Skeleton } from "./components/ui/skeleton";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const ProjectsList = lazy(() => import("./pages/ProjectsList").then(m => ({ default: m.ProjectsList })));
const ProjectBoard = lazy(() => import("./pages/ProjectBoard").then(m => ({ default: m.ProjectBoard })));
const TaskDetail = lazy(() => import("./pages/TaskDetail").then(m => ({ default: m.TaskDetail })));
const TimeTracking = lazy(() => import("./pages/TimeTracking").then(m => ({ default: m.TimeTracking })));
const CreateTask = lazy(() => import("./pages/CreateTask").then(m => ({ default: m.CreateTask })));
const Invoices = lazy(() => import("./pages/Invoices").then(m => ({ default: m.Invoices })));
const ClientPortal = lazy(() => import("./pages/ClientPortal").then(m => ({ default: m.ClientPortal })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

const RouteLoading = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-8 w-1/4" />
    <Skeleton className="h-[400px] w-full" />
  </div>
);

export const router = createBrowserRouter([
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
        <RoleSelection />
      </AuthGuard>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      { 
        path: "dashboard", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <Dashboard />
          </Suspense>
        ) 
      },
      { 
        path: "projects", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ProjectsList />
          </Suspense>
        ) 
      },
      { 
        path: "projects/:projectId", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ProjectBoard />
          </Suspense>
        ) 
      },
      { 
        path: "tasks/:taskId", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <TaskDetail />
          </Suspense>
        ) 
      },
      { 
        path: "tasks/new", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <CreateTask />
          </Suspense>
        ) 
      },
      { 
        path: "time", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <TimeTracking />
          </Suspense>
        ) 
      },
      { 
        path: "invoices", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <Invoices />
          </Suspense>
        ) 
      },
      { 
        path: "client", 
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ClientPortal />
          </Suspense>
        ) 
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <NotFound />
      </Suspense>
    ),
  },
]);
