import { describe, expect, it } from "vitest";

import type { Project } from "@/types/project";

import {
  filterApiProjectsBySearchQuery,
  normalizeProjectSearchQuery,
} from "./leftRailProjectSearchUtils";

const mkProject = (title: string, apiId: number): Project => ({
  id: String(apiId),
  apiId,
  title,
  description: "",
  status: "active",
  progress: 0,
  dueDate: "2026-01-01",
  teamSize: 1,
  lastActive: "2026-01-01",
});

describe("normalizeProjectSearchQuery", () => {
  it("trims and lowercases", () => {
    expect(normalizeProjectSearchQuery("  Foo Bar  ")).toBe("foo bar");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeProjectSearchQuery("   ")).toBe("");
  });
});

describe("filterApiProjectsBySearchQuery", () => {
  const projects = [
    mkProject("Alpha Platform", 1),
    mkProject("Beta Launch", 2),
    mkProject("Continuum Docs", 3),
  ];

  it("returns all projects when query is empty", () => {
    expect(filterApiProjectsBySearchQuery(projects, "")).toEqual(projects);
  });

  it("returns all projects when query is whitespace only", () => {
    expect(filterApiProjectsBySearchQuery(projects, "   ")).toEqual(projects);
  });

  it("matches case-insensitively on title", () => {
    expect(filterApiProjectsBySearchQuery(projects, "beta")).toEqual([projects[1]]);
    expect(filterApiProjectsBySearchQuery(projects, "BETA")).toEqual([projects[1]]);
  });

  it("matches partial substrings", () => {
    expect(filterApiProjectsBySearchQuery(projects, "launch")).toEqual([projects[1]]);
    expect(filterApiProjectsBySearchQuery(projects, "continuum")).toEqual([projects[2]]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterApiProjectsBySearchQuery(projects, "zzzzz")).toEqual([]);
  });
});
