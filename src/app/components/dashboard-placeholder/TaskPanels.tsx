"use client";

import { Activity, ArrowLeft, CalendarPlus, Check, ChevronDown, FileText, Flag, Link2, Plus, Tag, UserRoundPlus, X } from "lucide-react";
import { welcomeResourcesMock } from "@/app/data/welcomeDashboardMock";

type TaskPanelsProps = {
  onBack: () => void;
};

const activityMock = [
  { time: "07:12", title: "Quality assurance", detail: "Status changed from in progress to complete" },
  { time: "1 Day ago", title: "Daniel Max", detail: "Team member was removed from the project" },
  { time: "10 February 2026", title: "Todd Phillips", detail: "Project manager deleted 2 tasks" },
  { time: "10 February 2026", title: "Todd Phillips", detail: "Project manager deleted 2 tasks" },
];

export function TaskPanels({ onBack }: TaskPanelsProps) {
  return (
    <div className="flex h-full w-full min-h-0 items-stretch">
      <main className="min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-[#f9fafb] p-4">
        <div className="mx-auto w-full max-w-[600px]">
          <div className="flex items-center justify-between py-4">
            <button type="button" onClick={onBack} className="text-[#606d76]">
              <ArrowLeft size={20} />
            </button>
            <p className="text-[16px] font-medium tracking-[-0.16px] text-[#595959]">Update Task</p>
            <Flag size={16} className="text-[#606d76]" />
          </div>

          <div className="space-y-12 py-4">
            <section className="space-y-4">
              <h2 className="text-[24px] font-medium leading-[1.2] tracking-[-0.24px] text-[#0b191f]">
                Set up high-fidelity prototypes with conditional logic
              </h2>
              <div>
                <p className="mb-1 text-[14px] font-medium text-[#606d76]">Description</p>
                <div className="h-[106px] rounded-[8px] border border-[#e9e9e9] bg-white p-4">
                  <p className="text-[16px] font-medium text-[#0b191f]">
                    A long description goes here, this space will only show two lines before truncation.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Checklist</p>
                <button className="flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white shadow-sm">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  ["Verify all UI elements render correctly", false],
                  ["Confirm data is displayed accurately", false],
                  ["Ensure smooth transitions between views", false],
                  ["Validate input fields accept correct data", true],
                  ["Test responsiveness on different devices", true],
                  ["Check for console errors or warnings", true],
                ].map(([label, done]) => (
                  <div key={String(label)} className="flex items-center gap-4">
                    <div className={`flex size-5 items-center justify-center rounded-[4px] ${done ? "bg-[#24B5F8]" : "border border-[#ebedee] bg-[#f9f9f9]"}`}>
                      {done ? <Check size={13} className="text-white" /> : null}
                    </div>
                    <p
                      className={`font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal ${done ? "text-[#0b191f]/50 line-through" : "text-[#0b191f]"}`}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Tags</p>
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_8px_2px_0px_rgba(14,14,34,0),0px_5px_2px_0px_rgba(14,14,34,0.01),0px_3px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                >
                  <Tag size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Wireframes", "Prototypes", "User Flows", "Design Systems", "Usability Testing", "Final Mockups", "User Testing Feedback"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center justify-center rounded-[16px] border border-[#cdd2d5] bg-white px-4 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Due Date</p>
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_8px_2px_0px_rgba(14,14,34,0),0px_5px_2px_0px_rgba(14,14,34,0.01),0px_3px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                >
                  <CalendarPlus size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["1 Hour", "4 Hours", "8 Hours", "12 Hours", "48 Hours"].map((v, idx) => (
                  <span key={v} className={`rounded-[16px] px-4 py-1 text-[14px] font-medium ${idx === 0 ? "bg-[#0b191f] text-white" : "border border-[#cdd2d5] text-[#606d76]"}`}>
                    {v}
                  </span>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Resources</p>
                <button className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 text-[14px] font-medium text-[#0b191f]">
                  Add <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {welcomeResourcesMock.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-[#ededed] pr-2">
                      <div className="flex w-[50px] items-center justify-center bg-[#edf0f3]">
                        {item.kind === "link" ? <Link2 className="size-4 text-[#606d76]" /> : <FileText className="size-4 text-[#606d76]" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-[#ededed] px-4 py-1.5">
                        <p className="truncate text-[16px] font-medium text-[#0b191f]">{item.kind === "link" ? item.url : item.name}</p>
                        {item.kind === "file" ? <p className="text-[12px] text-[#727d83]">{item.sizeLabel}</p> : null}
                      </div>
                    </div>
                    <button type="button" className="text-[#606d76]">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Assigned to</p>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-[12px] border border-[#ebedee] bg-white text-[#0b191f] shadow-[0px_8px_2px_0px_rgba(14,14,34,0),0px_5px_2px_0px_rgba(14,14,34,0.01),0px_3px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                >
                  <UserRoundPlus size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { id: "fa", label: "FA", color: "#E8A303", checked: true, ring: true },
                  { id: "gb", label: "GB", color: "#EE7F84", checked: true, ring: true },
                  { id: "hc", label: "HC", color: "#7157E7", checked: false, ring: false },
                  { id: "je", label: "JE", color: "#4A9FF8", checked: true, ring: true },
                ].map((user) => (
                  <div key={user.id} className="relative">
                    <div
                      className={`flex size-[40px] items-center justify-center rounded-full text-[16px] font-medium leading-none text-white ${
                        user.ring ? "border-2 border-[#0b191f]" : ""
                      }`}
                      style={{ backgroundColor: user.color }}
                    >
                      {user.label}
                    </div>
                    {user.checked ? (
                      <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-black">
                        <Check size={10} className="text-white" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-[#ebedee] pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled
                  className="h-12 rounded-[12px] bg-[#ebedee] px-8 text-[14px] font-medium text-[#9ea7ad] disabled:cursor-not-allowed"
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="min-h-0 w-[362px] overflow-y-auto border-l border-[#ebedee] bg-white p-9">
        <div className="space-y-12 pb-10">
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Status</p>
            <button className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
              <span className="text-[16px] font-medium text-[#0b191f]">To-Do</span>
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Scope</p>
            <button className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
              <span className="text-[16px] font-medium text-[#0b191f]">Medium (M)</span>
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="space-y-2 text-[16px]">
            <p className="mb-4 text-[16px] font-medium text-[#0b191f]">Dates</p>
            <div className="flex justify-between"><span className="text-[#727d83]">Created</span><span className="text-[#0b191f]">20 February 2026</span></div>
            <div className="flex justify-between"><span className="text-[#727d83]">Last update</span><span className="text-[#0b191f]">10 March 2026</span></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-medium text-[#0b191f]">Time tracked</p>
              <button className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#24B5F8] px-4 text-[14px] font-medium text-white">
                <Plus size={16} />
                Log Time
              </button>
            </div>
            <div className="flex justify-between text-[16px]">
              <span className="text-[#727d83]">Logged</span>
              <span className="text-[#0b191f]">120.30</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Activity</p>
            {activityMock.map((a, idx) => (
              <div key={`${a.time}-${idx}`} className="flex gap-4">
                <div className="mt-1 flex size-[50px] shrink-0 items-center justify-center rounded-[99px] bg-[#edf0f3]">
                  <Activity size={16} className="text-[#727d83]" />
                </div>
                <div>
                  <p className="text-[12px] text-[#727d83]">{a.time}</p>
                  <p className="text-[16px] leading-none text-[#0b191f]">{a.title}</p>
                  <p className="text-[12px] text-[#727d83]">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
