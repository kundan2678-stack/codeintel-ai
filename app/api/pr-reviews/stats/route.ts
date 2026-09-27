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
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    const reviews = await prisma.pRReview.findMany({
      where: {
        pullRequest: {
          repositoryId: repository.id,
        },
      },
      include: {
        findings: true,
        pullRequest: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalReviews = reviews.length;

    const totalFindings = reviews.reduce(
      (total, review) => total + review.findings.length,
      0
    );

    const averageScore =
      totalReviews > 0
        ? Math.round(
            reviews.reduce(
              (total, review) => total + review.score,
              0
            ) / totalReviews
          )
        : 0;

    const highRiskReviews = reviews.filter(
      (review) =>
        review.risk === "High" ||
        review.risk === "Critical"
    ).length;

    const criticalFindings = reviews.reduce(
      (total, review) =>
        total +
        review.findings.filter(
          (finding) => finding.severity === "Critical"
        ).length,
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews,
        totalFindings,
        averageScore,
        highRiskReviews,
        criticalFindings,
      },
    });
  } catch (error) {
    console.error("PR review stats error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load PR review statistics",
      },
      { status: 500 }
    );
  }
}