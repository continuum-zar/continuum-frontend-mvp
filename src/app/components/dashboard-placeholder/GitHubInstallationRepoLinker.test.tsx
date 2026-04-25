import type { ReactElement } from "react";
import axios from "axios";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { GitHubInstallationRepoLinker } from "./GitHubInstallationRepoLinker";

const useGithubInstallationRepositories = vi.fn();
const useProjectRepositories = vi.fn();
const useLinkRepository = vi.fn();

vi.mock("@/api/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/hooks")>();
  return {
    ...actual,
    useGithubInstallationRepositories: (...args: unknown[]) =>
      useGithubInstallationRepositories(...args),
    useProjectRepositories: (...args: unknown[]) => useProjectRepositories(...args),
    useLinkRepository: (...args: unknown[]) => useLinkRepository(...args),
  };
});

const getGitHubOAuthAuthorizeLocation = vi.fn();
vi.mock("@/api/githubApp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/githubApp")>();
  return {
    ...actual,
    getGitHubOAuthAuthorizeLocation: (...args: unknown[]) => getGitHubOAuthAuthorizeLocation(...args),
  };
});

vi.mock("@/lib/githubOAuthReturn", () => ({
  rememberGithubOAuthReturnPath: vi.fn(),
}));

function renderLinker(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function axiosReposError(status: number, data?: object) {
  const err = new axios.AxiosError("fail");
  err.response = {
    status,
    data: data ?? {},
    statusText: "",
    headers: {},
    config: err.config!,
  };
  return err;
}

describe("GitHubInstallationRepoLinker", () => {
  beforeEach(() => {
    useProjectRepositories.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    useLinkRepository.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    getGitHubOAuthAuthorizeLocation.mockReset();
  });

  it("shows expired access copy and Reconnect when repos query returns 401", () => {
    useGithubInstallationRepositories.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      error: axiosReposError(401),
    });

    renderLinker(<GitHubInstallationRepoLinker projectId={1} queryEnabled />);

    expect(screen.getByText(/your github access has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reconnect to github/i })).toBeEnabled();
  });

  it("shows Reconnect for 403 with OAuth-related detail", () => {
    useGithubInstallationRepositories.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      error: axiosReposError(403, { detail: "OAuth token revoked" }),
    });

    renderLinker(<GitHubInstallationRepoLinker projectId={1} queryEnabled />);

    expect(screen.getByText(/your github access has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reconnect to github/i })).toBeEnabled();
  });
});
