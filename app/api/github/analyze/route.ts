import { NextResponse } from "next/server";
import { Octokit } from "octokit";

type AnalysisIssue = {
  type: string;
  severity: "High" | "Medium" | "Low";
  message: string;
  file: string;
  line: number;
};

function analyzeCode(code: string, filePath: string) {
  const lines = code.split("\n");

  const issues: AnalysisIssue[] = [];

  let functionCount = 0;
  let importCount = 0;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Imports
    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("from ") ||
      trimmed.startsWith("require(")
    ) {
      importCount++;
    }

    // Function detection
    if (
      /\bfunction\s+\w+\s*\(/.test(line) ||
      /\bdef\s+\w+\s*\(/.test(line) ||
      /=>\s*[{\n]/.test(line)
    ) {
      functionCount++;
    }

    // eval()
    if (/\beval\s*\(/.test(line)) {
      issues.push({
        type: "Security",
        severity: "High",
        message: "Use of eval() can introduce security risks.",
        file: filePath,
        line: lineNumber,
      });
    }

    // console.log
    if (/\bconsole\.log\s*\(/.test(line)) {
      issues.push({
        type: "Code Quality",
        severity: "Low",
        message: "Debug console.log detected.",
        file: filePath,
        line: lineNumber,
      });
    }

    // TypeScript any
    if (/\bany\b/.test(line) && filePath.match(/\.(ts|tsx)$/)) {
      issues.push({
        type: "Maintainability",
        severity: "Low",
        message: "Explicit 'any' type detected.",
        file: filePath,
        line: lineNumber,
      });
    }

    // TODO
    if (/TODO|FIXME/.test(line)) {
      issues.push({
        type: "Code Quality",
        severity: "Low",
        message: "TODO/FIXME comment detected.",
        file: filePath,
        line: lineNumber,
      });
    }

    // Possible SQL injection pattern
    if (
      /(SELECT|INSERT|UPDATE|DELETE).*(\+|\$\{)/i.test(line)
    ) {
      issues.push({
        type: "Security",
        severity: "High",
        message:
          "Possible SQL query built using string concatenation/interpolation.",
        file: filePath,
        line: lineNumber,
      });
    }
  });

  // Approximate complexity
  const complexity =
    1 +
    (code.match(/\bif\s*\(/g) || []).length +
    (code.match(/\bfor\s*\(/g) || []).length +
    (code.match(/\bwhile\s*\(/g) || []).length +
    (code.match(/\bswitch\s*\(/g) || []).length +
    (code.match(/\bcatch\s*\(/g) || []).length;

  return {
    lines: lines.length,
    functions: functionCount,
    imports: importCount,
    complexity,
    issues,
  };
}

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

    if (!repo) {
      return NextResponse.json(
        { error: "Repository is required" },
        { status: 400 }
      );
    }

    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      return NextResponse.json(
        {
          error: "Invalid repository format. Use owner/repository",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    // Get repository information
    const repository = await octokit.request(
      "GET /repos/{owner}/{repo}",
      {
        owner,
        repo: name,
      }
    );

    const branch = repository.data.default_branch;

    // Get branch
    const branchResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      {
        owner,
        repo: name,
        branch,
      }
    );

    const sha = branchResponse.data.commit.sha;

    // Get complete repository tree
    const treeResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      {
        owner,
        repo: name,
        tree_sha: sha,
        recursive: "true",
      }
    );

    // Supported source files
    const sourceExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".c",
      ".cpp",
    ];

    const sourceFiles = treeResponse.data.tree
      .filter(
        (item) =>
          item.type === "blob" &&
          item.path &&
          sourceExtensions.some((ext) =>
            item.path!.toLowerCase().endsWith(ext)
          )
      )
      .slice(0, 10);

    const analyzedFiles = [];

    let totalLines = 0;
    let totalFunctions = 0;
    let totalImports = 0;
    let totalComplexity = 0;

    for (const file of sourceFiles) {
      try {
        const response = await octokit.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          {
            owner,
            repo: name,
            path: file.path!,
            ref: branch,
          }
        );

        if (
          !Array.isArray(response.data) &&
          response.data.type === "file"
        ) {
          const content = Buffer.from(
            response.data.content || "",
            "base64"
          ).toString("utf-8");

          const analysis = analyzeCode(
            content,
            file.path!
          );

          totalLines += analysis.lines;
          totalFunctions += analysis.functions;
          totalImports += analysis.imports;
          totalComplexity += analysis.complexity;

          analyzedFiles.push({
            path: file.path,
            size: file.size,
            ...analysis,
          });
        }
      } catch (fileError) {
        console.error(
          `Failed to analyze ${file.path}`,
          fileError
        );
      }
    }

    const allIssues = analyzedFiles.flatMap(
      (file) => file.issues
    );

    const highIssues = allIssues.filter(
      (issue) => issue.severity === "High"
    ).length;

    const mediumIssues = allIssues.filter(
      (issue) => issue.severity === "Medium"
    ).length;

    const lowIssues = allIssues.filter(
      (issue) => issue.severity === "Low"
    ).length;

    return NextResponse.json({
      success: true,

      repository: {
        name: repository.data.name,
        fullName: repository.data.full_name,
        branch,
        url: repository.data.html_url,
      },

      summary: {
        filesAnalyzed: analyzedFiles.length,
        totalSourceFiles: sourceFiles.length,
        lines: totalLines,
        functions: totalFunctions,
        imports: totalImports,
        complexity: totalComplexity,
        issues: allIssues.length,
        highIssues,
        mediumIssues,
        lowIssues,
      },

      files: analyzedFiles,

      issues: allIssues,
    });
  } catch (error) {
    console.error("Analysis API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze repository",
      },
      { status: 500 }
    );
  }
}