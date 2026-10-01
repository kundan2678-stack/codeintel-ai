
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Save or update repositories in PostgreSQL
    await Promise.all(
      repositories.map((repo) =>
        prisma.repository.upsert({
          where: {
            githubId: String(repo.id),
          },
          create: {
            githubId: String(repo.id),
            name: repo.name,
            fullName: repo.fullName,
            description: repo.description,
            language: repo.language,
            stars: repo.stars,
            forks: repo.forks,
            url: repo.url,
            isPrivate: repo.private,
          },
          update: {
            name: repo.name,
            fullName: repo.fullName,
            description: repo.description,
            language: repo.language,
            stars: repo.stars,
            forks: repo.forks,
            url: repo.url,
            isPrivate: repo.private,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("GitHub API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch or save GitHub repositories",
      },
      { status: 500 }
    );
  }
}
