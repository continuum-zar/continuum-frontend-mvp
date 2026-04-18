"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { scheduleDeployment } from "@/api/deployments";
import {
  createAdminReleaseNote,
  fetchAdminReleaseNotes,
  releaseNoteKeys,
  updateAdminReleaseNote,
  type ReleaseNoteAdminItem,
} from "@/api/releaseNotes";
import { getApiErrorMessage } from "@/api/hooks";
import { useAuthStore } from "@/store/authStore";
import { WORKSPACE_BASE } from "@/lib/workspacePaths";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

function checklistLinesToItems(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function itemsToLines(items: string[]): string {
  return items.join("\n");
}

export function AdminReleaseNotes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.toLowerCase() ?? "";
  const isGlobalAdmin = role === "admin";

  const [editingId, setEditingId] = useState<number | null>(null);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checklistText, setChecklistText] = useState("");

  const listQuery = useQuery({
    queryKey: releaseNoteKeys.adminList(),
    queryFn: fetchAdminReleaseNotes,
    enabled: isGlobalAdmin,
  });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setVersion("");
    setTitle("");
    setContent("");
    setChecklistText("");
  }, []);

  const loadRow = useCallback((row: ReleaseNoteAdminItem) => {
    setEditingId(row.id);
    setVersion(row.version);
    setTitle(row.title);
    setContent(row.content);
    setChecklistText(itemsToLines(row.checklist_items));
  }, []);

  const createMutation = useMutation({
    mutationFn: createAdminReleaseNote,
    onSuccess: async () => {
      toast.success("Release note created");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: releaseNoteKeys.adminList() });
      await queryClient.invalidateQueries({ queryKey: releaseNoteKeys.latest() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not create release note")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateAdminReleaseNote>[1] }) =>
      updateAdminReleaseNote(id, body),
    onSuccess: async () => {
      toast.success("Release note updated");
      await queryClient.invalidateQueries({ queryKey: releaseNoteKeys.adminList() });
      await queryClient.invalidateQueries({ queryKey: releaseNoteKeys.latest() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not update release note")),
  });

  const scheduleDeploymentMutation = useMutation({
    mutationFn: scheduleDeployment,
    onSuccess: (data) => {
      toast.success(`Deployment alert scheduled — users are notified ${data.minutes_until} minutes ahead.`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not schedule deployment")),
  });

  const rows = listQuery.data ?? [];

  const canSubmit = useMemo(() => {
    return version.trim().length > 0 && title.trim().length > 0 && content.trim().length > 0;
  }, [version, title, content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const checklist_items = checklistLinesToItems(checklistText);
    if (editingId == null) {
      createMutation.mutate({
        version: version.trim(),
        title: title.trim(),
        content,
        checklist_items,
      });
    } else {
      updateMutation.mutate({
        id: editingId,
        body: {
          version: version.trim(),
          title: title.trim(),
          content,
          checklist_items,
        },
      });
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-['Satoshi',sans-serif] text-[#606d76]">
        Sign in required.
      </div>
    );
  }

  if (!isGlobalAdmin) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center font-['Satoshi',sans-serif] text-[16px] text-[#606d76]">
          Only Continuum global administrators can manage release notes. Use a <code className="rounded bg-[#f0f0f0] px-1">@continuum.co.za</code> staff account or ask an admin to update your role.
        </p>
        <button
          type="button"
          className="rounded-[8px] border border-[#ebedee] bg-white px-4 py-2 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] hover:bg-[#f9f9f9]"
          onClick={() => navigate(WORKSPACE_BASE, { replace: true })}
        >
          Back to workspace
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[900px] px-4 py-10 font-['Satoshi',sans-serif]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium text-[#0b191f]">Release notes</h1>
          <p className="mt-1 text-[15px] text-[#727d83]">
            Create and edit product release notes (version, title, description, checklist). The newest entry is shown
            to users via What&apos;s new.
          </p>
        </div>
        <button
          type="button"
          className="rounded-[8px] border border-[#ebedee] bg-white px-4 py-2 text-[14px] font-medium text-[#0b191f] hover:bg-[#f9f9f9]"
          onClick={() => navigate(WORKSPACE_BASE)}
        >
          Close
        </button>
      </div>

      <section className="mb-10 rounded-[12px] border border-[#ebedee] bg-white p-6 shadow-sm">
        <h2 className="text-[18px] font-medium text-[#0b191f]">Product updates</h2>
        <p className="mt-1 text-[14px] text-[#727d83]">
          Send a real-time alert to everyone who is signed in so they can save work before production goes offline for
          this release.
        </p>
        <button
          type="button"
          disabled={scheduleDeploymentMutation.isPending}
          className="mt-4 rounded-[8px] border border-[#ebedee] bg-white px-4 py-2 text-[14px] font-medium text-[#0b191f] hover:bg-[#f9f9f9] disabled:opacity-50"
          onClick={() => scheduleDeploymentMutation.mutate()}
        >
          {scheduleDeploymentMutation.isPending ? "Scheduling…" : "Schedule deployment"}
        </button>
      </section>

      <form onSubmit={handleSubmit} className="mb-12 flex flex-col gap-4 rounded-[12px] border border-[#ebedee] bg-white p-6 shadow-sm">
        <h2 className="text-[18px] font-medium text-[#0b191f]">{editingId == null ? "New release note" : "Edit release note"}</h2>
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-medium text-[#0b191f]">Version</span>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.4.0" required />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-medium text-[#0b191f]">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short headline" required />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-medium text-[#0b191f]">Description</span>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Full release description"
            className="min-h-[120px] resize-y"
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-medium text-[#0b191f]">Checklist items</span>
          <Textarea
            value={checklistText}
            onChange={(e) => setChecklistText(e.target.value)}
            placeholder="One bullet per line"
            className="min-h-[100px] resize-y font-['Inter',sans-serif]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
            className="rounded-[8px] bg-[#0b191f] px-4 py-2 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {editingId == null ? "Create" : "Save changes"}
          </button>
          {editingId != null ? (
            <button
              type="button"
              className="rounded-[8px] border border-[#ebedee] bg-white px-4 py-2 text-[14px] font-medium text-[#0b191f] hover:bg-[#f9f9f9]"
              onClick={resetForm}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <section>
        <h2 className="mb-4 text-[18px] font-medium text-[#0b191f]">Existing notes</h2>
        {listQuery.isLoading ? (
          <p className="text-[14px] text-[#727d83]">Loading…</p>
        ) : listQuery.isError ? (
          <p className="text-[14px] text-red-600">Could not load list.</p>
        ) : rows.length === 0 ? (
          <p className="text-[14px] text-[#727d83]">No release notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#ebedee] bg-[#fafafa] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#0b191f]">
                    <span className="text-[#727d83]">v{row.version}</span> — {row.title}
                  </p>
                  <p className="text-[12px] text-[#9fa5a8]">
                    {new Date(row.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-[8px] border border-[#ebedee] bg-white px-3 py-1.5 text-[13px] font-medium text-[#0b191f] hover:bg-white"
                  onClick={() => loadRow(row)}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
