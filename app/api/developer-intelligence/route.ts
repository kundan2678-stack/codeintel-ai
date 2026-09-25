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
      include: {
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            findings: true,
          },
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository analysis not found",
        },
        { status: 404 }
      );
    }

    const analyses = repository.analyses;

    if (analyses.length === 0) {
      return NextResponse.json({
        success: true,
        repository: {
          name: repository.name,
          fullName: repository.fullName,
          language: repository.language,
        },
        intelligence: null,
      });
    }

    const latest = analyses[0];

    const totalIssues = analyses.reduce(
      (sum, analysis) => sum + analysis.issueCount,
      0
    );

    const securityIssues = analyses.flatMap((analysis) =>
      analysis.findings.filter(
        (finding) =>
          finding.type.toLowerCase() === "security"
      )
    );

    const maintainabilityIssues = analyses.flatMap(
      (analysis) =>
        analysis.findings.filter(
          (finding) =>
            finding.type.toLowerCase() ===
            "maintainability"
        )
    );

    const codeQualityIssues = analyses.flatMap(
      (analysis) =>
        analysis.findings.filter(
          (finding) =>
            finding.type.toLowerCase() ===
            "code quality"
        )
    );

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (latest.security >= 90) {
      strengths.push("Strong security practices");
    } else if (latest.security < 70) {
      weaknesses.push("Security needs improvement");

      recommendations.push(
        "Focus on secure coding practices and vulnerability prevention."
      );
    }

    if (latest.codeQuality >= 90) {
      strengths.push("High code quality");
    } else if (latest.codeQuality < 70) {
      weaknesses.push("Code quality needs improvement");

      recommendations.push(
        "Improve code structure, consistency and error handling."
      );
    }

    if (latest.maintainability >= 90) {
      strengths.push("Good maintainability");
    } else if (latest.maintainability < 70) {
      weaknesses.push(
        "Maintainability needs improvement"
      );

      recommendations.push(
        "Focus on modular design, type safety and reducing technical debt."
      );
    }

    if (latest.performance >= 90) {
      strengths.push("Good performance practices");
    } else if (latest.performance < 70) {
      weaknesses.push("Performance needs improvement");

      recommendations.push(
        "Review expensive operations, complexity and unnecessary processing."
      );
    }

    if (securityIssues.length > 0) {
      recommendations.push(
        "Review security findings and eliminate unsafe patterns."
      );
    }

    if (maintainabilityIssues.length > 0) {
      recommendations.push(
        "Reduce maintainability issues and improve code readability."
      );
    }

    if (codeQualityIssues.length > 0) {
      recommendations.push(
        "Resolve code-quality findings and remove unnecessary technical debt."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Continue maintaining the current engineering quality."
      );
    }

    return NextResponse.json({
      success: true,

      repository: {
        name: repository.name,
        fullName: repository.fullName,
        language: repository.language,
      },

      intelligence: {
        overallScore: latest.codeHealth,

        scores: {
          codeQuality: latest.codeQuality,
          security: latest.security,
          performance: latest.performance,
          maintainability: latest.maintainability,
        },

        developerSignals: {
          totalAnalyses: analyses.length,
          totalIssues,
          securityIssues: securityIssues.length,
          maintainabilityIssues:
            maintainabilityIssues.length,
          codeQualityIssues:
            codeQualityIssues.length,
        },

        strengths,
        weaknesses,
        recommendations,
      },
    });
  } catch (error) {
    console.error(
      "Developer intelligence error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to generate developer intelligence",
      },
      { status: 500 }
    );
  }
}