
import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token is not configured" },
        { status: 500 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    const response = await octokit.request("GET /user/repos", {
      visibility: "all",
      sort: "updated",
      per_page: 20,
    });

    const repositories = response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      private: repo.private,
      url: repo.html_url,
    }));

    return NextResponse.json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("GitHub API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch GitHub repositories",
      },
      { status: 500 }
    );
  }
}