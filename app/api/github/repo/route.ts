import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");

    if (!repo) {
      return NextResponse.json(
        { error: "Repository is required" },
        { status: 400 }
      );
    }

    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      return NextResponse.json(
        {
          error: "Invalid repository format. Use owner/repository",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    const response = await octokit.request(
      "GET /repos/{owner}/{repo}",
      {
        owner,
        repo: name,
      }
    );

    return NextResponse.json({
      success: true,
      repository: {
        id: response.data.id,
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        language: response.data.language,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        defaultBranch: response.data.default_branch,
        private: response.data.private,
        url: response.data.html_url,
      },
    });
  } catch (error) {
    console.error("Repository API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch repository",
      },
      { status: 500 }
    );
  }
}