import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { ESLint } from "eslint";
import { prisma } from "@/lib/prisma";

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

type SourceFile = {
  path: string;
  content: string;
  size?: number;
};

function addIssue(
  issues: AnalysisIssue[],
  type: string,
  severity: Severity,
  message: string,
  file: string,
  line: number
) {
  issues.push({ type, severity, message, file, line });
}

function calculateScore(
  issues: AnalysisIssue[],
  categories: string[],
  weights: Record<Severity, number> = {
    High: 15,
    Medium: 8,
    Low: 3,
  }
): number {
  const penalty = issues
    .filter((issue) => categories.includes(issue.type))
    .reduce((sum, issue) => sum + weights[issue.severity], 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

function calculatePerformanceScore(
  complexity: number,
  functions: number
): number {
  // Static complexity estimate, not a runtime benchmark.
  const averageComplexity = complexity / Math.max(functions, 1);
  const penalty = Math.max(0, averageComplexity - 5) * 5;

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

function analyzeCode(code: string, filePath: string) {
  const lines = code.split("\n");
  const issues: AnalysisIssue[] = [];

  let functionCount = 0;
  let importCount = 0;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Import detection
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
      /=>\s*\{/.test(line)
    ) {
      functionCount++;
    }

    // Security checks

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

    if (/(SELECT|INSERT|UPDATE|DELETE)\b.*(\+|\$\{)/i.test(line)) {
      addIssue(
        issues,
        "Security",
        "High",
        "Possible SQL query construction using string concatenation or interpolation.",
        filePath,
        lineNumber
      );
    }

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

    // Python security checks
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

      if (/\bpickle\.loads?\s*\(/.test(line)) {
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

    // Java security check
    if (
      filePath.endsWith(".java") &&
      /Runtime\.getRuntime\(\)\.exec\s*\(/.test(line)
    ) {
      addIssue(
        issues,
        "Security",
        "High",
        "Java Runtime.exec() can execute operating-system commands.",
        filePath,
        lineNumber
      );
    }

    // Code quality checks
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

    if (/\bany\b/.test(line) && /\.(ts|tsx)$/.test(filePath)) {
      addIssue(
        issues,
        "Maintainability",
        "Low",
        "Explicit 'any' type detected.",
        filePath,
        lineNumber
      );
    }

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

async function runESLint(
  files: Array<{ path: string; content: string }>
): Promise<ESLintIssue[]> {
  const lintable = files.filter(({ path }) =>
    /\.(ts|tsx|js|jsx)$/.test(path)
  );

  if (lintable.length === 0) return [];

  try {
    const eslint = new ESLint({ cwd: process.cwd() });

    const results = await Promise.all(
      lintable.map(async (file) => {
        try {
          return {
            file,
            results: await eslint.lintText(file.content, {
              filePath: file.path,
            }),
          };
        } catch (error) {
          console.error(
            `ESLint failed for ${file.path}:`,
            error
          );

          return { file, results: [] };
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

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
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
          success: false,
          error: "Repository is required",
        },
        { status: 400 }
      );
    }

    const [owner, name] = repo.split("/");

    if (!owner || !name || repo.split("/").length !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository format. Use owner/repository",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    const repository = await octokit.request(
      "GET /repos/{owner}/{repo}",
      {
        owner,
        repo: name,
      }
    );

    const branch = repository.data.default_branch;

    const branchResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      {
        owner,
        repo: name,
        branch,
      }
    );

    const sha = branchResponse.data.commit.sha;

    const treeResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      {
        owner,
        repo: name,
        tree_sha: sha,
        recursive: "true",
      }
    );

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
          Boolean(item.path) &&
          sourceExtensions.some((ext) =>
            item.path!.toLowerCase().endsWith(ext)
          ) &&
          !excludedPaths.some((excluded) =>
            item.path!.startsWith(excluded)
          )
      )
      .slice(0, 10);

    let dependencyCount = 0;
    let dependencies: string[] = [];

    // Read package.json dependencies
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

        dependencies = [
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.devDependencies || {}),
        ];

        dependencyCount = dependencies.length;
      }
    } catch (error) {
      console.error("Dependency analysis failed:", error);
    }

    // Analyze source files
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

          return {
            path: file.path!,
            size: file.size,
            content,
            analysis: analyzeCode(content, file.path!),
          };
        } catch (error) {
          console.error(
            `Failed to analyze ${file.path}:`,
            error
          );

          return null;
        }
      })
    );

    const analyzedFiles = fileResults.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    const totalLines = analyzedFiles.reduce(
      (sum, file) => sum + file.analysis.lines,
      0
    );

    const totalFunctions = analyzedFiles.reduce(
      (sum, file) => sum + file.analysis.functions,
      0
    );

    const totalImports = analyzedFiles.reduce(
      (sum, file) => sum + file.analysis.imports,
      0
    );

    const totalComplexity = analyzedFiles.reduce(
      (sum, file) => sum + file.analysis.complexity,
      0
    );

    const sourceContents = analyzedFiles.map(
      ({ path, content }) => ({ path, content })
    );

    // Run ESLint
    const eslintIssues = await runESLint(sourceContents);

    for (const issue of eslintIssues) {
      const targetFile = analyzedFiles.find(
        (file) => file.path === issue.file
      );

      if (targetFile) {
        targetFile.analysis.issues.push({
          type: "ESLint",
          severity: issue.severity,
          message: `${issue.message}${
            issue.ruleId ? ` [${issue.ruleId}]` : ""
          }`,
          file: issue.file,
          line: issue.line,
        });
      }
    }

    // Collect all findings
    const allIssues = analyzedFiles.flatMap(
      (file) => file.analysis.issues
    );

    // Identify test files
    const isTestFile = (filePath: string): boolean => {
      const normalizedPath = filePath
        .toLowerCase()
        .replace(/\\/g, "/");

      return (
        normalizedPath.includes("/__tests__/") ||
        normalizedPath.includes("/tests/") ||
        normalizedPath.includes("/test/") ||
        normalizedPath.includes(".test.") ||
        normalizedPath.includes(".spec.") ||
        normalizedPath.startsWith("__tests__/") ||
        normalizedPath.startsWith("tests/") ||
        normalizedPath.startsWith("test/")
      );
    };

    // Separate production and test findings
    const productionIssues = allIssues.filter(
      (issue) => !isTestFile(issue.file)
    );

    const testIssues = allIssues.filter(
      (issue) => isTestFile(issue.file)
    );

    const countSeverity = (
      issues: AnalysisIssue[],
      severity: Severity
    ) =>
      issues.filter(
        (issue) => issue.severity === severity
      ).length;

    // Production severity counts
    const highIssues = countSeverity(
      productionIssues,
      "High"
    );

    const mediumIssues = countSeverity(
      productionIssues,
      "Medium"
    );

    const lowIssues = countSeverity(
      productionIssues,
      "Low"
    );

    // Test severity counts
    const testHighIssues = countSeverity(
      testIssues,
      "High"
    );

    const testMediumIssues = countSeverity(
      testIssues,
      "Medium"
    );

    const testLowIssues = countSeverity(
      testIssues,
      "Low"
    );

    // Security findings
    const securityIssues = productionIssues.filter(
      (issue) => issue.type === "Security"
    );

    const testSecurityIssues = testIssues.filter(
      (issue) => issue.type === "Security"
    );

    const securityHighIssues = countSeverity(
      securityIssues,
      "High"
    );

    const securityMediumIssues = countSeverity(
      securityIssues,
      "Medium"
    );

    const securityLowIssues = countSeverity(
      securityIssues,
      "Low"
    );

    const testSecurityHighIssues = countSeverity(
      testSecurityIssues,
      "High"
    );

    const testSecurityMediumIssues = countSeverity(
      testSecurityIssues,
      "Medium"
    );

    const testSecurityLowIssues = countSeverity(
      testSecurityIssues,
      "Low"
    );

    // Scoring engine: production findings only
    const codeQualityScore = calculateScore(
      productionIssues,
      ["Code Quality", "ESLint"]
    );

    const securityScore = calculateScore(
      securityIssues,
      ["Security"],
      {
        High: 20,
        Medium: 10,
        Low: 4,
      }
    );

    const maintainabilityScore = calculateScore(
      productionIssues,
      ["Maintainability"]
    );

    const performanceScore = calculatePerformanceScore(
      totalComplexity,
      totalFunctions
    );

    const developerScore = Math.round(
      codeQualityScore * 0.25 +
        securityScore * 0.35 +
        performanceScore * 0.2 +
        maintainabilityScore * 0.2
    );

    // Save repository
    const savedRepository = await prisma.repository.upsert({
      where: {
        githubId: String(repository.data.id),
      },
      update: {
        name: repository.data.name,
        fullName: repository.data.full_name,
        description: repository.data.description,
        language: repository.data.language,
        stars: repository.data.stargazers_count,
        forks: repository.data.forks_count,
        url: repository.data.html_url,
        isPrivate: repository.data.private,
      },
      create: {
        githubId: String(repository.data.id),
        name: repository.data.name,
        fullName: repository.data.full_name,
        description: repository.data.description,
        language: repository.data.language,
        stars: repository.data.stargazers_count,
        forks: repository.data.forks_count,
        url: repository.data.html_url,
        isPrivate: repository.data.private,
      },
    });

    // Save analysis and findings
    const savedAnalysis = await prisma.analysis.create({
      data: {
        repositoryId: savedRepository.id,

        codeQuality: codeQualityScore,
        security: securityScore,
        performance: performanceScore,
        maintainability: maintainabilityScore,
        codeHealth: developerScore,

        filesAnalyzed: analyzedFiles.length,
        sourceFiles: sourceFiles.length,
        functions: totalFunctions,
        lines: totalLines,
        issueCount: allIssues.length,

        summary: JSON.stringify({
          branch,
          totalLines,
          totalFunctions,
          totalImports,
          totalComplexity,
          dependencyCount,

          highIssues,
          mediumIssues,
          lowIssues,

          productionFindings: productionIssues.length,
          testFindings: testIssues.length,

          productionSecurityFindings:
            securityIssues.length,

          testSecurityFindings:
            testSecurityIssues.length,

          testHighIssues,
          testMediumIssues,
          testLowIssues,

          testSecurityHighIssues,
          testSecurityMediumIssues,
          testSecurityLowIssues,

          securityIssues: securityIssues.length,
          securityHighIssues,
          securityMediumIssues,
          securityLowIssues,

          eslintIssues: eslintIssues.length,

          scores: {
            codeQuality: codeQualityScore,
            security: securityScore,
            performance: performanceScore,
            maintainability: maintainabilityScore,
            developer: developerScore,
          },

          scoringNote:
            "Scores are rule-based estimates. Performance is based on static complexity, not runtime measurements. Test findings are reported separately and excluded from production quality scores.",
        }),

        findings: {
          create: allIssues.map((issue) => ({
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            file: issue.file,
            line: issue.line,
          })),
        },
      },
    });

    console.log(
      `Analysis saved successfully: ${savedAnalysis.id}`
    );

    // Return API response
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

        productionFindings: productionIssues.length,
        testFindings: testIssues.length,

        productionSecurityFindings:
          securityIssues.length,

        testSecurityFindings:
          testSecurityIssues.length,

        testHighIssues,
        testMediumIssues,
        testLowIssues,

        testSecurityHighIssues,
        testSecurityMediumIssues,
        testSecurityLowIssues,

        securityIssues: securityIssues.length,
        securityHighIssues,
        securityMediumIssues,
        securityLowIssues,

        eslintIssues: eslintIssues.length,

        codeQualityScore,
        securityScore,
        performanceScore,
        maintainabilityScore,
        developerScore,
      },

      dependencyList: dependencies,

      files: analyzedFiles.map((file) => ({
        path: file.path,
        size: file.size,
        lines: file.analysis.lines,
        functions: file.analysis.functions,
        imports: file.analysis.imports,
        complexity: file.analysis.complexity,
        issues: file.analysis.issues,

        eslintIssues: eslintIssues.filter(
          (issue) => issue.file === file.path
        ),
      })),

      // Return every finding, including test-file findings.
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