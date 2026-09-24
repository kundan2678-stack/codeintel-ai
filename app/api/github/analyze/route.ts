import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { ESLint } from "eslint";

type Severity = "High" | "Medium" | "Low";

type AnalysisIssue = {
  type: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
};


type ESLintIssue = {
  ruleId: string | null;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
};

async function runESLint(
  files: Array<{ path: string; content: string }>
): Promise<ESLintIssue[]> {
  const lintableFiles = files.filter(({ path: filePath }) =>
    /\.(ts|tsx|js|jsx)$/.test(filePath)
  );

  if (lintableFiles.length === 0) {
    return [];
  }

  try {
    const eslint = new ESLint({
      cwd: process.cwd(),
    });

    const results = await Promise.all(
      lintableFiles.map(async (file) => {
        try {
          const lintResults = await eslint.lintText(
            file.content,
            {
              filePath: file.path,
            }
          );

          return {
            file,
            results: lintResults,
          };
        } catch (error) {
          console.error(
            `ESLint failed for ${file.path}:`,
            error
          );

          return {
            file,
            results: [],
          };
        }
      })
    );

    return results.flatMap(({ file, results: lintResults }) =>
      lintResults.flatMap((result) =>
        result.messages.map((message) => ({
          ruleId: message.ruleId,
          severity:
            message.severity === 2
              ? ("High" as const)
              : ("Medium" as const),
          message: message.message,
          file: file.path,
          line: message.line || 1,
          column: message.column || 1,
        }))
      )
    );
  } catch (error) {
    console.error("ESLint analysis failed:", error);
    return [];
  }
}

function addIssue(
  issues: AnalysisIssue[],
  type: string,
  severity: Severity,
  message: string,
  file: string,
  line: number
) {
  issues.push({
    type,
    severity,
    message,
    file,
    line,
  });
}

function analyzeCode(
  code: string,
  filePath: string
) {
  const lines = code.split("\n");

  const issues: AnalysisIssue[] = [];

  let functionCount = 0;
  let importCount = 0;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // -----------------------------
    // IMPORT DETECTION
    // -----------------------------

    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("from ") ||
      trimmed.startsWith("require(")
    ) {
      importCount++;
    }

    // -----------------------------
    // FUNCTION DETECTION
    // -----------------------------

    if (
      /\bfunction\s+\w+\s*\(/.test(line) ||
      /\bdef\s+\w+\s*\(/.test(line) ||
      /=>\s*\{/.test(line)
    ) {
      functionCount++;
    }

    // -----------------------------
    // SECURITY: eval()
    // -----------------------------

    if (/\beval\s*\(/.test(line)) {
      addIssue(
        issues,
        "Security",
        "High",
        "Use of eval() can execute dynamic code and introduce serious security risks.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: new Function()
    // -----------------------------

    if (/new\s+Function\s*\(/.test(line)) {
      addIssue(
        issues,
        "Security",
        "High",
        "Dynamic Function construction can execute untrusted code.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: child_process
    // -----------------------------

    if (
      /child_process/.test(line) ||
      /\bexec\s*\(/.test(line) ||
      /\bexecSync\s*\(/.test(line)
    ) {
      addIssue(
        issues,
        "Security",
        "High",
        "Operating-system command execution detected. Validate all external input before execution.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: innerHTML
    // -----------------------------

    if (/\.innerHTML\s*=/.test(line)) {
      addIssue(
        issues,
        "Security",
        "Medium",
        "Direct innerHTML assignment can create XSS risks when content is user-controlled.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: React dangerouslySetInnerHTML
    // -----------------------------

    if (/dangerouslySetInnerHTML/.test(line)) {
      addIssue(
        issues,
        "Security",
        "Medium",
        "dangerouslySetInnerHTML can introduce XSS if HTML content is not trusted or sanitized.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: SQL INJECTION
    // -----------------------------

    if (
      /(SELECT|INSERT|UPDATE|DELETE)\b.*(\+|\$\{)/i.test(line)
    ) {
      addIssue(
        issues,
        "Security",
        "High",
        "Possible SQL query construction using string concatenation or interpolation.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: HARD CODED SECRET
    // -----------------------------

    if (
      /(api[_-]?key|secret|password|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/i.test(
        line
      )
    ) {
      addIssue(
        issues,
        "Security",
        "High",
        "Possible hardcoded secret, password, API key, or access token detected.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // SECURITY: HTTP URL
    // -----------------------------

    if (
      /["'`]http:\/\/[^"'`]+["'`]/.test(line) &&
      !/localhost|127\.0\.0\.1/.test(line)
    ) {
      addIssue(
        issues,
        "Security",
        "Low",
        "Unencrypted HTTP URL detected. HTTPS should normally be preferred.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // PYTHON SECURITY
    // -----------------------------

    if (filePath.endsWith(".py")) {
      if (/\bos\.system\s*\(/.test(line)) {
        addIssue(
          issues,
          "Security",
          "High",
          "os.system() can execute operating-system commands.",
          filePath,
          lineNumber
        );
      }

      if (
        /subprocess\./.test(line) &&
        /shell\s*=\s*True/.test(line)
      ) {
        addIssue(
          issues,
          "Security",
          "High",
          "subprocess with shell=True can create command injection risks.",
          filePath,
          lineNumber
        );
      }

      if (/pickle\.loads?\s*\(/.test(line)) {
        addIssue(
          issues,
          "Security",
          "High",
          "Unsafe pickle deserialization can execute malicious code.",
          filePath,
          lineNumber
        );
      }

      if (
        /\byaml\.load\s*\(/.test(line) &&
        !/SafeLoader/.test(line)
      ) {
        addIssue(
          issues,
          "Security",
          "High",
          "yaml.load() without SafeLoader can be unsafe for untrusted input.",
          filePath,
          lineNumber
        );
      }
    }

    // -----------------------------
    // JAVA SECURITY
    // -----------------------------

    if (filePath.endsWith(".java")) {
      if (/Runtime\.getRuntime\(\)\.exec\s*\(/.test(line)) {
        addIssue(
          issues,
          "Security",
          "High",
          "Java Runtime.exec() can execute operating-system commands.",
          filePath,
          lineNumber
        );
      }
    }

    // -----------------------------
    // CODE QUALITY: console.log
    // -----------------------------

    if (/\bconsole\.log\s*\(/.test(line)) {
      addIssue(
        issues,
        "Code Quality",
        "Low",
        "Debug console.log detected.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // MAINTAINABILITY: any
    // -----------------------------

    if (
      /\bany\b/.test(line) &&
      /\.(ts|tsx)$/.test(filePath)
    ) {
      addIssue(
        issues,
        "Maintainability",
        "Low",
        "Explicit 'any' type detected.",
        filePath,
        lineNumber
      );
    }

    // -----------------------------
    // CODE QUALITY: TODO/FIXME
    // -----------------------------

    if (/TODO|FIXME/.test(line)) {
      addIssue(
        issues,
        "Code Quality",
        "Low",
        "TODO/FIXME comment detected.",
        filePath,
        lineNumber
      );
    }
  });

  // -----------------------------
  // COMPLEXITY
  // -----------------------------

  const complexity =
    1 +
    (code.match(/\bif\s*\(/g) || []).length +
    (code.match(/\bfor\s*\(/g) || []).length +
    (code.match(/\bwhile\s*\(/g) || []).length +
    (code.match(/\bswitch\s*\(/g) || []).length +
    (code.match(/\bcatch\s*\(/g) || []).length +
    (code.match(/\bcase\s+/g) || []).length;

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
        {
          error: "GitHub token is not configured",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const repo = searchParams.get("repo");

    if (!repo) {
      return NextResponse.json(
        {
          error: "Repository is required",
        },
        { status: 400 }
      );
    }

    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      return NextResponse.json(
        {
          error:
            "Invalid repository format. Use owner/repository",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    // ============================================
    // 1. GET REPOSITORY
    // ============================================

    const repository = await octokit.request(
      "GET /repos/{owner}/{repo}",
      {
        owner,
        repo: name,
      }
    );

    const branch = repository.data.default_branch;

    // ============================================
    // 2. GET BRANCH SHA
    // ============================================

    const branchResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      {
        owner,
        repo: name,
        branch,
      }
    );

    const sha = branchResponse.data.commit.sha;

    // ============================================
    // 3. GET COMPLETE REPOSITORY TREE
    // ============================================

    const treeResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      {
        owner,
        repo: name,
        tree_sha: sha,
        recursive: "true",
      }
    );

    // ============================================
    // 4. FIND SOURCE FILES
    // ============================================

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
    const excludedPaths = [
    "app/api/github/analyze/route.ts",
    ".github/",
    "node_modules/",
    ".next/",
    "dist/",
    "build/",
    ];

    const sourceFiles = treeResponse.data.tree
    .filter(
    (item) =>
      item.type === "blob" &&
      item.path &&
      sourceExtensions.some((ext) =>
        item.path!.toLowerCase().endsWith(ext)
      ) &&
      !excludedPaths.some((excluded) =>
        item.path!.startsWith(excluded)
      )
    )
    .slice(0, 10);

    // ============================================
    // 5. DEPENDENCY ANALYSIS
    // ============================================

    let dependencyCount = 0;
    let dependencies: string[] = [];

    try {
      const packageResponse = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo: name,
          path: "package.json",
          ref: branch,
        }
      );

      if (
        !Array.isArray(packageResponse.data) &&
        packageResponse.data.type === "file"
      ) {
        const packageContent = Buffer.from(
          packageResponse.data.content || "",
          "base64"
        ).toString("utf-8");

        const packageJson = JSON.parse(packageContent);

        const productionDependencies = Object.keys(
          packageJson.dependencies || {}
        );

        const developmentDependencies = Object.keys(
          packageJson.devDependencies || {}
        );

        dependencies = [
          ...productionDependencies,
          ...developmentDependencies,
        ];

        dependencyCount = dependencies.length;
      }
    } catch (dependencyError) {
      console.error(
        "Dependency analysis failed:",
        dependencyError
      );
    }

    // ============================================
    // 6. ANALYZE SOURCE FILES
    // ============================================

    const analyzedFiles: Array<{
      path: string;
      size: number | undefined;
      lines: number;
      functions: number;
      imports: number;
      complexity: number;
      issues: AnalysisIssue[];
      eslintIssues: ESLintIssue[];
    }> = [];

    let totalLines = 0;
    let totalFunctions = 0;
    let totalImports = 0;
    let totalComplexity = 0;

    const sourceContents: Array<{ path: string; content: string }> = [];

    const fileResults = await Promise.all(
  sourceFiles.map(async (file) => {
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
        Array.isArray(response.data) ||
        response.data.type !== "file"
      ) {
        return null;
      }

      const content = Buffer.from(
        response.data.content || "",
        "base64"
      ).toString("utf-8");

      const analysis = analyzeCode(
        content,
        file.path!
      );

      return {
        path: file.path!,
        size: file.size,
        content,
        analysis,
      };
    } catch (fileError) {
      console.error(
        `Failed to analyze ${file.path}`,
        fileError
      );

      return null;
    }
  })
);

for (const result of fileResults) {
  if (!result) continue;

  totalLines += result.analysis.lines;
  totalFunctions += result.analysis.functions;
  totalImports += result.analysis.imports;
  totalComplexity += result.analysis.complexity;

  sourceContents.push({
    path: result.path,
    content: result.content,
  });

  analyzedFiles.push({
    path: result.path,
    size: result.size,
    ...result.analysis,
    eslintIssues: [],
  });
}
    // ============================================
    // 7. ESLINT ANALYSIS
    // ============================================

    const eslintIssues = await runESLint(sourceContents);

    for (const issue of eslintIssues) {
      const targetFile = analyzedFiles.find(
        (file) => file.path === issue.file
      );

      if (targetFile) {
        targetFile.eslintIssues.push(issue);

        targetFile.issues.push({
          type: "ESLint",
          severity: issue.severity,
          message: `${issue.message}${issue.ruleId ? ` [${issue.ruleId}]` : ""}`,
          file: issue.file,
          line: issue.line,
        });
      }
    }

    // ============================================
    // 8. COLLECT ISSUES
    // ============================================

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

    // ============================================
    // 8. SECURITY METRICS
    // ============================================

    const securityIssues = allIssues.filter(
      (issue) => issue.type === "Security"
    );

    const securityHighIssues = securityIssues.filter(
      (issue) => issue.severity === "High"
    ).length;

    const securityMediumIssues = securityIssues.filter(
      (issue) => issue.severity === "Medium"
    ).length;

    const securityLowIssues = securityIssues.filter(
      (issue) => issue.severity === "Low"
    ).length;

    // ============================================
    // 9. RESPONSE
    // ============================================

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

        dependencies: dependencyCount,

        issues: allIssues.length,

        highIssues,
        mediumIssues,
        lowIssues,

        securityIssues: securityIssues.length,
        securityHighIssues,
        securityMediumIssues,
        securityLowIssues,

        eslintIssues: eslintIssues.length,
      },

      dependencyList: dependencies,

      files: analyzedFiles,

      issues: allIssues,
    });
  } catch (error) {
    console.error(
      "Analysis API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze repository",
      },
      { status: 500 }
    );
  }
}