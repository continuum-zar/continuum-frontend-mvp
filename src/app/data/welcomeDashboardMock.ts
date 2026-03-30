/** Mock data for dashboard-placeholder welcome — matches Figma node 16:1936 (filled). */

export const welcomeRecentActivityMock = [
  {
    id: "1",
    time: "07:12",
    title: "Quality assurance",
    description: "Status changed from in progress to complete",
  },
  {
    id: "2",
    time: "1 Day ago",
    title: "Daniel Max",
    description: "Team member was removed from the project",
  },
  {
    id: "3",
    time: "10 February 2026",
    title: "Todd Phillips",
    description: "Project manager deleted 2 tasks",
  },
] as const;

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
