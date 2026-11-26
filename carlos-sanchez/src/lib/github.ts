export interface PullRequestReference {
  owner: string;
  repository: string;
  number: number;
  canonicalUrl: string;
}

export interface MergedPullRequest extends PullRequestReference {
  repo: string;
  title: string;
  author: string;
  mergedAt: string;
  htmlUrl: string;
}

export type GitHubErrorCode =
  | "invalid-url"
  | "not-found"
  | "not-merged"
  | "rate-limited"
  | "unavailable";

export class GitHubError extends Error {
  constructor(
    public readonly code: GitHubErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export function parsePullRequestUrl(value: string): PullRequestReference {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new GitHubError("invalid-url", "Invalid GitHub Pull Request URL.");
  }

  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
    throw new GitHubError("invalid-url", "The URL must use https://github.com.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "pull" || !/^\d+$/.test(parts[3])) {
    throw new GitHubError("invalid-url", "The URL must point to /owner/repo/pull/number.");
  }

  const number = Number(parts[3]);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new GitHubError("invalid-url", "The Pull Request number is invalid.");
  }

  const [owner, repository] = parts;
  return {
    owner,
    repository,
    number,
    canonicalUrl: `https://github.com/${owner}/${repository}/pull/${number}`,
  };
}

interface GitHubPullResponse {
  number: number;
  title: string;
  html_url: string;
  merged_at: string | null;
  user: { login: string } | null;
  base: { repo: { full_name: string } };
}

export async function fetchMergedPullRequest(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<MergedPullRequest> {
  const reference = parsePullRequestUrl(value);
  let response: Response;

  try {
    response = await fetcher(
      `https://api.github.com/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repository)}/pulls/${reference.number}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
  } catch {
    throw new GitHubError("unavailable", "GitHub could not be reached.");
  }

  if (response.status === 404) {
    throw new GitHubError("not-found", "The public Pull Request was not found.");
  }
  if (response.status === 403 || response.status === 429) {
    throw new GitHubError("rate-limited", "The GitHub API request limit was reached.");
  }
  if (!response.ok) {
    throw new GitHubError("unavailable", `GitHub returned HTTP ${response.status}.`);
  }

  const pull = (await response.json()) as GitHubPullResponse;
  if (!pull.merged_at) {
    throw new GitHubError("not-merged", "The Pull Request is not merged.");
  }

  return {
    ...reference,
    repo: pull.base.repo.full_name,
    title: pull.title,
    author: pull.user?.login ?? "unknown",
    mergedAt: pull.merged_at,
    htmlUrl: pull.html_url,
  };
}
