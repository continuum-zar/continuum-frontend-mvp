"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Check, Github, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { useLinkRepository, useProjectRepositories } from "@/api";
import { getGitHubOAuthAuthorizeLocation } from "@/api/githubApp";
import { isGithubInstallationAccessExpiredError } from "@/api/githubInstallationAccessError";
import { getApiErrorMessage, useGithubInstallationRepositories } from "@/api/hooks";
import { rememberGithubOAuthReturnPath } from "@/lib/githubOAuthReturn";
import type { GitHubInstallationRepository } from "@/types/githubApp";
import type { Repository } from "@/types/repository";

import { cn } from "../ui/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(141.68deg, #24B5F8 -123.02%, #5521FE 802.55%)";

function installationRepoFullName(r: GitHubInstallationRepository): string {
  return `${r.owner.login}/${r.name}`;
}

function linkedRepoKey(repo: Repository): string {
  const fn = repo.fullName?.trim();
  if (fn) return fn.toLowerCase();
  const url = repo.repositoryUrl || "";
  const m = url.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/|$)/i);
  if (m?.[1]) return m[1].toLowerCase();
  return (repo.repositoryName || "").toLowerCase();
}

export type GitHubInstallationRepoLinkerProps = {
  projectId: number;
  /** When false, skip installation and linked-repo fetches (e.g. parent dialog closed). */
  queryEnabled?: boolean;
  onRepoLinked?: () => void;
};

export function GitHubInstallationRepoLinker({
  projectId,
  queryEnabled = true,
  onRepoLinked,
}: GitHubInstallationRepoLinkerProps) {
  const [connectBusy, setConnectBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGithubRepoId, setSelectedGithubRepoId] = useState<number | null>(null);

  const reposQuery = useGithubInstallationRepositories(projectId, queryEnabled);
  const linkedQuery = useProjectRepositories(queryEnabled ? projectId : null);
  const linkMutation = useLinkRepository(queryEnabled ? projectId : null);

  const linkedKeys = useMemo(() => {
    const next = new Set<string>();
    for (const r of linkedQuery.data ?? []) {
      if (r.provider === "github") {
        const k = linkedRepoKey(r);
        if (k) next.add(k);
      }
    }
    return next;
  }, [linkedQuery.data]);

  useEffect(() => {
    if (!queryEnabled) {
      setSearch("");
      setSelectedGithubRepoId(null);
    }
  }, [queryEnabled]);

  const axiosStatus = isAxiosError(reposQuery.error) ? reposQuery.error.response?.status : undefined;
  const notConnected = axiosStatus === 404;
  const accessExpired =
    reposQuery.isError && isGithubInstallationAccessExpiredError(reposQuery.error);
  const forbidden = axiosStatus === 403 && !accessExpired;
  const serviceUnavailable = axiosStatus === 503;
  const connected = reposQuery.isSuccess;

  const filteredRepos = useMemo(() => {
    const list = reposQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const full = installationRepoFullName(r).toLowerCase();
      return (
        full.includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.owner.login.toLowerCase().includes(q)
      );
    });
  }, [reposQuery.data, search]);

  const selectedRepo = useMemo(() => {
    if (selectedGithubRepoId == null) return null;
    return (reposQuery.data ?? []).find((r) => r.id === selectedGithubRepoId) ?? null;
  }, [reposQuery.data, selectedGithubRepoId]);

  const selectedKey = selectedRepo ? installationRepoFullName(selectedRepo).toLowerCase() : null;
  const selectedAlreadyLinked = selectedKey != null && linkedKeys.has(selectedKey);

  const handleConnect = async () => {
    setConnectBusy(true);
    try {
      const url = await getGitHubOAuthAuthorizeLocation(projectId);
      rememberGithubOAuthReturnPath(
        `${window.location.pathname}${window.location.search}`,
        { reopenSettings: true },
      );
      window.location.assign(url);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not start GitHub connection"));
      setConnectBusy(false);
    }
  };

  const handleLinkSelected = async () => {
    if (!selectedRepo || selectedAlreadyLinked) return;
    const fullName = installationRepoFullName(selectedRepo);
    const repository_url = `https://github.com/${fullName}`;
    try {
      await linkMutation.mutateAsync({
        repository_url,
        repository_name: fullName,
        provider: "github",
      });
      setSelectedGithubRepoId(null);
      onRepoLinked?.();
    } catch {
      /* toast handled in useLinkRepository */
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] leading-relaxed text-[#606d76]">
        Link the GitHub App to this project. After you authorize on GitHub, choose a repository to link for webhooks and
        indexing.
      </p>

      <div className="flex flex-col gap-2 rounded-[8px] border border-[#e9e9e9] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Github className="size-5 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
          <p className="text-[15px] font-semibold text-[#0b191f]">Connection</p>
        </div>
        {reposQuery.isLoading ? (
          <p className="flex items-center gap-2 text-[14px] text-[#606d76]">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Checking status…
          </p>
        ) : reposQuery.isError ? (
          <>
            {notConnected ? (
              <p className="text-[14px] text-[#606d76]">
                Not connected yet. Use <span className="font-medium text-[#0b191f]">Connect to GitHub</span> to authorize
                the app for this project.
              </p>
            ) : accessExpired ? (
              <p className="text-[14px] text-[#0b191f]">
                <span className="font-medium">Your GitHub access has expired.</span>{" "}
                Reconnect so Continuum can list repositories and keep indexing up to date.
              </p>
            ) : forbidden ? (
              <p className="text-[14px] text-[#0b191f]">
                You don&apos;t have access to this project&apos;s GitHub data. Ask a project admin to connect or grant
                access.
              </p>
            ) : serviceUnavailable ? (
              <p className="text-[14px] text-[#0b191f]">
                GitHub App integration isn&apos;t configured on the server (missing app credentials).
              </p>
            ) : (
              <p className="text-[14px] text-[#0b191f]">
                {getApiErrorMessage(reposQuery.error, "Could not load GitHub status.")}
              </p>
            )}
          </>
        ) : connected ? (
          <p className="flex items-center gap-2 text-[14px] font-medium text-[#0b191f]">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#22c55e]">
              <Check className="size-3.5 text-white" strokeWidth={2.5} aria-hidden />
            </span>
            Connected — {reposQuery.data?.length ?? 0} repo
            {(reposQuery.data?.length ?? 0) === 1 ? "" : "s"} visible to the installation
          </p>
        ) : null}

        {connectBusy ? (
          <div className="mt-1 inline-flex h-10 items-center gap-2 text-[14px] text-[#606d76]">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Redirecting…
          </div>
        ) : connected ? (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={reposQuery.isLoading}
            className="mt-1 self-start text-[13px] font-semibold text-[#5521FE] underline underline-offset-2 transition-colors hover:text-[#3b19b0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reconnect to GitHub
          </button>
        ) : accessExpired ? (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={reposQuery.isLoading || connectBusy}
            style={{ background: PRIMARY_GRADIENT }}
            className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-[8px] text-[14px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px] sm:self-start"
          >
            Reconnect to GitHub
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={reposQuery.isLoading || connectBusy}
            style={{ background: PRIMARY_GRADIENT }}
            className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-[8px] text-[14px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[180px] sm:self-start"
          >
            Connect to GitHub
          </button>
        )}
      </div>

      {connected && (reposQuery.data?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-[#252014]">Repositories</p>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9fa5a8]"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by owner or name…"
              className="h-10 w-full rounded-[8px] border border-[#e9e9e9] bg-white py-2 pr-3 pl-10 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search repositories"
            />
          </div>
          <ul className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
            {filteredRepos.map((r) => {
              const full = installationRepoFullName(r);
              const isLinked = linkedKeys.has(full.toLowerCase());
              const isSelected = selectedGithubRepoId === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={isLinked}
                    onClick={() => setSelectedGithubRepoId(r.id)}
                    className={cn(
                      "flex w-full flex-col rounded-[6px] border px-3 py-2 text-left font-['Inter',sans-serif] text-[13px] text-[#0b191f] transition-colors",
                      isLinked
                        ? "cursor-not-allowed border-[#f0f0f0] bg-[#f5f5f5] opacity-70"
                        : isSelected
                          ? "border-[#5521FE] bg-[#f5f3ff]"
                          : "border-[#f0f0f0] bg-[#fafafa] hover:border-[#d4d4d4]",
                    )}
                  >
                    <span className="font-medium">
                      <span>{r.owner.login}</span>
                      <span className="text-[#606d76]"> / </span>
                      <span>{r.name}</span>
                      {isLinked ? (
                        <span className="ml-2 inline-block rounded-full bg-[#e8e8e8] px-2 py-0.5 text-[11px] font-medium text-[#606d76]">
                          Already linked
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {filteredRepos.length === 0 ? (
            <p className="text-[13px] text-[#606d76]">No repositories match your search.</p>
          ) : null}
          <button
            type="button"
            disabled={
              !selectedRepo ||
              selectedAlreadyLinked ||
              linkMutation.isPending
            }
            onClick={() => void handleLinkSelected()}
            style={
              selectedRepo && !selectedAlreadyLinked && !linkMutation.isPending
                ? { background: PRIMARY_GRADIENT }
                : undefined
            }
            className={cn(
              "inline-flex h-10 w-full items-center justify-center rounded-[8px] text-[14px] font-semibold transition-[filter,opacity]",
              selectedRepo && !selectedAlreadyLinked && !linkMutation.isPending
                ? "text-white hover:brightness-105"
                : "cursor-not-allowed bg-[rgba(96,109,118,0.1)] text-[#606d76]/70",
            )}
          >
            {linkMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Linking…
              </>
            ) : (
              "Link selected repository"
            )}
          </button>
        </div>
      ) : null}

      {connected && reposQuery.data?.length === 0 ? (
        <p className="text-[13px] text-[#606d76]">
          Installation is linked, but no repositories were returned yet. Confirm the GitHub App is installed on your org
          or account with repository access.
        </p>
      ) : null}
    </div>
  );
}
