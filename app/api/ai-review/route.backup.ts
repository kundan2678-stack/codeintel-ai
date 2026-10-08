import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Severity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

type Category =
  | "Security"
  | "Bug"
  | "Performance"
  | "Maintainability";

type Finding = {
  category: Category;
  severity: Severity;
  title: string;
  file: string;
  line: number;
  explanation: string;
  recommendation: string;
  suggestedFix: string;
};

function analyzeDiff(code: string): Finding[] {
  const findings: Finding[] = [];

  const lines = code.split(/\r?\n/);

  let currentFile = "Changed code";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("FILE:")) {
      currentFile =
        line.replace("FILE:", "").trim() ||
        "Changed code";

      continue;
    }

    const isAddedLine =
      line.startsWith("+") &&
      !line.startsWith("+++");

    if (!isAddedLine) {
      continue;
    }

    const content = line.slice(1);

    if (/\beval\s*\(/.test(content)) {
      findings.push({
        category: "Security",
        severity: "Critical",
        title: "Unsafe eval() usage",
        file: currentFile,
        line: i + 1,
        explanation:
          "eval() executes dynamically supplied JavaScript and can lead to arbitrary code execution.",
        recommendation:
          "Avoid eval() and use explicit logic or a safe parser instead.",
        suggestedFix:
          "Remove eval() and replace it with validated explicit operations.",
      });
    }

    if (/\bnew\s+Function\s*\(/.test(content)) {
      findings.push({
        category: "Security",
        severity: "Critical",
        title: "Dynamic Function construction",
        file: currentFile,
        line: i + 1,
        explanation:
          "new Function() dynamically creates executable JavaScript.",
        recommendation:
          "Avoid dynamic function construction.",
        suggestedFix:
          "Use a normal function with explicit parameters.",
      });
    }

    if (
      /\bapi[_-]?key\b\s*[:=]\s*["'`]/i.test(
        content
      ) ||
      /\b(secret|password|token)\b\s*[:=]\s*["'`]/i.test(
        content
      )
    ) {
      findings.push({
        category: "Security",
        severity: "Critical",
        title: "Possible hardcoded secret",
        file: currentFile,
        line: i + 1,
        explanation:
          "A credential-like value appears to be stored directly in source code.",
        recommendation:
          "Move secrets to environment variables or a secure secret manager.",
        suggestedFix:
          "Use process.env.SECRET_NAME instead of storing secrets in source code.",
      });
    }

    if (/dangerouslySetInnerHTML/.test(content)) {
      findings.push({
        category: "Security",
        severity: "High",
        title: "Potential XSS risk",
        file: currentFile,
        line: i + 1,
        explanation:
          "dangerouslySetInnerHTML can render untrusted HTML.",
        recommendation:
          "Sanitize HTML or avoid raw HTML injection.",
        suggestedFix:
          "Prefer normal React rendering or sanitized HTML.",
      });
    }

    if (/\.innerHTML\s*=/.test(content)) {
      findings.push({
        category: "Security",
        severity: "High",
        title: "Direct innerHTML assignment",
        file: currentFile,
        line: i + 1,
        explanation:
          "Direct HTML injection can create XSS vulnerabilities.",
        recommendation:
          "Prefer safe DOM APIs or framework-safe rendering.",
        suggestedFix:
          "Use textContent when HTML rendering is not required.",
      });
    }

    if (
      /\bchild_process\b/.test(content) ||
      /\bexec\s*\(/.test(content) ||
      /\bexecSync\s*\(/.test(content)
    ) {
      findings.push({
        category: "Security",
        severity: "High",
        title: "Operating-system command execution",
        file: currentFile,
        line: i + 1,
        explanation:
          "Command execution can become a command-injection risk.",
        recommendation:
          "Avoid shell execution and validate command arguments.",
        suggestedFix:
          "Use fixed executables with validated arguments.",
      });
    }

    if (
      /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(
        content
      ) &&
      (content.includes("+") ||
        content.includes("${"))
    ) {
      findings.push({
        category: "Security",
        severity: "High",
        title: "Potential SQL injection",
        file: currentFile,
        line: i + 1,
        explanation:
          "SQL appears to be constructed dynamically.",
        recommendation:
          "Use parameterized queries or an ORM.",
        suggestedFix:
          "Replace string-built SQL with a parameterized query.",
      });
    }

    if (/console\.log\s*\(/.test(content)) {
      findings.push({
        category: "Maintainability",
        severity: "Low",
        title: "Console logging in changed code",
        file: currentFile,
        line: i + 1,
        explanation:
          "Debug logging can create noisy production logs.",
        recommendation:
          "Remove unnecessary console logs or use structured logging.",
        suggestedFix:
          "Replace console.log with the application's logging utility.",
      });
    }

    if (/: *any\b/.test(content)) {
      findings.push({
        category: "Maintainability",
        severity: "Low",
        title: "Explicit any type",
        file: currentFile,
        line: i + 1,
        explanation:
          "The any type removes TypeScript type safety.",
        recommendation:
          "Use a specific type, interface, unknown, or generic.",
        suggestedFix:
          "Replace any with an explicit TypeScript type.",
      });
    }

    if (/\b(TODO|FIXME)\b/.test(content)) {
      findings.push({
        category: "Maintainability",
        severity: "Low",
        title: "Incomplete implementation marker",
        file: currentFile,
        line: i + 1,
        explanation:
          "The changed code contains a TODO/FIXME marker.",
        recommendation:
          "Complete the task or track it as an issue.",
        suggestedFix:
          "Implement the required change and remove the marker.",
      });
    }

    if (
      /\b(os\.system|pickle\.loads?|yaml\.load)\s*\(/.test(
        content
      )
    ) {
      findings.push({
        category: "Security",
        severity: "High",
        title: "Potentially unsafe Python operation",
        file: currentFile,
        line: i + 1,
        explanation:
          "This operation can be unsafe with untrusted input.",
        recommendation:
          "Validate input and use safer alternatives.",
        suggestedFix:
          "Use safe serialization and validated subprocess APIs.",
      });
    }
  }

  return findings;
}

function scoreFindings(
  findings: Finding[]
): number {
  let score = 100;

  for (const finding of findings) {
    if (finding.severity === "Critical") {
      score -= 25;
    } else if (finding.severity === "High") {
      score -= 15;
    } else if (finding.severity === "Medium") {
      score -= 8;
    } else {
      score -= 3;
    }
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

function riskFromScore(
  score: number
): Severity {
  if (score < 40) return "Critical";
  if (score < 60) return "High";
  if (score < 80) return "Medium";

  return "Low";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const repo = searchParams.get("repo");
    const numberParam = searchParams.get("number");

    if (!repo || !numberParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository and pull request number are required.",
        },
        { status: 400 }
      );
    }

    const number = Number(numberParam);

    if (!Number.isInteger(number)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pull request number.",
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
      return NextResponse.json({
        success: true,
        review: null,
      });
    }

    const pullRequest =
      await prisma.pullRequest.findUnique({
        where: {
          repositoryId_number: {
            repositoryId: repository.id,
            number,
          },
        },
        include: {
          reviews: {
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

    if (!pullRequest || pullRequest.reviews.length === 0) {
      return NextResponse.json({
        success: true,
        review: null,
      });
    }


const reviews = pullRequest.reviews;

return NextResponse.json({
  success: true,

  review:
    reviews.length > 0
      ? {
          id: reviews[0].id,
          summary: reviews[0].summary,
          risk: reviews[0].risk,
          score: reviews[0].score,
          findings: reviews[0].findings,
          createdAt: reviews[0].createdAt,
        }
      : null,

  history: reviews.map((review) => ({
    id: review.id,
    summary: review.summary,
    risk: review.risk,
    score: review.score,
    findingsCount:
      review.findings.length,
    createdAt: review.createdAt,
  })),
});
  } catch (error) {
    console.error(
      "Saved PR review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load saved PR review.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body.code !== "string" ||
      !body.code.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Pull request diff is required.",
        },
        { status: 400 }
      );
    }

    const repo =
      typeof body.repo === "string"
        ? body.repo
        : "kundan2678-stack/codeintel-ai";

    const number = Number(body.number);

    if (!Number.isInteger(number)) {
      return NextResponse.json(
        {
          success: false,
          error: "Pull request number is required.",
        },
        { status: 400 }
      );
    }

    const [owner, repoName] = repo.split("/");

    if (!owner || !repoName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Repository must be in owner/repository format.",
        },
        { status: 400 }
      );
    }

    /*
     * GitHub client
     */

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub token is not configured.",
        },
        { status: 500 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    /*
     * Get repository from GitHub
     */

    const githubRepository =
      await octokit.request(
        "GET /repos/{owner}/{repo}",
        {
          owner,
          repo: repoName,
        }
      );

    /*
     * Get pull request from GitHub
     */

    const githubPR =
      await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo: repoName,
          pull_number: number,
        }
      );

    const githubRepo =
      githubRepository.data;

    const githubPullRequest =
      githubPR.data;

    /*
     * Create/update repository in PostgreSQL.
     */

    const repositoryRecord =
      await prisma.repository.upsert({
        where: {
          githubId: String(
            githubRepo.id
          ),
        },

        update: {
          name: githubRepo.name,
          fullName:
            githubRepo.full_name,
          description:
            githubRepo.description,
          language:
            githubRepo.language,
          stars:
            githubRepo.stargazers_count,
          forks:
            githubRepo.forks_count,
          url:
            githubRepo.html_url,
          isPrivate:
            githubRepo.private,
        },

        create: {
          githubId: String(
            githubRepo.id
          ),
          name: githubRepo.name,
          fullName:
            githubRepo.full_name,
          description:
            githubRepo.description,
          language:
            githubRepo.language,
          stars:
            githubRepo.stargazers_count,
          forks:
            githubRepo.forks_count,
          url:
            githubRepo.html_url,
          isPrivate:
            githubRepo.private,
        },
      });

    /*
     * Create/update Pull Request in PostgreSQL.
     */

    const pullRequestRecord =
      await prisma.pullRequest.upsert({
        where: {
          repositoryId_number: {
            repositoryId:
              repositoryRecord.id,
            number:
              githubPullRequest.number,
          },
        },

        update: {
          githubId: String(
            githubPullRequest.id
          ),
          title:
            githubPullRequest.title,
          body:
            githubPullRequest.body,
          state:
            githubPullRequest.state,
          author:
            githubPullRequest.user?.login ||
            "unknown",
          branch:
            githubPullRequest.head.ref,
          baseBranch:
            githubPullRequest.base.ref,
          additions:
            githubPullRequest.additions,
          deletions:
            githubPullRequest.deletions,
          changedFiles:
            githubPullRequest.changed_files,
          updatedAt:
            new Date(
              githubPullRequest.updated_at
            ),
        },

        create: {
          githubId: String(
            githubPullRequest.id
          ),
          number:
            githubPullRequest.number,
          title:
            githubPullRequest.title,
          body:
            githubPullRequest.body,
          state:
            githubPullRequest.state,
          author:
            githubPullRequest.user?.login ||
            "unknown",
          branch:
            githubPullRequest.head.ref,
          baseBranch:
            githubPullRequest.base.ref,
          additions:
            githubPullRequest.additions,
          deletions:
            githubPullRequest.deletions,
          changedFiles:
            githubPullRequest.changed_files,
          repository: {
            connect: {
              id: repositoryRecord.id,
            },
          },
          createdAt:
            new Date(
              githubPullRequest.created_at
            ),
          updatedAt:
            new Date(
              githubPullRequest.updated_at
            ),
        },
      });

    /*
     * Run CodeIntel local review.
     */

    const findings =
      analyzeDiff(body.code);

    const score =
      scoreFindings(findings);

    const risk =
      riskFromScore(score);

    const summary =
      findings.length === 0
        ? "No major issues were detected in the analyzed pull request."
        : `Detected ${findings.length} potential issue${
            findings.length === 1
              ? ""
              : "s"
          } across the changed code.`;

    /*
     * Save review + findings.
     */

    const review =
      await prisma.pRReview.create({
        data: {
          pullRequestId:
            pullRequestRecord.id,

          score,
          risk,
          summary,

          findings: {
            create: findings.map(
              (finding) => ({
                category:
                  finding.category,
                severity:
                  finding.severity,
                title:
                  finding.title,
                file:
                  finding.file,
                line:
                  finding.line,
                explanation:
                  finding.explanation,
                recommendation:
                  finding.recommendation,
                suggestedFix:
                  finding.suggestedFix,
              })
            ),
          },
        },

        include: {
          findings: true,
        },
      });

    return NextResponse.json({
      success: true,

      review: {
        id: review.id,
        summary: review.summary,
        risk: review.risk,
        score: review.score,
        findings: review.findings,
        createdAt:
          review.createdAt,
      },

      database: {
        repositoryId:
          repositoryRecord.id,

        pullRequestId:
          pullRequestRecord.id,

        reviewId:
          review.id,
      },
    });
  } catch (error) {
    console.error(
      "Local PR review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Local PR review failed.",
      },
      { status: 500 }
    );
  }
}