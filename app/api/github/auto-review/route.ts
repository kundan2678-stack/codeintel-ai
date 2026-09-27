import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const repo = body.repo;
    const number = Number(body.number);

    if (!repo || !number) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository and pull request number are required",
        },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "GITHUB_TOKEN is not configured",
        },
        { status: 500 }
      );
    }

    const [owner, repoName] = repo.split("/");

    if (!owner || !repoName) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository format",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    // Fetch PR files
    const filesResponse =
      await octokit.rest.pulls.listFiles({
        owner,
        repo: repoName,
        pull_number: number,
        per_page: 100,
      });

    const files = filesResponse.data;

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changed files found in this pull request.",
        review: null,
      });
    }

    // Build PR diff
    const diff = files
      .map((file) => {
        return [
          `FILE: ${file.filename}`,
          `STATUS: ${file.status}`,
          `ADDITIONS: ${file.additions}`,
          `DELETIONS: ${file.deletions}`,
          "",
          file.patch || "No patch available",
        ].join("\n");
      })
      .join("\n\n--------------------------------\n\n");

    // Call existing CodeIntel review engine
    const reviewUrl = new URL(
      "/api/ai-review",
      request.url
    );

    const reviewResponse = await fetch(
      reviewUrl.toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo,
          number,
          file: `Pull Request #${number}`,
          language: "Multi-file GitHub Pull Request",
          issue:
            "Automatically review this GitHub Pull Request diff for bugs, security vulnerabilities, performance problems and maintainability issues.",
          code: diff,
        }),
      }
    );

    const reviewResult = await reviewResponse.json();

    if (!reviewResponse.ok || !reviewResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            reviewResult.error ||
            "Automatic review failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Automatic PR review completed",
      repository: repo,
      pullRequest: number,
      filesAnalyzed: files.length,
      review: reviewResult.review,
      database: reviewResult.database,
    });
  } catch (error) {
    console.error(
      "Automatic PR review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to run automatic PR review",
      },
      { status: 500 }
    );
  }
}