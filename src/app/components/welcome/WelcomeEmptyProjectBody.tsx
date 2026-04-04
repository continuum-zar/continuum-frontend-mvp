/**
 * New project overview (placeholder data + empty sections) — Figma playground node 35:10701.
 * Milestone empty card: 35:11112; section header: 35:11072.
 */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Download, FileText, Link2, X } from "lucide-react";

import {
  downloadProjectAttachment,
  getApiErrorMessage,
  getAttachmentLinkHref,
  getAttachmentLinkLabel,
  mapAttachment,
  useDeleteProjectAttachment,
  useProjectAttachments,
  useProjectRepositories,
  useUnlinkRepository,
  useProjectMembers,
} from "@/api";
import { toast } from "sonner";
import type { Attachment } from "@/types/attachment";
import type { Member } from "@/types/member";
import type { Repository } from "@/types/repository";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

import { AddResourceModal } from "./AddResourceModal";
import { WelcomeLinkRepositoryModal } from "./WelcomeLinkRepositoryModal";
import { WelcomeMetricsRow } from "./WelcomeMetricsRow";
import { WelcomeMilestoneTimeline } from "./WelcomeMilestoneTimeline";
import { WelcomeProjectHeroGauge } from "./WelcomeProjectHeroGauge";

const imgLucidePlus = mcpAsset("91e46d01-6ae8-4fc9-aa4e-13b1040fb3cf");
const imgLucideActivity = mcpAsset("8b04e159-5943-4424-a1ff-8259ce5f1905");
const imgLucidePaperclip = mcpAsset("eca27db3-d7a3-4625-8615-00ef276c3530");
const imgLucideGitBranch = mcpAsset("1638b448-769f-4e9f-b1e0-f8bd6e479808");
const imgLucideUsers = mcpAsset("4202e9d8-d2e7-4542-8b8e-eafd6dcf6d0d");
const imgLucideInfo = mcpAsset("f597ed55-c78f-481a-a433-abcd6a07d507");

/** Matches WelcomeShareProjectModal / welcome Members card avatar palette */
const TEAM_AVATAR_BGS = [
  "bg-[#e19c02]",
  "bg-[#f5c542]",
  "bg-[#3b82f6]",
  "bg-[#8b5cf6]",
  "bg-[#10b981]",
  "bg-[#f17173]",
] as const;

function projectMemberRoleLabel(role: string): string {
  const k = (role || "").toLowerCase().replace(/\s+/g, "_");
  if (k === "project_manager" || k === "projectmanager") return "Project Manager";
  if (k === "client") return "Client";
  return "Developer";
}

function LiveTeamMemberCard({ member }: { member: Member }) {
  const bg = TEAM_AVATAR_BGS[member.id % TEAM_AVATAR_BGS.length];
  const roleLine = projectMemberRoleLabel(member.role);
  return (
    <div className="flex w-full max-w-[260px] shrink-0 flex-col gap-6 rounded-[12px] border border-solid border-[#ebedee] bg-white p-6 shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)]">
      <div className="flex h-10 w-full min-w-0 items-center">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`flex size-[35px] shrink-0 items-center justify-center rounded-full font-['Satoshi',sans-serif] text-[13px] font-medium leading-[0.4] text-white ${bg}`}
          >
            {member.initials}
          </div>
          <div className="flex min-w-0 flex-col font-['Satoshi',sans-serif] font-medium leading-normal">
            <p className="truncate text-[14px] text-[#0b191f]" title={member.name}>
              {member.name}
            </p>
            <p className="truncate text-[12px] text-[#727d83]" title={roleLine}>
              {roleLine}
            </p>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 font-['Satoshi',sans-serif] text-[14px] font-medium leading-normal">
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[#727d83]">Total hours</p>
          <p className="min-w-[34px] overflow-hidden text-ellipsis text-right text-[#0b191f]">0</p>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[#727d83]">Task completed</p>
          <p className="min-w-[34px] overflow-hidden text-ellipsis text-right text-[#0b191f]">0</p>
        </div>
      </div>
    </div>
  );
}

function AddButton({ label = "Add", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
    >
      {label}
      <img alt="" className="size-4" src={imgLucidePlus} />
    </button>
  );
}

function EmptyPlaceholderCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex min-h-[185px] flex-1 items-center justify-center rounded-[12px] bg-white p-6">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative size-12 shrink-0">
          <img alt="" className="absolute block size-full max-w-none" src={icon} />
        </div>
        <p className="font-['Satoshi',sans-serif] text-[16px] font-bold leading-normal text-[#727d83]">{title}</p>
      </div>
    </div>
  );
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LiveResourceRow({ att, projectId }: { att: Attachment; projectId: number }) {
  const isLink = att.kind === "link";
  const deleteMutation = useDeleteProjectAttachment(projectId);
  const [downloading, setDownloading] = useState(false);

  const handleRemove = () => {
    if (!window.confirm("Remove this resource from the project?")) return;
    deleteMutation.mutate(att.id);
  };

  if (isLink) {
    const linkHref = getAttachmentLinkHref(att);
    const linkLabel = getAttachmentLinkLabel(att);
    return (
      <div className="flex w-full items-center gap-2">
        <div className="flex min-h-[34px] min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
          <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
            <Link2 className="size-4 text-[#606d76]" strokeWidth={1.75} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
            {linkHref ? (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                title={linkHref}
                className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#1466ff] underline decoration-[#1466ff]/40 underline-offset-2 hover:text-[#0d52cc]"
              >
                {linkLabel}
              </a>
            ) : (
              <p className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
                {att.filename}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 text-[#606d76] disabled:opacity-50"
          aria-label="Remove"
          disabled={deleteMutation.isPending}
          onClick={handleRemove}
        >
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
          <p className="min-w-0 break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
            {att.filename}
          </p>
          {att.size ? (
            <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83]">{att.size}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={downloading || deleteMutation.isPending}
        className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-[#606d76] transition-colors hover:bg-[#edf0f3] hover:text-[#0b191f] disabled:opacity-50"
        aria-label="Download"
        onClick={async () => {
          setDownloading(true);
          try {
            const { blob, filename } = await downloadProjectAttachment(att.id);
            triggerBlobDownload(blob, filename || att.filename);
          } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to download file"));
          } finally {
            setDownloading(false);
          }
        }}
      >
        <Download className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="inline-flex shrink-0 self-center text-[#606d76] disabled:opacity-50"
        aria-label="Remove"
        disabled={deleteMutation.isPending}
        onClick={handleRemove}
      >
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function LiveRepositoryRow({ repo, projectId }: { repo: Repository; projectId: number }) {
  const unlinkMutation = useUnlinkRepository(projectId);
  const lastIndexed =
    repo.updatedAt && !Number.isNaN(new Date(repo.updatedAt).getTime())
      ? `Last indexed ${formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}`
      : "—";

  const handleRemove = () => {
    if (!window.confirm("Disconnect this repository from the project?")) return;
    unlinkMutation.mutate(repo.id);
  };

  return (
    <div className="flex w-full max-w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
        <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
          <Link2 className="size-4 text-[#606d76]" strokeWidth={1.75} />
        </div>
        <div className="flex min-h-[50px] min-w-0 flex-1 items-center gap-4 border-l border-solid border-[#ededed] py-1.5 pl-4 pr-2">
          <div className="flex min-w-0 flex-1 flex-col justify-center font-['Satoshi',sans-serif] font-medium leading-normal">
            <p className="truncate text-[16px] text-[#0b191f]" title={repo.repositoryUrl}>
              {repo.repositoryUrl}
            </p>
            <p className="max-w-full truncate text-[12px] text-[#727d83]" title={lastIndexed}>
              {lastIndexed}
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center rounded border border-solid border-[#ededed] bg-white px-1 py-0.5">
            <span className="font-['Satoshi',sans-serif] text-[11px] font-medium whitespace-nowrap text-[#727d83]">
              Index
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex shrink-0 text-[#606d76] disabled:opacity-50"
        aria-label="Remove"
        disabled={unlinkMutation.isPending}
        onClick={handleRemove}
      >
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function WelcomeEmptyProjectBody({
  projectId,
  onOpenInviteMembers,
}: {
  projectId: number;
  /** Opens the same share/invite modal as “Invite Members” on the welcome shell */
  onOpenInviteMembers?: () => void;
}) {
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [linkRepoOpen, setLinkRepoOpen] = useState(false);

  const attachmentsQuery = useProjectAttachments(projectId);
  const repositoriesQuery = useProjectRepositories(projectId);
  const membersQuery = useProjectMembers(projectId);

  const attachments = (attachmentsQuery.data ?? []).map(mapAttachment);
  const repositories = repositoriesQuery.data ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div className="relative flex w-full min-w-0 flex-col items-center gap-16 pb-8 pt-12">
      <AddResourceModal
        open={addResourceOpen}
        onOpenChange={setAddResourceOpen}
        projectId={projectId}
      />
      <WelcomeLinkRepositoryModal open={linkRepoOpen} onOpenChange={setLinkRepoOpen} projectId={projectId} />

      <div className="flex w-full max-w-[815px] flex-col items-center gap-16">
        <WelcomeProjectHeroGauge />
        <WelcomeMetricsRow />
      </div>

      <div className="flex w-full max-w-[815px] flex-col">
        <WelcomeMilestoneTimeline variant="live" projectId={projectId} />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Recent activity</p>
        <EmptyPlaceholderCard icon={imgLucideActivity} title="No recent activity" />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Resources</p>
          <AddButton onClick={() => setAddResourceOpen(true)} />
        </div>
        {attachmentsQuery.isLoading ? (
          <div className="flex min-h-[185px] w-full items-center justify-center rounded-[12px] bg-white font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
            Loading resources…
          </div>
        ) : attachments.length === 0 ? (
          <EmptyPlaceholderCard icon={imgLucidePaperclip} title="No resources attached" />
        ) : (
          <div className="flex w-full flex-col gap-4">
            {attachments.map((att) => (
              <LiveResourceRow key={att.id} att={att} projectId={projectId} />
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Repository</p>
          <AddButton label="Connect" onClick={() => setLinkRepoOpen(true)} />
        </div>
        {repositoriesQuery.isLoading ? (
          <div className="flex min-h-[185px] w-full items-center justify-center rounded-[12px] bg-white font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
            Loading repositories…
          </div>
        ) : repositories.length === 0 ? (
          <EmptyPlaceholderCard icon={imgLucideGitBranch} title="No repositories connected" />
        ) : (
          <div className="flex w-full flex-col gap-4">
            {repositories.map((repo) => (
              <LiveRepositoryRow key={repo.id} repo={repo} projectId={projectId} />
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Team</p>
            <div className="relative size-4 shrink-0">
              <img alt="" className="absolute block size-full max-w-none" src={imgLucideInfo} />
            </div>
          </div>
          <AddButton label="Invite Members" onClick={onOpenInviteMembers} />
        </div>
        {membersQuery.isLoading ? (
          <div className="flex min-h-[185px] w-full items-center justify-center rounded-[12px] bg-white font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
            Loading team…
          </div>
        ) : membersQuery.isError ? (
          <div className="flex min-h-[185px] w-full flex-col items-center justify-center rounded-[12px] border border-solid border-[#ebedee] bg-white px-4 text-center font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
            Could not load team members.
          </div>
        ) : members.length === 0 ? (
          <EmptyPlaceholderCard icon={imgLucideUsers} title="No members assigned" />
        ) : (
          <div className="flex w-full flex-wrap gap-4">
            {members.map((m) => (
              <LiveTeamMemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
