import { describe, expect, it } from "vitest";
import {
  DASHBOARD_WELCOME_PROJECT,
  expandedProjectFromLocation,
  sprintBoardContextBreadcrumbLabel,
} from "./dashboardPlaceholderProjects";
import { workspaceJoin } from "@/lib/workspacePaths";

describe("expandedProjectFromLocation", () => {
  const timeLogsPath = workspaceJoin("sprint", "time-logs");

  it("resolves API project id from query on sprint time-logs path", () => {
    expect(expandedProjectFromLocation(timeLogsPath, "27")).toBe("27");
  });

  it("falls back to welcome when no project query on sprint time-logs path", () => {
    expect(expandedProjectFromLocation(timeLogsPath, null)).toBe(DASHBOARD_WELCOME_PROJECT.id);
  });

  it("resolves welcome project id when explicitly in query", () => {
    expect(expandedProjectFromLocation(timeLogsPath, "welcome")).toBe("welcome");
  });
});

describe("sprintBoardContextBreadcrumbLabel", () => {
  it("uses welcome sprint label when not on an API project", () => {
    expect(sprintBoardContextBreadcrumbLabel(null, "m1", [{ id: "m1", name: "M1" }], false)).toBe(
      DASHBOARD_WELCOME_PROJECT.sprintLabel,
    );
  });

  it('returns "Sprint" when no milestone is selected', () => {
    expect(sprintBoardContextBreadcrumbLabel("27", null, [], false)).toBe("Sprint");
  });

  it("returns milestone name when it exists in the list", () => {
    expect(
      sprintBoardContextBreadcrumbLabel("27", "m1", [
        { id: "m1", name: "January sprint" },
      ], false),
    ).toBe("January sprint");
  });

  it('returns "…" while milestones are loading and id is not yet resolved', () => {
    expect(sprintBoardContextBreadcrumbLabel("27", "m1", [], true)).toBe("…");
  });

  it('returns "Milestone" when loading finished but id is unknown', () => {
    expect(sprintBoardContextBreadcrumbLabel("27", "missing", [], false)).toBe("Milestone");
  });
});
