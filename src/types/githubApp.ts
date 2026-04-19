/** Mirrors backend `GitHubInstallationRepositoryOut` + nested models. */

export type GitHubRepoPermissions = {
  admin?: boolean | null;
  maintain?: boolean | null;
  push?: boolean | null;
  triage?: boolean | null;
  pull?: boolean | null;
};

export type GitHubRepoOwner = {
  id: number;
  login: string;
};

export type GitHubInstallationRepository = {
  id: number;
  name: string;
  owner: GitHubRepoOwner;
  permissions: GitHubRepoPermissions;
};
