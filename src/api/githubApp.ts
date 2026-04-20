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
 * Start user-to-server OAuth: ask the backend for the GitHub authorize URL and navigate
 * the top-level browser there.
 *
 * We cannot use the ``/github/connect`` 302 endpoint from a SPA because browsers
 * transparently follow redirects for XHR/fetch and never expose the ``Location`` header
 * to JavaScript (and the cross-origin follow to github.com then fails CORS). Instead we
 * read the URL from a JSON endpoint so the JWT stays in axios and the browser keeps the
 * session.
 */
export async function getGitHubOAuthAuthorizeLocation(projectId: number): Promise<string> {
  const { data } = await api.get<{ url: string }>('/github/authorize-url', {
    params: { project_id: projectId },
  });
  if (!data?.url) {
    throw new Error('GitHub OAuth authorize URL was not returned by the server');
  }
  return data.url;
}

export const githubAppKeys = {
  all: ['githubApp'] as const,
  repos: (projectId: number) => [...githubAppKeys.all, 'repositories', projectId] as const,
};
