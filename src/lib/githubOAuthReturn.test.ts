import { describe, it, expect, beforeEach } from "vitest";
import {
  rememberGithubOAuthReturnPath,
  peekGithubOAuthReturnPath,
  consumeGithubOAuthReturnPath,
  consumeGithubOAuthReopenSettings,
  consumeGithubOAuthReopenGithubIntegrationModal,
  consumeGithubOAuthRestoreProjectApiId,
  consumeGithubOAuthReopenWelcomeLinkRepoModal,
} from "./githubOAuthReturn";

describe("githubOAuthReturn", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores path with hash and peeks without consuming", () => {
    rememberGithubOAuthReturnPath("/workspace?project=3#frag", {
      reopenSettings: true,
      reopenGithubIntegrationModal: true,
      restoreProjectApiId: 42,
    });
    expect(peekGithubOAuthReturnPath()).toBe("/workspace?project=3#frag");
    expect(consumeGithubOAuthReturnPath()).toBe("/workspace?project=3#frag");
    expect(peekGithubOAuthReturnPath()).toBeNull();
  });

  it("consumes nested modal and project hints independently of return path", () => {
    rememberGithubOAuthReturnPath("/p", {
      reopenSettings: true,
      reopenGithubIntegrationModal: true,
      restoreProjectApiId: 99,
    });
    consumeGithubOAuthReturnPath();
    expect(consumeGithubOAuthReopenGithubIntegrationModal()).toBe(true);
    expect(consumeGithubOAuthRestoreProjectApiId()).toBe(99);
    expect(consumeGithubOAuthReopenSettings()).toBe(true);
  });

  it("supports welcome link-repo flow without settings flags", () => {
    rememberGithubOAuthReturnPath("/welcome/x", {
      reopenSettings: false,
      reopenGithubIntegrationModal: false,
      reopenWelcomeLinkRepoModal: true,
      restoreProjectApiId: 7,
    });
    expect(consumeGithubOAuthReopenSettings()).toBe(false);
    expect(consumeGithubOAuthReopenGithubIntegrationModal()).toBe(false);
    expect(consumeGithubOAuthRestoreProjectApiId()).toBe(7);
    expect(consumeGithubOAuthReopenWelcomeLinkRepoModal()).toBe(true);
  });
});
