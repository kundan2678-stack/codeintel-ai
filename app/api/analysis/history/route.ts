import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const repo = searchParams.get("repo");

    if (!repo) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository is required",
        },
        { status: 400 }
      );
    }

    const repository = await prisma.repository.findUnique({
      where: {
        fullName: repo,
      },
    });

    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found in database",
        },
        { status: 404 }
      );
    }

    const analyses = await prisma.analysis.findMany({
      where: {
        repositoryId: repository.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        findings: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    return NextResponse.json({
      success: true,

      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        language: repository.language,
      },

      analyses,
    });
  } catch (error) {
    console.error("Analysis history error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load analysis history",
      },
      { status: 500 }
    );
  }
}