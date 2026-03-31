import { useMemo, useState } from "react";
import { Bell, Ellipsis, Flag, GripVertical, Share, Target } from "lucide-react";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";

type AssignedTask = {
  id: number;
  task: string;
  project: string;
  description: string;
  assignees: string[];
  dueDate: string;
  progress: string;
};

const SPRINT_TASKS: AssignedTask[] = [
  {
    id: 1,
    task: "Task title goes here",
    project: "Untitled long project_name_1",
    description:
      "A long description goes here, this space will only show two lines before truncation",
    assignees: ["FA", "AS", "GV"],
    dueDate: "22 December 2025",
    progress: "0%",
  },
];

const tabBtn = (active: boolean) =>
  `rounded-[8px] px-4 py-2 text-[14px] font-medium ${
    active
      ? "border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
      : "text-[#606d76]"
  }`;

export function DashboardPlaceholderAssigned() {
  const [tab, setTab] = useState<"Sprint" | "Time logs" | "Activity">("Sprint");

  const tasks = useMemo(
    () => (tab === "Sprint" ? SPRINT_TASKS : []),
    [tab]
  );

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[10px]">
          <DashboardLeftRail />

          <section className="z-[1] flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-clip overflow-y-auto rounded-[8px] border border-[#ebedee] bg-white px-6 py-4 shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#606d76]">
                <Target size={16} />
                <p className="text-[16px]">Assigned to Me</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
                  <Bell size={16} />
                </button>
                <button className="flex h-8 items-center gap-2 rounded-[8px] border border-[#ededed] bg-white px-4 text-[14px] text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
                  <Share size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-[#ebedee]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[32px] font-medium text-[#0b191f]">Assigned to Me</p>
                <Ellipsis size={16} className="text-[#0b191f]" />
              </div>
              <div className="rounded-[10px] bg-[#f0f3f5] p-[2px]">
                <button className={tabBtn(tab === "Sprint")} onClick={() => setTab("Sprint")}>
                  Sprint
                </button>
                <button className={tabBtn(tab === "Time logs")} onClick={() => setTab("Time logs")}>
                  Time logs
                </button>
                <button className={tabBtn(tab === "Activity")} onClick={() => setTab("Activity")}>
                  Activity
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex w-[286px] flex-col items-center gap-4 text-[#727d83]">
                  <Target size={48} />
                  <p className="text-[20px] font-bold">No Tasks Assigned to Me</p>
                  <p className="text-[14px]">TBA</p>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-t-[8px]">
                <div className="grid grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6 border-b border-[#ebedee] bg-[#f0f3f5] px-4 py-3 text-[16px] text-[#606d76]">
                  <p>Task</p>
                  <p>Project</p>
                  <p>Description</p>
                  <p>Assignee</p>
                  <p>Due Date</p>
                  <p>Priority</p>
                  <p>Progres</p>
                  <span />
                </div>
                {tasks.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6 border-b border-[#ebedee] bg-white px-4 py-1"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-[#727d83]" />
                      <p className="text-[16px] text-[#131617]">{row.task}</p>
                    </div>
                    <p className="truncate text-[14px] text-[#727d83]">{row.project}</p>
                    <p className="line-clamp-2 text-[14px] text-[#727d83]">{row.description}</p>
                    <div className="flex items-center">
                      {row.assignees.map((a, i) => (
                        <div
                          key={a}
                          className={`-mr-2 flex h-6 w-6 items-center justify-center rounded-full border border-white text-[9px] text-white ${i === 0 ? "bg-[#e19c02]" : i === 1 ? "bg-[#f17173]" : "bg-[#9da2f7]"}`}
                        >
                          {a}
                        </div>
                      ))}
                    </div>
                    <p className="text-[14px] text-[#697378]">{row.dueDate}</p>
                    <div className="flex justify-center text-[#697378]">
                      <Flag size={16} />
                    </div>
                    <p className="text-[14px] text-[#697378]">{row.progress}</p>
                    <div className="flex justify-center text-[#697378]">
                      <Ellipsis size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
