import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { isApiProjectId } from "../data/dashboardPlaceholderProjects";
import { WORKSPACE_SPRINT_SEGMENT, workspaceJoin } from "@/lib/workspacePaths";

const TaskPanels = lazy(() =>
  import("../components/dashboard-placeholder/TaskPanels").then((m) => ({ default: m.TaskPanels }))
);
const TaskDetail = lazy(() => import("./TaskDetail").then((m) => ({ default: m.TaskDetail })));

function TaskShellFallback() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-white">
      <Loader2 className="size-8 animate-spin text-[#606d76]" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function DashboardPlaceholderTaskView() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("project");

  const isRealTask = projectParam != null && isApiProjectId(projectParam);

  const handleBack = () => {
    if (searchParams.get("from") === "assigned") {
      navigate(workspaceJoin("assigned"));
      return;
    }
    if (searchParams.get("from") === "created") {
      navigate(workspaceJoin("created"));
      return;
    }
    const qs = new URLSearchParams(searchParams);
    qs.delete("from");
    const rest = qs.toString();
    navigate(`${workspaceJoin(WORKSPACE_SPRINT_SEGMENT)}${rest ? `?${rest}` : ""}`);
  };

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px]"
      style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]">
          <DashboardLeftRail />
          <section className="relative z-[1] isolate flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[8px] border border-[#ebedee] border-solid bg-white shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
            <Suspense fallback={<TaskShellFallback />}>
              {isRealTask ? (
                <TaskDetail taskIdOverride={taskId} onBack={handleBack} />
              ) : (
                <TaskPanels
                  onBack={handleBack}
                  taskId={taskId ?? null}
                  projectId={projectParam && isApiProjectId(projectParam) ? projectParam : null}
                />
              )}
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
