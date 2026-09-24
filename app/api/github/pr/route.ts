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
    const numberParam = searchParams.get("number");

    if (!repo || !numberParam) {
      return NextResponse.json(
        {
          success: false,
          error:
            "repo and number parameters are required",
        },
        { status: 400 }
      );
    }

    const number = Number(numberParam);

    if (!Number.isInteger(number) || number <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "PR number must be a positive number",
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

    const octokit = new Octokit({
      auth: token,
    });

    // --------------------------------------------
    // GET PR DETAILS
    // --------------------------------------------

    let prResponse;

    try {
      prResponse = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo: name,
          pull_number: number,
        }
      );
    } catch (error: unknown) {
      const githubError = error as {
        status?: number;
        message?: string;
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      return NextResponse.json(
        {
          success: false,
          error:
            githubError.response?.data?.message ||
            githubError.message ||
            "GitHub could not find this pull request",
          status: githubError.status,
          repository: `${owner}/${name}`,
          pullRequestNumber: number,
        },
        {
          status:
            githubError.status === 404
              ? 404
              : 500,
        }
      );
    }

    const pr = prResponse.data;

    // --------------------------------------------
    // GET CHANGED FILES
    // --------------------------------------------

    let filesResponse;

    try {
      filesResponse = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        {
          owner,
          repo: name,
          pull_number: number,
          per_page: 100,
        }
      );
    } catch (error: unknown) {
      const githubError = error as {
        status?: number;
        message?: string;
      };

      return NextResponse.json(
        {
          success: false,
          error:
            githubError.message ||
            "Failed to fetch changed files",
        },
        { status: 500 }
      );
    }

    const files = filesResponse.data.map(
      (file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch || "",
        blobUrl: file.blob_url,
        rawUrl: file.raw_url,
      })
    );

    return NextResponse.json({
      success: true,

      repository: `${owner}/${name}`,

      pullRequest: {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        draft: pr.draft,
        author:
          pr.user?.login || "Unknown",
        branch: pr.head.ref,
        baseBranch: pr.base.ref,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        url: pr.html_url,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        commits: pr.commits,
      },

      files,
    });
  } catch (error) {
    console.error(
      "Pull Request Detail API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pull request",
      },
      { status: 500 }
    );
  }
}