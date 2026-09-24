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
    const path = searchParams.get("path") || "";

    if (!repo) {
      return NextResponse.json(
        { error: "Repository is required" },
        { status: 400 }
      );
    }

    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      return NextResponse.json(
        { error: "Invalid repository format. Use owner/repository" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo: name,
        path,
      }
    );

    // Directory
    if (Array.isArray(response.data)) {
      const files = response.data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        url: item.html_url,
        downloadUrl: item.download_url,
      }));

      return NextResponse.json({
        success: true,
        type: "directory",
        repository: repo,
        path,
        files,
      });
    }

    // File
    if (response.data.type === "file") {
      const content = Buffer.from(
        response.data.content || "",
        "base64"
      ).toString("utf-8");

      return NextResponse.json({
        success: true,
        type: "file",
        repository: repo,
        path: response.data.path,
        name: response.data.name,
        size: response.data.size,
        content,
        url: response.data.html_url,
      });
    }

    return NextResponse.json({
      success: true,
      type: response.data.type,
      repository: repo,
      path: response.data.path,
    });
  } catch (error) {
    console.error("GitHub Files API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch repository content",
      },
      { status: 500 }
    );
  }
}