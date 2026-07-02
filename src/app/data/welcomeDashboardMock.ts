/** Mock data for dashboard-placeholder welcome — matches Figma node 16:1936 (filled). */

/** Gauge values for the demo overview — same shape the live gauges expect. */
export const welcomeGaugeMock = {
  /** Hero score 0–100 (≥70 → "Project on track"). */
  heroScore: 89,
  /** Hours-per-story-point ratio (<1 → Safe Zone). */
  hpsRatio: 1.17,
  completedWeight: 46,
  totalWeight: 64,
  structuralCommits: 6,
  incrementalCommits: 4,
  trivialCommits: 2,
} as const;

/**
 * Recent activity demo rows — mirror the live feed (commit + column-move entries
 * with classification pills) so the welcome view matches a real project.
 */
export type WelcomeActivityMockItem =
  | {
      id: string;
      type: "commit";
      date: string;
      title: string;
      classification: "STRUCTURAL" | "INCREMENTAL" | "TRIVIAL";
      summary: string;
      url?: string;
    }
  | {
      id: string;
      type: "move";
      date: string;
      title: string;
      from: string;
      to: string;
    };

export const welcomeRecentActivityMock: WelcomeActivityMockItem[] = [
  {
    id: "1",
    type: "commit",
    date: "30-06-2026",
    title: "Amukelani Shiringani pushed to main",
    classification: "STRUCTURAL",
    summary: "Add invoice PDF export and email delivery",
    url: "#",
  },
  {
    id: "2",
    type: "move",
    date: "29-06-2026",
    title: "Todd Phillips moved “Client onboarding checklist”",
    from: "In Progress",
    to: "Done",
  },
  {
    id: "3",
    type: "commit",
    date: "28-06-2026",
    title: "Daniel Max pushed to feat/time-tracking",
    classification: "INCREMENTAL",
    summary: "Wire up timer controls to the task detail panel",
    url: "#",
  },
  {
    id: "4",
    type: "commit",
    date: "27-06-2026",
    title: "Sarah Chen pushed to main",
    classification: "TRIVIAL",
    summary: "Fix typo in dashboard header",
  },
];

/** Team member cards for the demo overview — same layout as the live team cards. */
export type WelcomeTeamMockMember = {
  id: string;
  /** Global numeric id → stable avatar hue via memberAvatarBackground. */
  userId: number;
  name: string;
  initials: string;
  roleLabel: string;
  totalHours: number;
  tasksCompleted: number;
};

export const welcomeTeamMock: WelcomeTeamMockMember[] = [
  {
    id: "tm1",
    userId: 7,
    name: "Amukelani Shiringani",
    initials: "AS",
    roleLabel: "Product Designer",
    totalHours: 128,
    tasksCompleted: 24,
  },
  {
    id: "tm2",
    userId: 3,
    name: "Daniel Max",
    initials: "DM",
    roleLabel: "Developer",
    totalHours: 96,
    tasksCompleted: 18,
  },
  {
    id: "tm3",
    userId: 12,
    name: "Todd Phillips",
    initials: "TP",
    roleLabel: "Project Manager",
    totalHours: 74,
    tasksCompleted: 11,
  },
];

export type WelcomeResourceItem =
  | { id: string; kind: "file"; name: string; sizeLabel: string }
  | { id: string; kind: "link"; url: string };

export const welcomeResourcesMock: WelcomeResourceItem[] = [
  { id: "r1", kind: "file", name: "file_name_goes_here.pdf", sizeLabel: "143.1 KB" },
  { id: "r2", kind: "link", url: "https://www.youtube.com/watch?v=-ueUb6PNwbs" },
  { id: "r3", kind: "file", name: "file_name_goes_here.pdf", sizeLabel: "143.1 KB" },
  { id: "r4", kind: "file", name: "file_name_goes_here.pdf", sizeLabel: "143.1 KB" },
  {
    id: "r5",
    kind: "file",
    name: "file_name_goes_name_goes_here_name_goes_name_goes_name_goes_name_goes_name_goes_name_goes.pdf",
    sizeLabel: "143.1 KB",
  },
];

export const welcomeRepoMock = [
  { id: "repo1", url: "https://www.git.com/", lastIndexed: "Last indexed Yesterday" },
  { id: "repo2", url: "https://www.git.com/", lastIndexed: "Last indexed 15 March 2026" },
  { id: "repo3", url: "https://www.git.com/", lastIndexed: "Last indexed 15 March 2026" },
] as const;

/** Milestone timeline — Figma playground nodes 35:11664–35:11707 */
export type WelcomeMilestoneTimelineMockRow = {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
  /** Demo: all milestone tasks in Completed — shows green tick in timeline */
  allTasksCompleted?: boolean;
};

export const welcomeMilestoneTimelineMock: WelcomeMilestoneTimelineMockRow[] = [
  {
    id: "ms1",
    dateLabel: "20-06-2026",
    title: "Foundation & Setup",
    description: "Long description about the project milestone.",
  },
  {
    id: "ms2",
    dateLabel: "20-05-2026",
    title: "Initial Concept",
    description: "Brainstorming and defining the project scope and goals.",
  },
  {
    id: "ms3",
    dateLabel: "20-04-2026",
    title: "Research Phase",
    description: "Conducted market and user research to gather requirements.",
  },
  {
    id: "ms4",
    dateLabel: "20-03-2026",
    title: "Design Prototyping",
    description: "Created wireframes and interactive prototypes for user feedback.",
  },
  {
    id: "ms5",
    dateLabel: "20-02-2026",
    title: "Development Start",
    description: "Kickoff of the development cycle with core features.",
  },
  {
    id: "ms6",
    dateLabel: "20-01-2026",
    title: "Alpha Release",
    description: "Released the first alpha version for internal testing.",
    allTasksCompleted: true,
  },
];
