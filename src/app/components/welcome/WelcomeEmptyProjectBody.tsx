/**
 * New project overview (placeholder data + empty sections) — Figma playground node 35:10701.
 * Milestone empty card: 35:11112; section header: 35:11072.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseApiUtcDateTime } from "@/lib/parseApiUtcDateTime";
import { Download, FileText, Link2, Loader2, X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import {
  downloadProjectAttachment,
  fetchClassificationBreakdown,
  fetchMemberContributions,
  fetchProjectHealth,
  fetchProjectStats,
  getApiErrorMessage,
  getAttachmentLinkHref,
  getAttachmentLinkLabel,
  mapAttachment,
  useDeleteProjectAttachment,
  useProjectAttachments,
  useProjectRepositories,
  useProjectMembers,
  useScanRepository,
  useUnlinkRepository,
  useWikiScanStatus,
} from "@/api";
import type { ScanStatusResponse } from "@/api";
import { toast } from "sonner";
import type { Attachment } from "@/types/attachment";
import type { Member } from "@/types/member";
import type { Repository } from "@/types/repository";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

import { AddResourceModal } from "./AddResourceModal";
import { WelcomeLinkRepositoryModal } from "./WelcomeLinkRepositoryModal";
import { LiveHeroGauge, LiveMetricsRow } from "./LiveProjectGauges";
import { WelcomeMilestoneTimeline } from "./WelcomeMilestoneTimeline";

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

function LiveTeamMemberCard({
  member,
  totalHours,
  tasksCompleted,
}: {
  member: Member;
  /** null while contribution stats are loading */
  totalHours: number | null;
  tasksCompleted: number | null;
}) {
  const bg = TEAM_AVATAR_BGS[member.id % TEAM_AVATAR_BGS.length];
  const roleLine = projectMemberRoleLabel(member.role);
  const fmt = (n: number | null) =>
    n === null ? "…" : String(Math.round(Number(n)));
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
          <p className="min-w-[34px] overflow-hidden text-ellipsis text-right tabular-nums text-[#0b191f]">{fmt(totalHours)}</p>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[#727d83]">Task completed</p>
          <p className="min-w-[34px] overflow-hidden text-ellipsis text-right tabular-nums text-[#0b191f]">{fmt(tasksCompleted)}</p>
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

function repositoryStatusSubtitle(
  scan: ScanStatusResponse | undefined,
  scanLoading: boolean,
): string {
  if (scanLoading && !scan) return "Loading status…";
  const isScanning = scan?.is_scanning ?? false;
  if (isScanning) return "Indexing…";
  const files = scan?.files_indexed ?? 0;
  const lastAt = parseApiUtcDateTime(scan?.last_scanned_at);
  const parts: string[] = [];
  if (files > 0) parts.push(`${files} file${files === 1 ? "" : "s"} indexed`);
  if (lastAt) {
    parts.push(`Last indexed ${formatDistanceToNow(lastAt, { addSuffix: true })}`);
  }
  if (parts.length > 0) return parts.join(" · ");
  return "Not indexed yet";
}

function LiveRepositoryRow({
  repo,
  projectId,
  scanStatus,
  scanLoading,
  onIndex,
  isIndexPending,
}: {
  repo: Repository;
  projectId: number;
  scanStatus: ScanStatusResponse | undefined;
  scanLoading: boolean;
  onIndex: () => void;
  isIndexPending: boolean;
}) {
  const unlinkMutation = useUnlinkRepository(projectId);
  const isScanning = (scanStatus?.is_scanning ?? false) || isIndexPending;
  const subtitle = repositoryStatusSubtitle(scanStatus, scanLoading);
  const indexDisabled = isScanning;

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
            <p className="max-w-full truncate text-[12px] text-[#727d83]" title={subtitle}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            disabled={indexDisabled}
            onClick={onIndex}
            title="Index this repository so AI can use code context"
            className="flex shrink-0 items-center justify-center gap-1 rounded border border-solid border-[#ededed] bg-white px-2 py-0.5 font-['Satoshi',sans-serif] text-[11px] font-medium whitespace-nowrap text-[#727d83] outline-none hover:bg-[#f7f8f9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isScanning ? (
              <Loader2 className="size-3 shrink-0 animate-spin" strokeWidth={2} aria-hidden />
            ) : null}
            {isScanning ? "Indexing…" : "Index"}
          </button>
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
  const previouslyScanningRepoIdsRef = useRef<Set<number>>(new Set());

  const attachmentsQuery = useProjectAttachments(projectId);
  const repositoriesQuery = useProjectRepositories(projectId);
  const membersQuery = useProjectMembers(projectId);
  const wikiScanStatusQuery = useWikiScanStatus(projectId);
  const scanRepositoryMutation = useScanRepository(projectId);

  useEffect(() => {
    const data = wikiScanStatusQuery.data;
    if (!data) return;
    const nowScanning = new Set(data.filter((s) => s.is_scanning).map((s) => s.repository_id));
    const prev = previouslyScanningRepoIdsRef.current;
    const finished = [...prev].filter((id) => !nowScanning.has(id));
    if (finished.length > 0) {
      toast.success(
        finished.length === 1
          ? "Repository indexing complete."
          : `${finished.length} repositories finished indexing.`,
      );
    }
    previouslyScanningRepoIdsRef.current = nowScanning;
  }, [wikiScanStatusQuery.data]);

  const { data: statsData } = useQuery({
    queryKey: ["projects", projectId, "stats"],
    queryFn: () => fetchProjectStats(projectId),
    enabled: projectId != null,
    staleTime: 60_000,
  });
  const { data: healthData } = useQuery({
    queryKey: ["projects", projectId, "health"],
    queryFn: () => fetchProjectHealth(projectId),
    enabled: projectId != null,
    staleTime: 60_000,
  });
  const { data: classificationData } = useQuery({
    queryKey: ["projects", projectId, "classification-breakdown"],
    queryFn: () => fetchClassificationBreakdown(projectId),
    enabled: projectId != null,
    staleTime: 60_000,
  });
  const { data: memberContributions = [], isPending: contributionsLoading } = useQuery({
    queryKey: ["projects", projectId, "member-contributions"],
    queryFn: () => fetchMemberContributions(projectId),
    enabled: projectId != null,
    staleTime: 60_000,
  });

  const contributionByUserId = useMemo(() => {
    const map = new Map<number, { total_hours: number; total_tasks_completed: number }>();
    for (const c of memberContributions) {
      map.set(c.user_id, {
        total_hours: c.total_hours ?? 0,
        total_tasks_completed: c.total_tasks_completed ?? 0,
      });
    }
    return map;
  }, [memberContributions]);

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
        <LiveHeroGauge score={statsData?.progress_percentage ?? 0} />
        <LiveMetricsRow
          hpsRatio={healthData?.hps_ratio ?? 0}
          completedWeight={statsData?.completed_weight ?? 0}
          totalWeight={statsData?.total_weight ?? 0}
          trivialCommits={classificationData?.trivial ?? 0}
          incrementalCommits={classificationData?.incremental ?? 0}
          structuralCommits={classificationData?.structural ?? 0}
        />
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
            {repositories.map((repo) => {
              const scanStatus = wikiScanStatusQuery.data?.find((s) => s.repository_id === repo.id);
              const isIndexPending =
                scanRepositoryMutation.isPending &&
                scanRepositoryMutation.variables?.repository_id === repo.id;
              return (
                <LiveRepositoryRow
                  key={repo.id}
                  repo={repo}
                  projectId={projectId}
                  scanStatus={scanStatus}
                  scanLoading={wikiScanStatusQuery.isLoading}
                  isIndexPending={isIndexPending}
                  onIndex={() => scanRepositoryMutation.mutate({ repository_id: repo.id })}
                />
              );
            })}
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
            {members.map((m) => {
              const stats = contributionByUserId.get(m.userId);
              return (
                <LiveTeamMemberCard
                  key={m.id}
                  member={m}
                  totalHours={contributionsLoading ? null : (stats?.total_hours ?? 0)}
                  tasksCompleted={contributionsLoading ? null : (stats?.total_tasks_completed ?? 0)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
