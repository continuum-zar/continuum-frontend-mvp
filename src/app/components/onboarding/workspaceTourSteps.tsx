/* eslint-disable react-refresh/only-export-components -- step definitions include JSX bodies */
import type { ReactNode } from "react";

import type { SettingsSection } from "@/app/components/dashboard-placeholder/SettingsModal";
import {
  projectMainHref,
  projectSprintHref,
  WELCOME_PROJECT_ID,
} from "@/app/data/dashboardPlaceholderProjects";
import {
  workspaceJoin,
  WORKSPACE_SPRINT_SEGMENT,
  workspaceMyTasksHref,
  workspaceProductivityRhythmHref,
} from "@/lib/workspacePaths";
import type { TimeLogsActivitySubView } from "@/store/workspaceTourStore";

import { GuidedTourRichText, type GuidedTourSegment } from "./GuidedTourRichText";

export type WorkspaceTourStep = {
  id: string;
  title: string;
  body: ReactNode;
  targetSelector: string;
  /** Navigate when pathname/search does not match */
  ensureUrl?: string;
  settingsSection?: SettingsSection | null;
  activityView?: TimeLogsActivitySubView | null;
  /** Open account settings modal before measuring target */
  openSettings?: boolean;
  /**
   * Min distance from viewport bottom when placing the panel below the target (default 160).
   * Use a larger value for tall tooltip copy so the panel stays fully visible.
   */
  panelBottomReservePx?: number;
  /**
   * below: under target, arrow up.
   * above: over target, arrow down.
   * left: to the left of target, arrow points right (for edge FABs).
   * right: to the right of target, arrow points left (e.g. left-rail controls).
   */
  panelPlacement?: "below" | "above" | "left" | "right";
};

const U = {
  home: workspaceJoin(),
  myTasks: workspaceMyTasksHref("assigned"),
  productivityRhythm: workspaceProductivityRhythmHref(),
  welcome: projectMainHref(WELCOME_PROJECT_ID),
  sprintWelcome: projectSprintHref(WELCOME_PROJECT_ID),
  timeLogsTable: `${workspaceJoin(WORKSPACE_SPRINT_SEGMENT, "time-logs")}?populated=1&tab=time-logs`,
  activity: `${workspaceJoin(WORKSPACE_SPRINT_SEGMENT, "time-logs")}?populated=1&tab=activity`,
};

function T(segments: GuidedTourSegment[]) {
  return <GuidedTourRichText segments={segments} />;
}

export const WORKSPACE_TOUR_STEPS: WorkspaceTourStep[] = [
  {
    id: "rail-home",
    title: "Home",
    ensureUrl: U.home,
    targetSelector: '[data-tour="rail-home"]',
    body: T([
      { text: "Opens your " },
      { text: "workspace home", h: "cyan" },
      { text: ", high-level project health and KPIs for the org.", h: "peach" },
    ]),
  },
  {
    id: "rail-invoice",
    title: "Invoices",
    ensureUrl: U.home,
    targetSelector: '[data-tour="rail-invoice"]',
    body: T([
      { text: "Review and manage " },
      { text: "invoices", h: "cyan" },
      { text: " tied to your work and billing.", h: "peach" },
    ]),
  },
  {
    id: "my-tasks-scope-toggle",
    title: "My tasks",
    ensureUrl: U.myTasks,
    targetSelector: '[data-tour="my-tasks-scope-toggle"]',
    body: T([
      { text: "Use the left rail ", h: "peach" },
      { text: "My tasks", h: "cyan" },
      { text: " icon to open this list. Switch between ", h: "peach" },
      { text: "Assigned to me", h: "cyan" },
      { text: " and ", h: "peach" },
      { text: "Created by me", h: "cyan" },
      { text: " with these tabs.", h: "peach" },
    ]),
  },
  {
    id: "rail-productivity-rhythm",
    title: "Productivity rhythm",
    ensureUrl: U.productivityRhythm,
    targetSelector: '[data-tour="rail-productivity-rhythm"]',
    body: T([
      { text: "View the ", h: "peach" },
      { text: "team productivity rhythm", h: "cyan" },
      { text: " heatmap for the selected project.", h: "peach" },
    ]),
  },
  {
    id: "rail-create-project",
    title: "Create project",
    ensureUrl: U.home,
    targetSelector: '[data-tour="rail-create-project"]',
    body: T([
      { text: "Start a project " },
      { text: "manually", h: "cyan" },
      { text: " or with ", h: "peach" },
      { text: "AI assistance", h: "cyan" },
      { text: " from here.", h: "peach" },
    ]),
  },
  {
    id: "welcome-edit-project",
    title: "Edit project",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-edit-project"]',
    body: T([
      { text: "Open ", h: "peach" },
      { text: "Edit", h: "cyan" },
      {
        text: " to change the project name, description, and target date, or delete the project when you’re done.",
        h: "peach",
      },
    ]),
  },
  {
    id: "welcome-hero",
    title: "Project progress",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-hero-gauge"]',
    body: T([
      { text: "The hero gauge summarizes " },
      { text: "overall project health", h: "cyan" },
      { text: ", how on-track delivery looks at a glance.", h: "peach" },
    ]),
  },
  {
    id: "welcome-metrics",
    title: "Delivery metrics",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-metrics-row"]',
    body: T([
      { text: "Efficiency", h: "cyan" },
      { text: " is ", h: "peach" },
      { text: "hours logged per story point", h: "cyan" },
      {
        text: " (0–3). Lower is better: under 1 is Safe, 1–2 Caution, above 2 Danger. ",
        h: "peach",
      },
      { text: "Tasks completed", h: "cyan" },
      {
        text: " uses each task’s weight, points done versus total scope for the project. ",
        h: "peach",
      },
      { text: "Commits", h: "cyan" },
      {
        text: " are grouped by impact: ",
        h: "peach",
      },
      { text: "Shipped", h: "cyan" },
      { text: " (structural changes merged), ", h: "peach" },
      { text: "In Progress", h: "cyan" },
      {
        text: " (incremental work). Some views also list ",
        h: "peach",
      },
      { text: "Trivial", h: "cyan" },
      { text: " for small or chore-only commits.", h: "peach" },
    ]),
  },
  {
    id: "welcome-milestones",
    title: "Milestones",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-milestones"]',
    body: T([
      { text: "Use ", h: "peach" },
      { text: "Add", h: "cyan" },
      { text: " to define dated milestones so the team shares the same timeline.", h: "peach" },
    ]),
  },
  {
    id: "welcome-activity",
    title: "Recent activity",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-recent-activity"]',
    body: T([
      { text: "A running feed of ", h: "peach" },
      { text: "what changed recently", h: "cyan" },
      { text: ", comments, moves, and updates.", h: "peach" },
    ]),
  },
  {
    id: "welcome-resources",
    title: "Resources",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-resources"]',
    body: T([
      { text: "Attach ", h: "peach" },
      { text: "links and files", h: "cyan" },
      { text: " the team needs next to the work.", h: "peach" },
    ]),
  },
  {
    id: "welcome-repo",
    title: "Repository",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-repository"]',
    panelPlacement: "above",
    body: T([
      { text: "Link your ", h: "peach" },
      { text: "Git repository", h: "cyan" },
      {
        text: " so Continuum can ingest the codebase. ",
        h: "peach",
      },
      { text: "Indexing", h: "cyan" },
      {
        text: " refreshes that snapshot, use it after big merges or when status looks stale. ",
        h: "peach",
      },
      { text: "Indexed context", h: "cyan" },
      {
        text: " helps the AI propose tasks that match your real structure and naming, and keeps ",
        h: "peach",
      },
      { text: "commits", h: "cyan" },
      { text: " aligned with delivery signals.", h: "peach" },
    ]),
  },
  {
    id: "welcome-invite",
    title: "Invite members",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-invite-members"]',
    panelPlacement: "above",
    body: T([
      { text: "Bring collaborators in with the right ", h: "peach" },
      { text: "roles and access", h: "cyan" },
      { text: ".", h: "peach" },
    ]),
  },
  {
    id: "welcome-project-assistant",
    title: "Project assistant",
    ensureUrl: U.welcome,
    targetSelector: '[data-tour="welcome-project-assistant"]',
    panelPlacement: "left",
    body: T([
      { text: "The ", h: "peach" },
      { text: "floating assistant", h: "cyan" },
      {
        text: " answers questions about this project, progress, risks, and scope, using your tasks, time, and linked repo context.",
        h: "peach",
      },
    ]),
  },
  {
    id: "sprint-board-toggle",
    title: "Sprint board",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="sprint-board-view"]',
    body: T([
      { text: "The ", h: "peach" },
      { text: "board", h: "cyan" },
      { text: " view is your default Kanban, columns mirror workflow.", h: "peach" },
    ]),
  },
  {
    id: "sprint-list-toggle",
    title: "List view",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="sprint-list-view"]',
    body: T([
      { text: "Switch to ", h: "peach" },
      { text: "list", h: "cyan" },
      { text: " for a compact, scannable table of the same tasks.", h: "peach" },
    ]),
  },
  {
    id: "sprint-create-task",
    title: "Create task",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="sprint-create-task"]',
    body: T([
      { text: "Add a task straight into the ", h: "peach" },
      { text: "To-do", h: "cyan" },
      { text: " column to capture work immediately.", h: "peach" },
    ]),
  },
  {
    id: "sprint-ai-assistant",
    title: "AI & tasks",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="sprint-ai-assistant"]',
    panelPlacement: "left",
    body: T([
      { text: "Open the assistant here to ", h: "peach" },
      { text: "describe work in plain language", h: "cyan" },
      {
        text: " and generate tasks that match your codebase and backlog, then refine or add them to the board.",
        h: "peach",
      },
    ]),
  },
  {
    id: "time-logs-tab",
    title: "Time logs",
    ensureUrl: U.timeLogsTable,
    targetSelector: '[data-tour="timelogs-tab-time-logs"]',
    body: T([
      { text: "The ", h: "peach" },
      { text: "Time logs", h: "cyan" },
      { text: " tab lists recorded hours, your billing and audit trail.", h: "peach" },
    ]),
  },
  {
    id: "activity-tab",
    title: "Activity",
    ensureUrl: U.activity,
    targetSelector: '[data-tour="timelogs-tab-activity"]',
    body: T([
      { text: "Activity shows ", h: "peach" },
      { text: "team movement", h: "cyan" },
      { text: ", who did what across the sprint window.", h: "peach" },
    ]),
  },
  {
    id: "activity-members",
    title: "Members",
    ensureUrl: U.activity,
    targetSelector: '[data-tour="activity-sub-members"]',
    activityView: "members",
    body: T([
      { text: "See ", h: "peach" },
      { text: "per-person contribution", h: "cyan" },
      { text: ", hours, tasks, and commits side by side.", h: "peach" },
    ]),
  },
  {
    id: "activity-trends",
    title: "Trends",
    ensureUrl: U.activity,
    targetSelector: '[data-tour="activity-sub-trends"]',
    activityView: "trends",
    body: T([
      { text: "Trends charts compare ", h: "peach" },
      { text: "hours, completed tasks, and commits", h: "cyan" },
      { text: " over time to spot pace changes.", h: "peach" },
    ]),
  },
  {
    id: "activity-performance",
    title: "Performance",
    ensureUrl: U.activity,
    targetSelector: '[data-tour="activity-sub-performance"]',
    activityView: "performance",
    body: T([
      { text: "Performance highlights ", h: "peach" },
      { text: "throughput vs. plan", h: "cyan" },
      { text: ", useful for retros and stakeholder updates.", h: "peach" },
    ]),
  },
  {
    id: "sprint-log-time",
    title: "Log time",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="sprint-log-time"]',
    body: T([
      { text: "Log time against work in one click, feeds ", h: "peach" },
      { text: "reports and invoices", h: "cyan" },
      { text: ".", h: "peach" },
    ]),
  },
  {
    id: "rail-timer",
    title: "Time tracking",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="rail-time-tracking"]',
    panelPlacement: "right",
    body: T([
      { text: "Pick a ticket, then ", h: "peach" },
      { text: "start/stop", h: "cyan" },
      { text: " the timer, duration flows into time logs.", h: "peach" },
    ]),
  },
  {
    id: "rail-profile",
    title: "Account & settings",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="rail-profile-settings"]',
    panelPlacement: "right",
    body: T([
      { text: "Open your ", h: "peach" },
      { text: "profile", h: "cyan" },
      { text: " for account preferences and workspace settings.", h: "peach" },
    ]),
  },
  {
    id: "settings-general",
    title: "General",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-nav-general"]',
    openSettings: true,
    settingsSection: "general",
    body: T([
      { text: "Update your ", h: "peach" },
      { text: "name and identity", h: "cyan" },
      { text: " details tied to commits and the workspace.", h: "peach" },
    ]),
  },
  {
    id: "settings-notifications",
    title: "Notifications",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-nav-notification"]',
    openSettings: true,
    settingsSection: "notification",
    body: T([
      { text: "Choose ", h: "peach" },
      { text: "email digests and Discord alerts", h: "cyan" },
      { text: " per project — pick which task and milestone events post to a channel.", h: "peach" },
    ]),
  },
  {
    id: "settings-invoice",
    title: "Invoice",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-nav-invoice"]',
    openSettings: true,
    settingsSection: "invoice",
    body: T([
      { text: "Set ", h: "peach" },
      { text: "currency and default rates", h: "cyan" },
      { text: " used when generating invoices.", h: "peach" },
    ]),
  },
  {
    id: "settings-integrations",
    title: "Integrations",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-nav-integrations"]',
    openSettings: true,
    settingsSection: "integrations",
    body: T([
      { text: "Connect ", h: "peach" },
      { text: "GitHub, Discord, and Cursor", h: "cyan" },
      { text: " so Continuum stays in sync with your stack.", h: "peach" },
    ]),
  },
  {
    id: "settings-support",
    title: "Support & legal",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-nav-support"]',
    openSettings: true,
    settingsSection: "support",
    body: T([
      { text: "Get ", h: "peach" },
      { text: "help, policies, and feedback", h: "cyan" },
      { text: " channels in one place.", h: "peach" },
    ]),
  },
  {
    id: "settings-report-issue",
    title: "Report an issue",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-report-issue"]',
    openSettings: true,
    settingsSection: "support",
    body: T([
      { text: "Send ", h: "peach" },
      { text: "bugs, confusion, or ideas", h: "cyan" },
      {
        text: ", we read every report and use it to improve Continuum.",
        h: "peach",
      },
    ]),
  },
  {
    id: "settings-replay-tutorial",
    title: "Replay the tour",
    ensureUrl: U.sprintWelcome,
    targetSelector: '[data-tour="settings-replay-tutorial"]',
    openSettings: true,
    settingsSection: "support",
    panelPlacement: "right",
    body: T([
      { text: "Anytime you want a refresher, open ", h: "peach" },
      { text: "Tutorial", h: "cyan" },
      {
        text: " here to walk through the workspace again from the start.",
        h: "peach",
      },
    ]),
  },
];
