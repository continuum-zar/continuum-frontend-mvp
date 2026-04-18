import api from "@/lib/api";
import { isAxiosError } from "axios";

export type LatestReleaseNote = {
  id: number;
  version: string;
  title: string;
  content: string;
  checklist_items: string[];
  created_at: string;
  seen: boolean;
};

export type ReleaseNoteAdminItem = {
  id: number;
  version: string;
  title: string;
  content: string;
  checklist_items: string[];
  created_at: string;
};

export type ReleaseNoteCreateBody = {
  version: string;
  title: string;
  content: string;
  checklist_items: string[];
};

export type ReleaseNoteUpdateBody = Partial<{
  version: string;
  title: string;
  content: string;
  checklist_items: string[];
}>;

export const releaseNoteKeys = {
  latest: () => ["release-notes", "latest"] as const,
  adminList: () => ["release-notes", "admin-list"] as const,
};

/** Returns `null` when no release notes exist (404). */
export async function fetchLatestReleaseNote(): Promise<LatestReleaseNote | null> {
  try {
    const { data } = await api.get<LatestReleaseNote>("/release-notes/latest");
    return data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) return null;
    throw e;
  }
}

export async function markReleaseNoteSeen(releaseNoteId: number): Promise<void> {
  await api.post(`/release-notes/${releaseNoteId}/seen`);
}

export async function fetchAdminReleaseNotes(): Promise<ReleaseNoteAdminItem[]> {
  const { data } = await api.get<ReleaseNoteAdminItem[]>("/admin/release-notes/");
  return data;
}

export async function createAdminReleaseNote(body: ReleaseNoteCreateBody): Promise<ReleaseNoteAdminItem> {
  const { data } = await api.post<ReleaseNoteAdminItem>("/admin/release-notes/", body);
  return data;
}

export async function updateAdminReleaseNote(
  id: number,
  body: ReleaseNoteUpdateBody
): Promise<ReleaseNoteAdminItem> {
  const { data } = await api.patch<ReleaseNoteAdminItem>(`/admin/release-notes/${id}`, body);
  return data;
}
