import { NextResponse } from "next/server";
import { Octokit } from "octokit";

type SecurityIssue = {
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  message: string;
  file: string;
  line: number;
  recommendation: string;
};

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".c",
  ".cpp",
];

function getLineNumber(content: string, index: number) {
  return content.slice(0, index).split("\n").length;
}

function addIssue(
  issues: SecurityIssue[],
  content: string,
  file: string,
  index: number,
  issue: Omit<SecurityIssue, "file" | "line">
) {
  issues.push({
    ...issue,
    file,
    line: getLineNumber(content, index),
  });
}

function scanFile(
  file: string,
  content: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  const rules = [
    {
      regex: /\beval\s*\(/g,
      type: "Code Injection",
      severity: "Critical" as const,
      message: "eval() can execute dynamically generated code.",
      recommendation:
        "Avoid eval(). Replace it with explicit logic or a safe parser.",
    },
    {
      regex: /\bnew\s+Function\s*\(/g,
      type: "Code Injection",
      severity: "Critical" as const,
      message: "new Function() dynamically creates executable code.",
      recommendation:
        "Avoid dynamic code generation and use explicit functions.",
    },
    {
      regex: /\.innerHTML\s*=/g,
      type: "XSS",
      severity: "High" as const,
      message:
        "Direct innerHTML assignment can introduce XSS.",
      recommendation:
        "Prefer textContent or sanitize untrusted HTML.",
    },
    {
      regex: /dangerouslySetInnerHTML\s*=/g,
      type: "XSS",
      severity: "High" as const,
      message:
        "dangerouslySetInnerHTML can create XSS vulnerabilities.",
      recommendation:
        "Avoid untrusted HTML or sanitize it before rendering.",
    },
    {
      regex:
        /(?:require\s*\(\s*["']child_process["']\s*\)|from\s+["']child_process["'])/g,
      type: "Command Injection Risk",
      severity: "High" as const,
      message:
        "child_process APIs can execute operating-system commands.",
      recommendation:
        "Validate arguments and avoid passing untrusted input to shell commands.",
    },
    {
      regex: /\b(?:exec|execSync|spawn|spawnSync)\s*\(/g,
      type: "Command Execution",
      severity: "High" as const,
      message:
        "Operating-system command execution was detected.",
      recommendation:
        "Avoid shell execution with untrusted input.",
    },
    {
      regex:
        /(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]{0,150}(?:\+|\$\{)/gi,
      type: "SQL Injection",
      severity: "Critical" as const,
      message:
        "SQL query appears to use string concatenation or interpolation.",
      recommendation:
        "Use parameterized queries or prepared statements.",
    },
    {
      regex:
        /(?:api[_-]?key|secret|password|token|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/gi,
      type: "Hardcoded Secret",
      severity: "Critical" as const,
      message:
        "A possible hardcoded credential or secret was detected.",
      recommendation:
        "Move secrets to environment variables or a secret manager.",
    },
  ];

  for (const rule of rules) {
    let match: RegExpExecArray | null;

    while ((match = rule.regex.exec(content)) !== null) {
      addIssue(
        issues,
        content,
        file,
        match.index,
        {
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
          recommendation: rule.recommendation,
        }
      );
    }
  }

  // HTTP
  const httpRegex =
    /http:\/\/[^\s"'`]+/gi;

  let httpMatch: RegExpExecArray | null;

  while ((httpMatch = httpRegex.exec(content)) !== null) {
    if (
      !/localhost|127\.0\.0\.1/.test(
        httpMatch[0]
      )
    ) {
      addIssue(
        issues,
        content,
        file,
        httpMatch.index,
        {
          type: "Insecure Transport",
          severity: "Medium",
          message:
            "An HTTP URL was detected instead of HTTPS.",
          recommendation:
            "Use HTTPS for network communication.",
        }
      );
    }
  }

  // Python
  if (file.endsWith(".py")) {
    const pythonRules = [
      {
        regex: /\bos\.system\s*\(/g,
        type: "Command Injection",
        severity: "High" as const,
        message:
          "Python os.system() executes operating-system commands.",
        recommendation:
          "Avoid os.system() and validate command arguments.",
      },
      {
        regex:
          /subprocess\.[A-Za-z]+\s*\([\s\S]{0,250}shell\s*=\s*True/gi,
        type: "Command Injection",
        severity: "High" as const,
        message:
          "subprocess is being used with shell=True.",
        recommendation:
          "Avoid shell=True and use argument arrays.",
      },
      {
        regex: /\bpickle\.(?:load|loads)\s*\(/g,
        type: "Unsafe Deserialization",
        severity: "Critical" as const,
        message:
          "pickle can execute arbitrary code with untrusted data.",
        recommendation:
          "Do not deserialize untrusted pickle data.",
      },
      {
        regex: /\byaml\.load\s*\(/g,
        type: "Unsafe YAML",
        severity: "High" as const,
        message:
          "yaml.load() may be unsafe for untrusted input.",
        recommendation:
          "Use yaml.safe_load() for untrusted YAML.",
      },
    ];

    for (const rule of pythonRules) {
      let match: RegExpExecArray | null;

      while (
        (match = rule.regex.exec(content)) !== null
      ) {
        addIssue(
          issues,
          content,
          file,
          match.index,
          {
            type: rule.type,
            severity: rule.severity,
            message: rule.message,
            recommendation: rule.recommendation,
          }
        );
      }
    }
  }

  // Java
  if (file.endsWith(".java")) {
    const regex =
      /Runtime\.getRuntime\s*\(\s*\)\.exec\s*\(/g;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      addIssue(
        issues,
        content,
        file,
        match.index,
        {
          type: "Command Injection",
          severity: "High",
          message:
            "Java Runtime.exec() executes operating-system commands.",
          recommendation:
            "Validate all command arguments and avoid untrusted input.",
        }
      );
    }
  }

  return issues;
}

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "GITHUB_TOKEN is not configured",
        },
        { status: 500 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const repo = searchParams.get("repo");

    if (!repo) {
      return NextResponse.json(
        {
          success: false,
          error: "repo parameter is required",
        },
        { status: 400 }
      );
    }

    const [owner, name] =
      repo.split("/");

    if (!owner || !name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Repository must use owner/repository format",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token,
    });

    const repository =
      await octokit.request(
        "GET /repos/{owner}/{repo}",
        {
          owner,
          repo: name,
        }
      );

    const branch =
      repository.data.default_branch;

    const branchResponse =
      await octokit.request(
        "GET /repos/{owner}/{repo}/branches/{branch}",
        {
          owner,
          repo: name,
          branch,
        }
      );

    const sha =
      branchResponse.data.commit.sha;

    const treeResponse =
      await octokit.request(
        "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
        {
          owner,
          repo: name,
          tree_sha: sha,
          recursive: "true",
        }
      );

    const sourceFiles =
      treeResponse.data.tree
        .filter(
          (item) =>
            item.type === "blob" &&
            typeof item.path === "string" &&
            SOURCE_EXTENSIONS.some(
              (ext) =>
                item.path!.toLowerCase().endsWith(ext)
            )
        )
        .filter(
          (item) =>
            !item.path!.startsWith("node_modules/") &&
            !item.path!.startsWith(".next/") &&
            !item.path!.startsWith("dist/") &&
            !item.path!.startsWith("build/") &&
            !item.path!.startsWith(".git/")
        )
        // IMPORTANT: don't scan 30 files
        .slice(0, 10);

    /*
     * Fetch files IN PARALLEL
     */
    const fileResults =
      await Promise.all(
        sourceFiles.map(async (item) => {
          try {
            const response =
              await octokit.request(
                "GET /repos/{owner}/{repo}/contents/{path}",
                {
                  owner,
                  repo: name,
                  path: item.path!,
                  ref: branch,
                }
              );

            if (
              Array.isArray(response.data) ||
              !("content" in response.data)
            ) {
              return null;
            }

            const content =
              Buffer.from(
                response.data.content || "",
                "base64"
              ).toString("utf-8");

            const issues =
              scanFile(
                item.path!,
                content
              );

            return {
              path: item.path!,
              lines:
                content.split("\n").length,
              issues,
            };
          } catch (error) {
            console.error(
              `Failed to scan ${item.path}`,
              error
            );

            return null;
          }
        })
      );

    const files =
      fileResults.filter(
        Boolean
      ) as Array<{
        path: string;
        lines: number;
        issues: SecurityIssue[];
      }>;

    const allIssues =
      files.flatMap(
        (file) => file.issues
      );

    const critical =
      allIssues.filter(
        (i) => i.severity === "Critical"
      ).length;

    const high =
      allIssues.filter(
        (i) => i.severity === "High"
      ).length;

    const medium =
      allIssues.filter(
        (i) => i.severity === "Medium"
      ).length;

    const low =
      allIssues.filter(
        (i) => i.severity === "Low"
      ).length;

    const penalty =
      critical * 20 +
      high * 10 +
      medium * 5 +
      low * 2;

    const securityScore =
      Math.max(
        0,
        100 - penalty
      );

    return NextResponse.json({
      success: true,

      repository: {
        name:
          repository.data.full_name,
        branch,
        url:
          repository.data.html_url,
      },

      summary: {
        filesAnalyzed:
          files.length,
        totalIssues:
          allIssues.length,
        critical,
        high,
        medium,
        low,
        securityScore,
      },

      issues: allIssues,

      files,
    });
  } catch (error) {
    console.error(
      "Security analysis error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Security analysis failed",
      },
      { status: 500 }
    );
  }
}