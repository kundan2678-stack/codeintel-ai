
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ScoreKey =
  | "codeQuality"
  | "security"
  | "performance"
  | "maintainability"
  | "codeHealth";

const scoreKeys: ScoreKey[] = [
  "codeQuality",
  "security",
  "performance",
  "maintainability",
  "codeHealth",
];

function compareScores(
  current: Record<ScoreKey, number>,
  previous: Record<ScoreKey, number>
) {
  return Object.fromEntries(
    scoreKeys.map((key) => {
      const currentScore = current[key] ?? 0;
      const previousScore = previous[key] ?? 0;
      const change = currentScore - previousScore;

      return [
        key,
        {
          current: currentScore,
          previous: previousScore,
          change,
          trend:
            change > 0
              ? "improved"
              : change < 0
                ? "declined"
                : "unchanged",
        },
      ];
    })
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");

    if (!repo?.trim()) {
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
        fullName: repo.trim(),
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        description: true,
        language: true,
        url: true,
        stars: true,
        forks: true,
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

    const latest = analyses[0] ?? null;
    const previous = analyses[1] ?? null;

    const comparison = latest && previous
      ? compareScores(
          latest,
          previous
        )
      : null;

    const latestOverall =
      latest?.codeHealth ?? 0;

    const previousOverall =
      previous?.codeHealth ?? 0;

    const overallChange =
      latest && previous
        ? latestOverall - previousOverall
        : null;

    const improvementSummary = {
      available: Boolean(latest && previous),
      currentScore: latest?.codeHealth ?? null,
      previousScore: previous?.codeHealth ?? null,
      change: overallChange,
      trend:
        overallChange === null
          ? "insufficient_data"
          : overallChange > 0
            ? "improved"
            : overallChange < 0
              ? "declined"
              : "unchanged",
    };

    const historyStats = {
      totalAnalyses: analyses.length,
      totalIssues: analyses.reduce(
        (sum, analysis) => sum + analysis.issueCount,
        0
      ),
      latestAnalysisAt: latest?.createdAt ?? null,
      previousAnalysisAt: previous?.createdAt ?? null,
    };

    const trend = analyses
      .slice()
      .reverse()
      .map((analysis) => ({
        id: analysis.id,
        date: analysis.createdAt,
        codeQuality: analysis.codeQuality,
        security: analysis.security,
        performance: analysis.performance,
        maintainability: analysis.maintainability,
        codeHealth: analysis.codeHealth,
        issueCount: analysis.issueCount,
      }));

    return NextResponse.json({
      success: true,
      repository,
      historyStats,
      improvementSummary,
      comparison,
      trend,
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
