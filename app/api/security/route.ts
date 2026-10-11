import { NextResponse } from "next/server";
import { Octokit } from "octokit";

type Severity = "Critical" | "High" | "Medium" | "Low";

type SecurityIssue = {
  type: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  recommendation: string;
};

type ScanRule = {
  regex: RegExp;
  type: string;
  severity: Severity;
  message: string;
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

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function addIssue(
  issues: SecurityIssue[],
  content: string,
  file: string,
  index: number,
  issue: Omit<SecurityIssue, "file" | "line">
): void {
  issues.push({
    ...issue,
    file,
    line: getLineNumber(content, index),
  });
}

function scanFile(file: string, content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  const rules: ScanRule[] = [
    {
      regex: /\beval\s*\(/g,
      type: "Code Injection",
      severity: "Critical",
      message: "eval() can execute dynamically generated code.",
      recommendation:
        "Avoid eval(). Replace it with explicit logic or a safe parser.",
    },
    {
      regex: /\bnew\s+Function\s*\(/g,
      type: "Code Injection",
      severity: "Critical",
      message: "new Function() dynamically creates executable code.",
      recommendation:
        "Avoid dynamic code generation and use explicit functions.",
    },
    {
      regex: /\.innerHTML\s*=/g,
      type: "XSS",
      severity: "High",
      message: "Direct innerHTML assignment can introduce XSS.",
      recommendation: "Prefer textContent or sanitize untrusted HTML.",
    },
    {
      regex: /dangerouslySetInnerHTML\s*=/g,
      type: "XSS",
      severity: "High",
      message: "dangerouslySetInnerHTML can create XSS vulnerabilities.",
      recommendation:
        "Avoid untrusted HTML or sanitize it before rendering.",
    },
    {
      regex:
        /(?:require\s*\(\s*["']child_process["']\s*\)|from\s+["']child_process["'])/g,
      type: "Command Injection Risk",
      severity: "High",
      message: "child_process APIs can execute operating-system commands.",
      recommendation:
        "Validate arguments and avoid passing untrusted input to shell commands.",
    },
    {
      regex: /\b(?:exec|execSync|spawn|spawnSync)\s*\(/g,
      type: "Command Execution",
      severity: "High",
      message: "Operating-system command execution was detected.",
      recommendation: "Avoid shell execution with untrusted input.",
    },
    {
      regex:
        /(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]{0,150}(?:\s*\+\s*|\$\{)/gi,
      type: "SQL Injection",
      severity: "Critical",
      message:
        "SQL query may use string concatenation or interpolation.",
      recommendation: "Use parameterized queries or prepared statements.",
    },
    {
      regex:
        /(?:api[_-]?key|secret|password|token|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/gi,
      type: "Hardcoded Secret",
      severity: "Critical",
      message: "A possible hardcoded credential or secret was detected.",
      recommendation:
        "Move secrets to environment variables or a secret manager.",
    },
  ];

  for (const rule of rules) {
    // Create a fresh regex instance for each scan so lastIndex cannot leak.
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.regex.exec(content)) !== null) {
      addIssue(issues, content, file, match.index, {
        type: rule.type,
        severity: rule.severity,
        message: rule.message,
        recommendation: rule.recommendation,
      });

      // Defensive guard against accidental zero-length regex matches.
      if (match[0].length === 0) rule.regex.lastIndex++;
    }
  }

  // Flag plain HTTP URLs, excluding localhost and loopback addresses.
  const httpRegex = /http:\/\/[^\s"'`<>]+/gi;
  let httpMatch: RegExpExecArray | null;

  while ((httpMatch = httpRegex.exec(content)) !== null) {
    if (!/localhost|127\.0\.0\.1/i.test(httpMatch[0])) {
      addIssue(issues, content, file, httpMatch.index, {
        type: "Insecure Transport",
        severity: "Medium",
        message: "An HTTP URL was detected instead of HTTPS.",
        recommendation: "Use HTTPS for network communication.",
      });
    }
  }

  // Python-specific checks.
  if (file.toLowerCase().endsWith(".py")) {
    const pythonRules: ScanRule[] = [
      {
        regex: /\bos\s*\.\s*system\s*\(/g,
        type: "Command Injection",
        severity: "High",
        message: "Python os.system() executes operating-system commands.",
        recommendation: "Avoid os.system() and validate command arguments.",
      },
      {
        regex:
          /\bsubprocess\s*\.\s*[A-Za-z_]\w*\s*\([\s\S]{0,250}?\bshell\s*=\s*True\b/gi,
        type: "Command Injection",
        severity: "High",
        message: "subprocess is being used with shell=True.",
        recommendation: "Avoid shell=True and use argument arrays.",
      },
      {
        regex: /\bpickle\s*\.\s*(?:load|loads)\s*\(/g,
        type: "Unsafe Deserialization",
        severity: "Critical",
        message: "pickle can execute arbitrary code with untrusted data.",
        recommendation: "Do not deserialize untrusted pickle data.",
      },
      {
        regex: /\byaml\s*\.\s*load\s*\(/g,
        type: "Unsafe YAML",
        severity: "High",
        message: "yaml.load() may be unsafe for untrusted input.",
        recommendation: "Use yaml.safe_load() for untrusted YAML.",
      },
    ];

    for (const rule of pythonRules) {
      rule.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.regex.exec(content)) !== null) {
        addIssue(issues, content, file, match.index, {
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
          recommendation: rule.recommendation,
        });
        if (match[0].length === 0) rule.regex.lastIndex++;
      }
    }
  }

  // Java-specific command execution check.
  if (file.toLowerCase().endsWith(".java")) {
    const javaRegex = /\bRuntime\s*\.\s*getRuntime\s*\(\s*\)\s*\.\s*exec\s*\(/g;
    let match: RegExpExecArray | null;

    while ((match = javaRegex.exec(content)) !== null) {
      addIssue(issues, content, file, match.index, {
        type: "Command Injection",
        severity: "High",
        message: "Java Runtime.exec() executes operating-system commands.",
        recommendation:
          "Validate all command arguments and avoid untrusted input.",
      });
    }
  }

  return issues;
}

function deduplicateIssues(issues: SecurityIssue[]): SecurityIssue[] {
  const unique = new Map<string, SecurityIssue>();

  for (const issue of issues) {
    const key = `${issue.file}:${issue.line}:${issue.type}`;
    if (!unique.has(key)) unique.set(key, issue);
  }

  return Array.from(unique.values());
}

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "GITHUB_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "repo parameter is required" },
        { status: 400 }
      );
    }

    const [owner, name, ...extra] = repo.split("/");
    if (!owner || !name || extra.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository must use owner/repository format",
        },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    const repository = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo: name,
    });

    const branch = repository.data.default_branch;
    const branchResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      { owner, repo: name, branch }
    );

    const sha = branchResponse.data.commit.sha;
    const treeResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      { owner, repo: name, tree_sha: sha, recursive: "true" }
    );

    if (treeResponse.data.truncated) {
      console.warn(`Repository tree was truncated for ${owner}/${name}`);
    }

    const sourceFiles = treeResponse.data.tree
      .filter(
        (item) =>
          item.type === "blob" &&
          typeof item.path === "string" &&
          SOURCE_EXTENSIONS.some((ext) => item.path!.toLowerCase().endsWith(ext))
      )
      .filter(
        (item) =>
          !item.path!.startsWith("node_modules/") &&
          !item.path!.startsWith(".next/") &&
          !item.path!.startsWith("dist/") &&
          !item.path!.startsWith("build/") &&
          !item.path!.startsWith(".git/")
      )
      .slice(0, 10);

    const fileResults = await Promise.all(
      sourceFiles.map(async (item) => {
        try {
          const response = await octokit.request(
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
            !("content" in response.data) ||
            response.data.encoding !== "base64"
          ) {
            return null;
          }

          const content = Buffer.from(
            response.data.content || "",
            "base64"
          ).toString("utf-8");

          return {
            path: item.path!,
            lines: content.split("\n").length,
            issues: scanFile(item.path!, content),
          };
        } catch (error) {
          console.error(`Failed to scan ${item.path}`, error);
          return null;
        }
      })
    );

    const files = fileResults.filter(
      (file): file is NonNullable<typeof file> => file !== null
    );

    // Deduplicate identical findings per file, line and issue type.
    for (const file of files) {
      file.issues = deduplicateIssues(file.issues);
    }

    const allIssues = files.flatMap((file) => file.issues);
    const critical = allIssues.filter((i) => i.severity === "Critical").length;
    const high = allIssues.filter((i) => i.severity === "High").length;
    const medium = allIssues.filter((i) => i.severity === "Medium").length;
    const low = allIssues.filter((i) => i.severity === "Low").length;

    const penalty = critical * 20 + high * 10 + medium * 5 + low * 2;
    const securityScore = Math.max(0, 100 - penalty);

    return NextResponse.json({
      success: true,
      repository: {
        name: repository.data.full_name,
        branch,
        url: repository.data.html_url,
      },
      summary: {
        filesAnalyzed: files.length,
        totalIssues: allIssues.length,
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
    console.error("Security analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Security analysis failed" },
      { status: 500 }
    );
  }
}
