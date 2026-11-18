import { describe, expect, it, vi } from "vitest";
import { fetchMergedPullRequest, GitHubError, parsePullRequestUrl } from "./github";

describe("parsePullRequestUrl", () => {
  it("normalizes a public GitHub pull request URL", () => {
    expect(
      parsePullRequestUrl(
        " https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1/pull/1?diff=split ",
      ),
    ).toEqual({
      owner: "Oppia-Software-Labs",
      repository: "Pura-Vida-Bootcamp-1",
      number: 1,
      canonicalUrl:
        "https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1/pull/1",
    });
  });

  it.each([
    "http://github.com/owner/repo/pull/1",
    "https://gitlab.com/owner/repo/pull/1",
    "https://github.com/owner/repo/issues/1",
    "https://github.com/owner/repo/pull/not-a-number",
  ])("rejects an invalid URL: %s", (value) => {
    expect(() => parsePullRequestUrl(value)).toThrowError(
      expect.objectContaining<Partial<GitHubError>>({ code: "invalid-url" }),
    );
  });
});

describe("fetchMergedPullRequest", () => {
  it("returns normalized evidence for a merged pull request", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          number: 1,
          title: "docs: improve bootcamp guide",
          html_url:
            "https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1/pull/1",
          merged_at: "2026-11-13T01:07:37Z",
          user: { login: "aguilar1x" },
          base: { repo: { full_name: "Oppia-Software-Labs/Pura-Vida-Bootcamp-1" } },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const pull = await fetchMergedPullRequest(
      "https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1/pull/1",
      fetcher,
    );

    expect(pull).toMatchObject({
      repo: "Oppia-Software-Labs/Pura-Vida-Bootcamp-1",
      title: "docs: improve bootcamp guide",
      author: "aguilar1x",
      mergedAt: "2026-11-13T01:07:37Z",
    });
  });

  it("rejects a pull request that is not merged", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          number: 9,
          title: "work in progress",
          html_url: "https://github.com/owner/repo/pull/9",
          merged_at: null,
          user: { login: "contributor" },
          base: { repo: { full_name: "owner/repo" } },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    await expect(
      fetchMergedPullRequest("https://github.com/owner/repo/pull/9", fetcher),
    ).rejects.toMatchObject({ code: "not-merged" });
  });

  it.each([
    [404, "not-found"],
    [403, "rate-limited"],
    [429, "rate-limited"],
    [500, "unavailable"],
  ] as const)("maps HTTP %i to %s", async (status, code) => {
    const fetcher = vi.fn(async () => new Response(null, { status })) as unknown as typeof fetch;

    await expect(
      fetchMergedPullRequest("https://github.com/owner/repo/pull/1", fetcher),
    ).rejects.toMatchObject({ code });
  });
});
