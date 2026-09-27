import { NextResponse } from "next/server";
import crypto from "crypto";
import { Octokit } from "octokit";

export const runtime = "nodejs";

function verifySignature(
  payload: string,
  signature: string | null
) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();

    const signature = request.headers.get(
      "x-hub-signature-256"
    );

    const event = request.headers.get(
      "x-github-event"
    );

    if (!verifySignature(payload, signature)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature",
        },
        { status: 401 }
      );
    }

    const data = JSON.parse(payload);

    if (event === "ping") {
      return NextResponse.json({
        success: true,
        message: "GitHub webhook connected",
      });
    }

    if (event !== "pull_request") {
      return NextResponse.json({
        success: true,
        message: "Event received but not processed",
      });
    }

    const action = data.action;
    const pullRequest = data.pull_request;
    const repository = data.repository;

    if (
      !["opened", "synchronize", "reopened"].includes(action)
    ) {
      return NextResponse.json({
        success: true,
        message: `Pull request action '${action}' ignored`,
      });
    }

    if (!pullRequest || !repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pull request payload",
        },
        { status: 400 }
      );
    }

    const repo = repository.full_name;
    const number = pullRequest.number;

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
          error: "Invalid repository name",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    // Fetch changed files
    const filesResponse =
      await octokit.rest.pulls.listFiles({
        owner,
        repo: repoName,
        pull_number: number,
        per_page: 100,
      });

    const files = filesResponse.data;

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

    // Call existing CodeIntel review API
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const reviewResponse = await fetch(
      `${baseUrl}/api/ai-review`,
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
      console.error(
        "Automatic PR review failed:",
        reviewResult
      );

      return NextResponse.json(
        {
          success: false,
          error: "Automatic PR review failed",
          details: reviewResult.error,
        },
        { status: 500 }
      );
    }

    console.log("Automatic PR review completed:", {
      repo,
      number,
      score: reviewResult.review?.score,
      risk: reviewResult.review?.risk,
    });

    return NextResponse.json({
      success: true,
      message: "Automatic PR review completed",
      repository: repo,
      pullRequest: number,
      review: reviewResult.review,
    });
  } catch (error) {
    console.error(
      "GitHub automatic review webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Automatic webhook review failed",
      },
      { status: 500 }
    );
  }
}