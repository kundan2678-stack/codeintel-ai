
import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export const runtime = "nodejs";

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

    // Fetch pull request list
    const response = await octokit.rest.pulls.list({
      owner,
      repo: name,
      state,
      sort: "updated",
      direction: "desc",
      per_page: 30,
    });

    // Fetch detailed information for each PR
    const pullRequests = await Promise.all(
      response.data.map(async (pr) => {
        const detailResponse =
          await octokit.rest.pulls.get({
            owner,
            repo: name,
            pull_number: pr.number,
          });

        const detail = detailResponse.data;

        return {
          number: detail.number,
          title: detail.title,
          body: detail.body,
          state: detail.state,
          draft: detail.draft,
          merged: detail.merged_at !== null,
          author: detail.user?.login || "Unknown",
          createdAt: detail.created_at,
          updatedAt: detail.updated_at,
          url: detail.html_url,
          branch: detail.head.ref,
          baseBranch: detail.base.ref,
          changedFiles: detail.changed_files,
          additions: detail.additions,
          deletions: detail.deletions,
          commits: detail.commits,
        };
      })
    );

    return NextResponse.json({
      success: true,
      repository: `${owner}/${name}`,
      state,
      pullRequests,
    });
  } catch (error) {
    console.error("Pull Request API Error:", error);

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
