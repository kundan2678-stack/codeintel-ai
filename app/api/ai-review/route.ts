
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Severity = "Low" | "Medium" | "High" | "Critical";

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

type ReviewRequestBody = {
  code?: unknown;
  repo?: unknown;
  number?: unknown;
};

function isRuleOrDescriptionLine(content: string): boolean {
  const trimmed = content.trim();

  // Avoid obvious self-matches from scanner implementation
  // and from the scanner's own finding descriptions.
  if (/\.test\s*\(\s*content\s*\)/.test(trimmed)) {
    return true;
  }

  if (
    /^\s*(?:title|explanation|recommendation|suggestedFix)\s*:/.test(
      trimmed
    )
  ) {
    return true;
  }

  return false;
}

function analyzeDiff(diff: string): Finding[] {
  const findings: Finding[] = [];
  const lines = diff.split(/\r?\n/);

  let currentFile = "Changed code";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Support the FILE: format used by the application.
    if (line.startsWith("FILE:")) {
      currentFile = line.slice("FILE:".length).trim() || "Changed code";
      continue;
    }

    // Only inspect added lines in a unified diff.
    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }

    const content = line.slice(1);
    const trimmed = content.trim();

    // Skip obvious scanner rules and their metadata.
    // This is a heuristic, not a complete parser.
    if (isRuleOrDescriptionLine(content)) {
      continue;
    }

    // Ignore ordinary comment-only lines for most checks.
    // TODO/FIXME is handled separately below.
    const isCommentOnly =
      /^\s*\/\//.test(content) ||
      /^\s*\*/.test(content) ||
      /^\s*\/\*/.test(content) ||
      /^\s*#/.test(content);

    if (!isCommentOnly) {
      // Dynamic JavaScript execution.
      if (/\beval\s*\(/.test(content)) {
        findings.push({
          category: "Security",
          severity: "Critical",
          title: "Unsafe dynamic evaluation",
          file: currentFile,
          line: i + 1,
          explanation:
            "Dynamic evaluation can execute supplied JavaScript and may allow arbitrary code execution.",
          recommendation:
            "Avoid dynamic evaluation and use explicit logic or a safe parser.",
          suggestedFix:
            "Replace dynamic evaluation with validated, explicit operations.",
        });
      }
      if (/\bnew\s+Function\s*\(/.test(content)) {
        findings.push({
          category: "Security",
          severity: "Critical",
          title: "Dynamic function construction",
          file: currentFile,
          line: i + 1,
          explanation:
            "Dynamic function construction creates executable JavaScript at runtime.",
          recommendation:
            "Avoid dynamically constructing executable functions.",
          suggestedFix:
            "Use a normal function with explicit parameters and validated inputs.",
        });
      }

      // Possible hardcoded credentials.
      const possibleSecret =
        /\b(?:api[_-]?key|secret|password|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["'`][^"'`]{8,}["'`]/i.test(
          content
        );

      const looksLikePlaceholder =
        /process\.env|example|placeholder|your[_-]|replace[_-]?me|changeme/i.test(
          content
        );

      if (possibleSecret && !looksLikePlaceholder) {
        findings.push({
          category: "Security",
          severity: "Critical",
          title: "Possible hardcoded secret",
          file: currentFile,
          line: i + 1,
          explanation:
            "A credential-like value appears to be assigned directly in source code.",
          recommendation:
            "Verify the value and move real credentials to environment variables or a secret manager.",
          suggestedFix:
            "Read the credential from a server-side environment variable.",
        });
      }

      // React raw HTML rendering.
      if (/\bdangerouslySetInnerHTML\b/.test(content)) {
        findings.push({
          category: "Security",
          severity: "High",
          title: "Potential unsafe HTML rendering",
          file: currentFile,
          line: i + 1,
          explanation:
            "Raw HTML rendering can introduce cross-site scripting when the HTML is untrusted.",
          recommendation:
            "Prefer normal React rendering or sanitize untrusted HTML with a suitable sanitizer.",
          suggestedFix:
            "Render text normally or sanitize HTML before rendering it.",
        });
      }

      // Direct DOM HTML assignment.
      if (/\.innerHTML\s*=/.test(content)) {
        findings.push({
          category: "Security",
          severity: "High",
          title: "Direct HTML assignment",
          file: currentFile,
          line: i + 1,
          explanation:
            "Assigning untrusted HTML directly to a DOM element can introduce XSS.",
          recommendation:
            "Prefer safe DOM APIs and avoid inserting untrusted HTML.",
          suggestedFix:
            "Use textContent when HTML rendering is not required.",
        });
      }

      // Operating-system command execution.
      if (
        /\bchild_process\b/.test(content) ||
        /\bexec(?:Sync)?\s*\(/.test(content) ||
        /\bspawn(?:Sync)?\s*\(/.test(content)
      ) {
        findings.push({
          category: "Security",
          severity: "High",
          title: "Potential command execution",
          file: currentFile,
          line: i + 1,
          explanation:
            "Command execution may become dangerous when untrusted data controls the executable or arguments.",
          recommendation:
            "Verify input validation, argument handling, and whether shell execution is enabled.",
          suggestedFix:
            "Use a fixed executable with validated arguments and avoid shell interpolation.",
        });
      }

      // Potential SQL injection.
      if (
        /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i.test(content) &&
        (content.includes("+") || content.includes("${"))
      ) {
        findings.push({
          category: "Security",
          severity: "High",
          title: "Potential SQL injection",
          file: currentFile,
          line: i + 1,
          explanation:
            "SQL-like text appears to be combined with dynamic values. This does not prove an injection vulnerability.",
          recommendation:
            "Check whether values are safely bound as query parameters.",
          suggestedFix:
            "Use parameterized queries or the application's ORM instead of concatenating untrusted input.",
        });
      }

      // Maintainability checks.
      if (/\bconsole\.log\s*\(/.test(content)) {
        findings.push({
          category: "Maintainability",
          severity: "Low",
          title: "Console logging",
          file: currentFile,
          line: i + 1,
          explanation:
            "Debug logging may create unnecessary production logs.",
          recommendation:
            "Remove unnecessary debug statements or use structured logging.",
          suggestedFix:
            "Use the application's logging utility where appropriate.",
        });
      }

      if (/\bany\b/.test(content) && /\.(?:ts|tsx)$/.test(currentFile)) {
        findings.push({
          category: "Maintainability",
          severity: "Low",
          title: "Possible explicit any type",
          file: currentFile,
          line: i + 1,
          explanation:
            "The any type can weaken TypeScript type checking.",
          recommendation:
            "Use a specific type, interface, unknown, or a generic where appropriate.",
          suggestedFix:
            "Replace an actual any type annotation with a suitable explicit type.",
        });
      }

      // Python-specific checks.
      if (/\.(?:py)$/.test(currentFile)) {
        if (/\bos\.system\s*\(/.test(content)) {
          findings.push({
            category: "Security",
            severity: "High",
            title: "Potential unsafe OS command",
            file: currentFile,
            line: i + 1,
            explanation:
              "os.system can execute operating-system commands.",
            recommendation:
              "Verify whether untrusted data can affect the executed command.",
            suggestedFix:
              "Prefer subprocess APIs with validated argument arrays and no shell.",
          });
        }

        if (
          /\bsubprocess\.\w+\s*\(/.test(content) &&
          /\bshell\s*=\s*True\b/.test(content)
        ) {
          findings.push({
            category: "Security",
            severity: "High",
            title: "Subprocess shell execution",
            file: currentFile,
            line: i + 1,
            explanation:
              "Using a shell with subprocess can create command-injection risks.",
            recommendation:
              "Avoid shell execution when possible and validate all inputs.",
            suggestedFix:
              "Use a fixed executable and a list of validated arguments.",
          });
        }

        if (/\bpickle\.loads?\s*\(/.test(content)) {
          findings.push({
            category: "Security",
            severity: "High",
            title: "Potential unsafe deserialization",
            file: currentFile,
            line: i + 1,
            explanation:
              "Deserializing untrusted pickle data may execute malicious code.",
            recommendation:
              "Do not load pickle data from untrusted sources.",
            suggestedFix:
              "Use a safer data format for untrusted input.",
          });
        }

        if (
          /\byaml\.load\s*\(/.test(content) &&
          !/\bSafeLoader\b/.test(content)
        ) {
          findings.push({
            category: "Security",
            severity: "High",
            title: "Potential unsafe YAML loading",
            file: currentFile,
            line: i + 1,
            explanation:
              "YAML loading may be unsafe depending on the loader and input.",
            recommendation:
              "Use a safe YAML loader for untrusted input.",
            suggestedFix:
              "Use yaml.safe_load or the equivalent safe loader.",
          });
        }
      }

      // Java-specific command execution.
      if (
        /\.java$/.test(currentFile) &&
        /Runtime\.getRuntime\s*\(\s*\)\s*\.exec\s*\(/.test(content)
      ) {
        findings.push({
          category: "Security",
          severity: "High",
          title: "Potential Java command execution",
          file: currentFile,
          line: i + 1,
          explanation:
            "Runtime.exec can execute operating-system commands.",
          recommendation:
            "Verify command arguments and prevent untrusted input from controlling execution.",
          suggestedFix:
            "Use fixed commands and validated arguments.",
        });
      }
    }

    // TODO/FIXME markers are useful even when placed in comments.
    if (/\b(TODO|FIXME)\b/.test(content)) {
      findings.push({
        category: "Maintainability",
        severity: "Low",
        title: "Incomplete implementation marker",
        file: currentFile,
        line: i + 1,
        explanation:
          "The changed line contains a TODO or FIXME marker.",
        recommendation:
          "Complete the task or track it in the project's issue tracker.",
        suggestedFix:
          "Implement the required change and remove the marker when resolved.",
      });
    }
  }

  return findings;
}

function scoreFindings(findings: Finding[]): number {
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

  return Math.max(0, Math.min(100, score));
}

function riskFromScore(score: number): Severity {
  if (score < 40) return "Critical";
  if (score < 60) return "High";
  if (score < 80) return "Medium";
  return "Low";
}

function parseRepositoryName(value: unknown): {
  owner: string;
  name: string;
} | null {
  if (typeof value !== "string") return null;

  const parts = value.trim().split("/");

  if (
    parts.length !== 2 ||
    !/^[a-zA-Z0-9_.-]+$/.test(parts[0]) ||
    !/^[a-zA-Z0-9_.-]+$/.test(parts[1])
  ) {
    return null;
  }

  return { owner: parts[0], name: parts[1] };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");
    const numberParam = searchParams.get("number");
    const number = Number(numberParam);

    if (!repo || !numberParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository and pull request number are required.",
        },
        { status: 400 }
      );
    }

    if (!parseRepositoryName(repo)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository format. Use owner/repository.",
        },
        { status: 400 }
      );
    }

    if (!Number.isSafeInteger(number) || number < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pull request number.",
        },
        { status: 400 }
      );
    }

    const repository = await prisma.repository.findUnique({
      where: { fullName: repo },
    });

    if (!repository) {
      return NextResponse.json({
        success: true,
        review: null,
        history: [],
      });
    }

    const pullRequest = await prisma.pullRequest.findUnique({
      where: {
        repositoryId_number: {
          repositoryId: repository.id,
          number,
        },
      },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { findings: true },
        },
      },
    });

    if (!pullRequest || pullRequest.reviews.length === 0) {
      return NextResponse.json({
        success: true,
        review: null,
        history: [],
      });
    }

    const reviews = pullRequest.reviews;
    const latestReview = reviews[0];

    return NextResponse.json({
      success: true,
      review: {
        id: latestReview.id,
        summary: latestReview.summary,
        risk: latestReview.risk,
        score: latestReview.score,
        findings: latestReview.findings,
        createdAt: latestReview.createdAt,
      },
      history: reviews.map((review) => ({
        id: review.id,
        summary: review.summary,
        risk: review.risk,
        score: review.score,
        findingsCount: review.findings.length,
        createdAt: review.createdAt,
      })),
    });
  } catch (error) {
    console.error("Saved PR review error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load saved PR review.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsedBody: unknown = await request.json();

    if (
      !parsedBody ||
      typeof parsedBody !== "object" ||
      Array.isArray(parsedBody)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const body = parsedBody as ReviewRequestBody;

    if (typeof body.code !== "string" || !body.code.trim()) {
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
        ? body.repo.trim()
        : "kundan2678-stack/codeintel-ai";

    const parsedRepo = parseRepositoryName(repo);

    if (!parsedRepo) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository must be in owner/repository format.",
        },
        { status: 400 }
      );
    }

    const number = Number(body.number);

    if (!Number.isSafeInteger(number) || number < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid pull request number is required.",
        },
        { status: 400 }
      );
    }

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

    const octokit = new Octokit({ auth: token });
    const { owner, name: repoName } = parsedRepo;

    const [githubRepository, githubPR] = await Promise.all([
      octokit.request("GET /repos/{owner}/{repo}", {
        owner,
        repo: repoName,
      }),
      octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
        owner,
        repo: repoName,
        pull_number: number,
      }),
    ]);

    const githubRepo = githubRepository.data;
    const githubPullRequest = githubPR.data;

    const commitSha = String(githubPullRequest.head?.sha || "").trim();

    if (!commitSha) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub commit SHA could not be determined.",
        },
        { status: 502 }
      );
    }

    const repositoryRecord = await prisma.repository.upsert({
      where: {
        githubId: String(githubRepo.id),
      },
      update: {
        name: githubRepo.name,
        fullName: githubRepo.full_name,
        description: githubRepo.description,
        language: githubRepo.language,
        stars: githubRepo.stargazers_count,
        forks: githubRepo.forks_count,
        url: githubRepo.html_url,
        isPrivate: githubRepo.private,
      },
      create: {
        githubId: String(githubRepo.id),
        name: githubRepo.name,
        fullName: githubRepo.full_name,
        description: githubRepo.description,
        language: githubRepo.language,
        stars: githubRepo.stargazers_count,
        forks: githubRepo.forks_count,
        url: githubRepo.html_url,
        isPrivate: githubRepo.private,
      },
    });

    const pullRequestRecord = await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repositoryRecord.id,
          number: githubPullRequest.number,
        },
      },
      update: {
        githubId: String(githubPullRequest.id),
        title: githubPullRequest.title,
        body: githubPullRequest.body,
        state: githubPullRequest.state,
        author: githubPullRequest.user?.login || "unknown",
        branch: githubPullRequest.head.ref,
        baseBranch: githubPullRequest.base.ref,
        additions: githubPullRequest.additions,
        deletions: githubPullRequest.deletions,
        changedFiles: githubPullRequest.changed_files,
        updatedAt: new Date(githubPullRequest.updated_at),
      },
      create: {
        githubId: String(githubPullRequest.id),
        number: githubPullRequest.number,
        title: githubPullRequest.title,
        body: githubPullRequest.body,
        state: githubPullRequest.state,
        author: githubPullRequest.user?.login || "unknown",
        branch: githubPullRequest.head.ref,
        baseBranch: githubPullRequest.base.ref,
        additions: githubPullRequest.additions,
        deletions: githubPullRequest.deletions,
        changedFiles: githubPullRequest.changed_files,
        repository: {
          connect: { id: repositoryRecord.id },
        },
        createdAt: new Date(githubPullRequest.created_at),
        updatedAt: new Date(githubPullRequest.updated_at),
      },
    });

    // Do not create duplicate reviews for the same PR commit.
    const existingReview = await prisma.pRReview.findFirst({
      where: {
        pullRequestId: pullRequestRecord.id,
        commitSha,
      },
      include: { findings: true },
      orderBy: { createdAt: "desc" },
    });

    if (existingReview) {
      return NextResponse.json({
        success: true,
        message: "This commit has already been reviewed.",
        repository: repo,
        pullRequest: number,
        review: {
          id: existingReview.id,
          summary: existingReview.summary,
          risk: existingReview.risk,
          score: existingReview.score,
          findings: existingReview.findings,
          createdAt: existingReview.createdAt,
        },
        database: {
          repositoryId: repositoryRecord.id,
          pullRequestId: pullRequestRecord.id,
          reviewId: existingReview.id,
        },
        duplicate: true,
      });
    }

    const findings = analyzeDiff(body.code);
    const score = scoreFindings(findings);
    const risk = riskFromScore(score);

    const summary =
      findings.length === 0
        ? "No major issues were detected by the heuristic checks."
        : `Detected ${findings.length} potential issue${
            findings.length === 1 ? "" : "s"
          } in the changed code. Manual verification is recommended.`;

    const review = await prisma.pRReview.create({
      data: {
        pullRequestId: pullRequestRecord.id,
        commitSha,
        score,
        risk,
        summary,
        findings: {
          create: findings.map((finding) => ({
            category: finding.category,
            severity: finding.severity,
            title: finding.title,
            file: finding.file,
            line: finding.line,
            explanation: finding.explanation,
            recommendation: finding.recommendation,
            suggestedFix: finding.suggestedFix,
          })),
        },
      },
      include: { findings: true },
    });

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review.id,
          summary: review.summary,
          risk: review.risk,
          score: review.score,
          findings: review.findings,
          createdAt: review.createdAt,
        },
        database: {
          repositoryId: repositoryRecord.id,
          pullRequestId: pullRequestRecord.id,
          reviewId: review.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Local PR review error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Local PR review failed. Check the server logs.",
      },
      { status: 500 }
    );
  }
}
