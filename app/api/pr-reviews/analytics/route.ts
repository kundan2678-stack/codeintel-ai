
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
      include: {
        pullRequests: {
          include: {
            reviews: {
              include: {
                findings: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    const reviews = repository.pullRequests.flatMap(
      (pr) => pr.reviews
    );

    const scoreTrend = reviews.map((review) => ({
      date: review.createdAt.toISOString(),
      score: review.score,
      risk: review.risk,
      pullRequest: `#${repository.pullRequests.find(
        (pr) => pr.reviews.some(
          (item) => item.id === review.id
        )
      )?.number ?? ""}`,
    }));

    const riskDistribution = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    for (const review of reviews) {
      const risk = review.risk as keyof typeof riskDistribution;

      if (risk in riskDistribution) {
        riskDistribution[risk]++;
      }
    }

    const findingsBySeverity = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    for (const review of reviews) {
      for (const finding of review.findings) {
        const severity =
          finding.severity as keyof typeof findingsBySeverity;

        if (severity in findingsBySeverity) {
          findingsBySeverity[severity]++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      repository: repository.fullName,
      scoreTrend,
      riskDistribution,
      findingsBySeverity,
    });
  } catch (error) {
    console.error("PR analytics error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load PR analytics",
      },
      { status: 500 }
    );
  }
}
