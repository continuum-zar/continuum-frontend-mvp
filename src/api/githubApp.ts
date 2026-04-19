import api from '@/lib/api';
import type { GitHubInstallationRepository } from '@/types/githubApp';

/**
 * List repositories for the GitHub App installation linked to this Continuum project.
 * 404 = installation not connected; 503 = server GitHub App credentials missing.
 */
export async function fetchGitHubInstallationRepositories(
  projectId: number
): Promise<GitHubInstallationRepository[]> {
  const { data } = await api.get<GitHubInstallationRepository[]>(`/github/repositories`, {
    params: { project_id: projectId },
  });
  return data;
}

/**
 * Start user-to-server OAuth: backend responds with 302 to GitHub. Does not follow redirects
 * so we can read the `Location` header and send the browser there (JWT stays in axios only).
 */
export async function getGitHubOAuthAuthorizeLocation(projectId: number): Promise<string> {
  const res = await api.get<void>('/github/connect', {
    params: { project_id: projectId },
    maxRedirects: 0,
    validateStatus: (status) => status === 302,
  });
  const headers = res.headers as Record<string, string | undefined>;
  const loc = headers.location ?? headers.Location;
  if (!loc) {
    throw new Error('GitHub OAuth redirect did not return a Location header');
  }
  return loc;
}

export const githubAppKeys = {
  all: ['githubApp'] as const,
  repos: (projectId: number) => [...githubAppKeys.all, 'repositories', projectId] as const,
};
