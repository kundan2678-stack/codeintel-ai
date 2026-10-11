
import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const repo = String(body.repo || "").trim();
    const number = Number(body.number);

    if (!repo || !Number.isInteger(number) || number < 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid repository and pull request number are required",
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

    if (!owner || !repoName || repo.split("/").length !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository format. Use owner/repository",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    // Fetch changed files from GitHub.
    const filesResponse = await octokit.rest.pulls.listFiles({
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
        repository: repo,
        pullRequest: number,
        filesAnalyzed: 0,
        review: null,
        duplicate: false,
      });
    }

    // Build a diff from the changed files.
    const diff = files
      .map((file) =>
        [
          `FILE: ${file.filename}`,
          `STATUS: ${file.status}`,
          `ADDITIONS: ${file.additions}`,
          `DELETIONS: ${file.deletions}`,
          "",
          file.patch || "No patch available",
        ].join("\n")
      )
      .join("\n\n--------------------------------\n\n");

    // Call the existing CodeIntel review engine.
    const reviewUrl = new URL("/api/ai-review", request.url);

    const reviewResponse = await fetch(reviewUrl.toString(), {
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
      cache: "no-store",
    });

    const reviewResult = await reviewResponse.json();

    if (!reviewResponse.ok || !reviewResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            reviewResult.error || "Automatic review failed",
        },
        { status: 500 }
      );
    }

    const duplicate = reviewResult.duplicate === true;

    return NextResponse.json({
      success: true,
      message: duplicate
        ? "This commit has already been reviewed."
        : "Automatic PR review completed",
      duplicate,
      repository: repo,
      pullRequest: number,
      filesAnalyzed: files.length,
      review: reviewResult.review,
      database: reviewResult.database,
    });
  } catch (error) {
    console.error("Automatic PR review error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to run automatic PR review",
      },
      { status: 500 }
    );
  }
}
