import { createBrowserRouter } from "react-router";
import { Login } from "./pages/auth/Login";
import { SignUp } from "./pages/auth/SignUp";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { RoleSelection } from "./pages/RoleSelection";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { ProjectsList } from "./pages/ProjectsList";
import { ProjectBoard } from "./pages/ProjectBoard";
import { TaskDetail } from "./pages/TaskDetail";
import { TimeTracking } from "./pages/TimeTracking";
import { CreateTask } from "./pages/CreateTask";
import { Invoices } from "./pages/Invoices";
import { ClientPortal } from "./pages/ClientPortal";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
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
    Component: RoleSelection,
  },
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "projects", Component: ProjectsList },
      { path: "projects/:projectId", Component: ProjectBoard },
      { path: "tasks/:taskId", Component: TaskDetail },
      { path: "tasks/new", Component: CreateTask },
      { path: "time", Component: TimeTracking },
      { path: "invoices", Component: Invoices },
      { path: "client", Component: ClientPortal },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
