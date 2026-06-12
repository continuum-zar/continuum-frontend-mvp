import type { Project } from "@/types/project";

export function normalizeProjectSearchQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Filters API projects by title (case-insensitive substring). Welcome row is filtered separately. */
export function filterApiProjectsBySearchQuery(projects: Project[], rawQuery: string): Project[] {
  const q = normalizeProjectSearchQuery(rawQuery);
  if (!q) return projects;
  return projects.filter((p) => p.title.toLowerCase().includes(q));
}
