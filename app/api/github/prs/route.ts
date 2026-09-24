import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub token is not configured",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const repo = searchParams.get("repo");
    const stateParam = searchParams.get("state") || "all";

    if (!repo) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository is required",
        },
        { status: 400 }
      );
    }

    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid repository format. Use owner/repository",
        },
        { status: 400 }
      );
    }

    const state =
      stateParam === "open" ||
      stateParam === "closed" ||
      stateParam === "all"
        ? stateParam
        : "all";

    const octokit = new Octokit({
      auth: token,
    });

    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls",
      {
        owner,
        repo: name,
        state,
        sort: "updated",
        direction: "desc",
        per_page: 30,
      }
    );

    const pullRequests = response.data.map(
      (pr) => ({
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        draft: pr.draft,
        merged:
          pr.merged_at !== null,
        author:
          pr.user?.login || "Unknown",
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        url: pr.html_url,
        branch: pr.head.ref,
        baseBranch: pr.base.ref,
        changedFiles: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
        commits: pr.commits,
      })
    );

    return NextResponse.json({
      success: true,
      repository: `${owner}/${name}`,
      state,
      pullRequests,
    });
  } catch (error) {
    console.error(
      "Pull Request API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pull requests",
      },
      { status: 500 }
    );
  }
}