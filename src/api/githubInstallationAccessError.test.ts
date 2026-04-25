import axios from "axios";
import { describe, expect, it } from "vitest";

import { isGithubInstallationAccessExpiredError } from "./githubInstallationAccessError";

function axiosErr(status: number, data?: object) {
  const err = new axios.AxiosError("request failed");
  err.response = {
    status,
    data: data ?? {},
    statusText: "",
    headers: {},
    config: err.config!,
  };
  return err;
}

describe("isGithubInstallationAccessExpiredError", () => {
  it("returns true for 401", () => {
    expect(isGithubInstallationAccessExpiredError(axiosErr(401))).toBe(true);
  });

  it("returns true for 422", () => {
    expect(isGithubInstallationAccessExpiredError(axiosErr(422))).toBe(true);
  });

  it("returns true for 403 when detail mentions revoked token", () => {
    expect(
      isGithubInstallationAccessExpiredError(
        axiosErr(403, { detail: "GitHub token was revoked for this project" }),
      ),
    ).toBe(true);
  });

  it("returns false for 403 without OAuth-related detail", () => {
    expect(isGithubInstallationAccessExpiredError(axiosErr(403, { detail: "Forbidden" }))).toBe(false);
  });

  it("returns true when backend sets code github_oauth_expired", () => {
    expect(
      isGithubInstallationAccessExpiredError(axiosErr(400, { code: "github_oauth_expired" })),
    ).toBe(true);
  });

  it("returns false for non-axios errors", () => {
    expect(isGithubInstallationAccessExpiredError(new Error("network"))).toBe(false);
  });

  it("returns false for 404", () => {
    expect(isGithubInstallationAccessExpiredError(axiosErr(404))).toBe(false);
  });
});
