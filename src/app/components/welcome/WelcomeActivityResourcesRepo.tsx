"use client";

import { useState } from "react";
import { Activity, FileText, Link2, Plus, X } from "lucide-react";

import {
  welcomeRecentActivityMock,
  welcomeRepoMock,
  welcomeResourcesMock,
  type WelcomeResourceItem,
} from "@/app/data/welcomeDashboardMock";
import { AddResourceModal } from "./AddResourceModal";

const addButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]";

function ResourceRow({ item }: { item: WelcomeResourceItem }) {
  if (item.kind === "link") {
    return (
      <div className="flex w-full items-center gap-2">
        <div className="flex min-h-[34px] min-w-0 max-w-[474px] flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2 sm:max-w-none">
          <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
            <Link2 className="size-4 text-[#606d76]" strokeWidth={1.75} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
            <p className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
              {item.url}
            </p>
          </div>
        </div>
        <button type="button" className="inline-flex shrink-0 text-[#606d76]" aria-label="Remove">
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
        <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
          <FileText className="size-4 text-[#606d76]" strokeWidth={1.75} />
        </div>
        <div className="flex min-h-[50px] min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
          <p className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
            {item.name}
          </p>
          <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83]">
            {item.sizeLabel}
          </p>
        </div>
      </div>
      <button type="button" className="inline-flex shrink-0 self-center text-[#606d76]" aria-label="Remove">
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function WelcomeRecentActivity() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <p className="font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal whitespace-nowrap text-[#0b191f]">
          Recent activity
        </p>
      </div>
      <div className="relative flex flex-col gap-4">
        <div
          className="pointer-events-none absolute top-[25px] bottom-[25px] left-[24px] w-px bg-[#e4eaec]"
          aria-hidden
        />
        {welcomeRecentActivityMock.map((entry) => (
          <div key={entry.id} className="relative z-[1] flex items-start overflow-hidden rounded-[8px] pr-2">
            <div className="flex w-[50px] shrink-0 justify-center">
              <div className="flex size-[50px] shrink-0 items-center justify-center rounded-[99px] bg-[#edf0f3]">
                <Activity className="size-4 text-[#606d76]" strokeWidth={1.75} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center py-1.5 pl-4 pr-2">
              <p className="w-[183px] max-w-full truncate font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83]">
                {entry.time}
              </p>
              <p className="font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
                {entry.title}
              </p>
              <p className="truncate font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83] whitespace-nowrap">
                {entry.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WelcomeResources() {
  const [addResourceOpen, setAddResourceOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <AddResourceModal open={addResourceOpen} onOpenChange={setAddResourceOpen} />
      <div className="flex w-full items-center justify-between">
        <p className="font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal whitespace-nowrap text-[#0b191f]">
          Resources
        </p>
        <button type="button" className={addButtonClass} onClick={() => setAddResourceOpen(true)}>
          Add
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex w-full flex-col gap-4">
        {welcomeResourcesMock.map((item) => (
          <ResourceRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function WelcomeRepo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <p className="font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal whitespace-nowrap text-[#0b191f]">
          Repository
        </p>
        <button type="button" className={addButtonClass}>
          Connect
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex w-full flex-col gap-4">
        {welcomeRepoMock.map((repo) => (
          <div key={repo.id} className="flex max-w-full items-center gap-2">
            <div className="flex min-w-0 max-w-[474px] flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
              <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
                <Link2 className="size-4 text-[#606d76]" strokeWidth={1.75} />
              </div>
              <div className="flex min-h-[50px] min-w-0 flex-1 items-center gap-4 border-l border-solid border-[#ededed] py-1.5 pl-4 pr-2">
                <div className="flex min-w-0 flex-1 flex-col justify-center font-['Satoshi',sans-serif] font-medium leading-normal">
                  <p className="text-[16px] text-[#0b191f]">{repo.url}</p>
                  <p className="max-w-[183px] truncate text-[12px] text-[#727d83]">{repo.lastIndexed}</p>
                </div>
                <div className="flex shrink-0 items-center justify-center rounded border border-solid border-[#ededed] bg-white px-1 py-0.5">
                  <span className="font-['Satoshi',sans-serif] text-[11px] font-medium whitespace-nowrap text-[#727d83]">
                    Index
                  </span>
                </div>
              </div>
            </div>
            <button type="button" className="inline-flex shrink-0 text-[#606d76]" aria-label="Remove">
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
