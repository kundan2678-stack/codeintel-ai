import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Review ID is required",
        },
        { status: 400 }
      );
    }

    const review = await prisma.pRReview.findUnique({
      where: {
        id,
      },
      include: {
        findings: {
          orderBy: {
            severity: "desc",
          },
        },
        pullRequest: {
          include: {
            repository: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: "Review not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        score: review.score,
        risk: review.risk,
        summary: review.summary,
        createdAt: review.createdAt,
        pullRequest: {
          number: review.pullRequest.number,
          title: review.pullRequest.title,
          repository:
            review.pullRequest.repository.fullName,
        },
        findings: review.findings,
      },
    });
  } catch (error) {
    console.error(
      "Review detail API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load review",
      },
      { status: 500 }
    );
  }
}