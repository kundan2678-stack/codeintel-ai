"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Wrench,
  FileCode2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bug,
} from "lucide-react";

type Severity = "Critical" | "High" | "Medium" | "Low";

type Issue = {
  type: string;
  severity: Severity | "High" | "Medium" | "Low";
  message: string;
  file: string;
  line: number;
  recommendation?: string;
};

type AnalysisFile = {
  path: string;
  language?: string;
  lines?: number;
  functions?: number;
  issues?: Issue[];
  eslintIssues?: Issue[];
};

type CodeAnalysis = {
  success: boolean;
  error?: string;

  summary?: {
    codeQuality?: number;
    security?: number;
    performance?: number;
    maintainability?: number;
    codeHealth?: number;
    filesAnalyzed?: number;
    sourceFiles?: number;
    functions?: number;
    lines?: number;
    eslintIssues?: number;
  };

  issues?: Issue[];
  recommendations?: string[];
  files?: AnalysisFile[];
};

type SecurityAnalysis = {
  success: boolean;
  error?: string;

  summary?: {
    filesAnalyzed?: number;
    totalIssues?: number;
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    securityScore?: number;
  };

  issues?: Issue[];
};

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs Improvement";
  return "Poor";
}

function severityClass(severity: Severity) {
  if (severity === "Critical") {
    return "border-red-500/40 bg-red-500/10 text-red-400";
  }

  if (severity === "High") {
    return "border-orange-500/40 bg-orange-500/10 text-orange-400";
  }

  if (severity === "Medium") {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  }

  return "border-blue-500/40 bg-blue-500/10 text-blue-400";
}

function ScoreCard({
  title,
  score,
  icon: Icon,
}: {
  title: string;
  score: number;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2">
            <Icon className="h-5 w-5 text-cyan-400" />
          </div>

          <span className="text-sm text-zinc-400">
            {title}
          </span>
        </div>

        <span className="text-xs text-zinc-500">
          {scoreLabel(score)}
        </span>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-bold">
          {score}
        </span>

        <span className="mb-1 text-zinc-500">
          / 100
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, score)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [codeAnalysis, setCodeAnalysis] =
    useState<CodeAnalysis | null>(null);

  const [securityAnalysis, setSecurityAnalysis] =
    useState<SecurityAnalysis | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFile, setExpandedFile] =
    useState<string | null>(null);

  const repo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("repo") ||
        "kundan2678-stack/codeintel-ai"
      : "kundan2678-stack/codeintel-ai";

  async function loadAnalysis() {
    try {
      setLoading(true);
      setError("");

      const encodedRepo = encodeURIComponent(repo);

      const [codeResponse, securityResponse] =
        await Promise.all([
          fetch(
            `/api/github/analyze?repo=${encodedRepo}`
          ),
          fetch(
            `/api/security?repo=${encodedRepo}`
          ),
        ]);

      const codeResult: CodeAnalysis =
        await codeResponse.json();

      const securityResult: SecurityAnalysis =
        await securityResponse.json();

      if (
        !codeResponse.ok ||
        !codeResult.success
      ) {
        throw new Error(
          codeResult.error ||
            "Code analysis failed"
        );
      }

      if (
        !securityResponse.ok ||
        !securityResult.success
      ) {
        throw new Error(
          securityResult.error ||
            "Security analysis failed"
        );
      }

      setCodeAnalysis(codeResult);
      setSecurityAnalysis(securityResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, [repo]);

  const codeIssues = useMemo(() => {
    if (!codeAnalysis) return [];

    const issues = [
      ...(codeAnalysis.issues || []),
    ];

    for (const file of codeAnalysis.files || []) {
      for (const issue of file.eslintIssues || []) {
        const exists = issues.some(
          (item) =>
            item.file === issue.file &&
            item.line === issue.line &&
            item.message === issue.message
        );

        if (!exists) {
          issues.push(issue);
        }
      }
    }

    return issues;
  }, [codeAnalysis]);

  const securityIssues =
    securityAnalysis?.issues || [];

  const securitySummary =
    securityAnalysis?.summary || {};

  const combinedIssues = [
    ...securityIssues,
    ...codeIssues,
  ];

  const criticalCount =
    securitySummary.critical || 0;

  const highCount =
    securitySummary.high ||
    codeIssues.filter(
      (issue) => issue.severity === "High"
    ).length;

  const mediumCount =
    securitySummary.medium ||
    codeIssues.filter(
      (issue) => issue.severity === "Medium"
    ).length;

  const lowCount =
    securitySummary.low ||
    codeIssues.filter(
      (issue) => issue.severity === "Low"
    ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-400" />

            <h1 className="text-xl font-semibold">
              Analyzing repository...
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Running code quality and security analysis.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
        <Link
          href="/repositories"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to repositories
        </Link>

        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <AlertTriangle className="mb-4 h-10 w-10 text-red-400" />

          <h1 className="text-2xl font-bold">
            Analysis Failed
          </h1>

          <p className="mt-3 text-zinc-400">
            {error}
          </p>

          <button
            onClick={loadAnalysis}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const summary =
    codeAnalysis?.summary || {};

  const securityScore =
    securitySummary.securityScore ??
    summary.security ??
    0;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link
              href="/repositories"
              className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Repositories
            </Link>

            <h1 className="text-2xl font-bold">
              Repository Intelligence
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              {repo}
            </p>
          </div>

          <button
            onClick={loadAnalysis}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Re-analyze
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* SCORE CARDS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScoreCard
            title="Code Quality"
            score={summary.codeQuality ?? 0}
            icon={CheckCircle2}
          />

          <ScoreCard
            title="Security"
            score={securityScore}
            icon={ShieldCheck}
          />

          <ScoreCard
            title="Performance"
            score={summary.performance ?? 0}
            icon={Zap}
          />

          <ScoreCard
            title="Maintainability"
            score={summary.maintainability ?? 0}
            icon={Wrench}
          />
        </section>

        {/* REPOSITORY STATS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={FileCode2}
            label="Files Analyzed"
            value={summary.filesAnalyzed ?? 0}
          />

          <StatCard
            icon={FileCode2}
            label="Source Files"
            value={summary.sourceFiles ?? 0}
          />

          <StatCard
            icon={Bug}
            label="Functions"
            value={summary.functions ?? 0}
          />

          <StatCard
            icon={FileCode2}
            label="Lines"
            value={summary.lines ?? 0}
          />

          <StatCard
            icon={ShieldAlert}
            label="Security Issues"
            value={securitySummary.totalIssues ?? 0}
          />
        </section>

        {/* SECURITY OVERVIEW */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-cyan-400" />

                <h2 className="text-xl font-semibold">
                  Security Intelligence
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Security patterns detected across the repository.
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-zinc-500">
                Security Score
              </p>

              <p className="text-4xl font-bold text-cyan-400">
                {securityScore}
                <span className="text-lg text-zinc-600">
                  /100
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <SecurityCount
              label="Critical"
              value={criticalCount}
              className="text-red-400"
            />

            <SecurityCount
              label="High"
              value={highCount}
              className="text-orange-400"
            />

            <SecurityCount
              label="Medium"
              value={mediumCount}
              className="text-yellow-400"
            />

            <SecurityCount
              label="Low"
              value={lowCount}
              className="text-blue-400"
            />
          </div>
        </section>

        {/* SECURITY FINDINGS */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Security Findings
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Vulnerabilities and risky coding patterns detected by CodeIntel.
            </p>
          </div>

          {securityIssues.length === 0 ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-400" />

              <h3 className="font-semibold">
                No security issues detected
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                The current security rules did not identify a known risky pattern.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityIssues.map((issue, index) => (
                <SecurityFinding
                  key={`${issue.file}-${issue.line}-${index}`}
                  issue={issue}
                />
              ))}
            </div>
          )}
        </section>

        {/* ALL ISSUES */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-semibold">
              All Detected Issues
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Security scanner + static analyzer + ESLint
            </p>
          </div>

          {combinedIssues.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-400" />

              <p className="font-medium">
                No issues detected
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {combinedIssues.map((issue, index) => (
                <div
                  key={`${issue.file}-${issue.line}-${index}`}
                  className="p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${severityClass(
                            issue.severity as Severity
                          )}`}
                        >
                          {issue.severity}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                          {issue.type}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-zinc-200">
                        {issue.message}
                      </p>

                      <p className="mt-2 font-mono text-xs text-zinc-500">
                        {issue.file}:{issue.line}
                      </p>

                      {issue.recommendation && (
                        <p className="mt-3 text-xs text-zinc-500">
                          Recommendation:{" "}
                          {issue.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FILE ANALYSIS */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Analyzed Files
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Detailed file-level analysis.
            </p>
          </div>

          <div className="space-y-3">
            {(codeAnalysis?.files || []).map(
              (file) => {
                const isOpen =
                  expandedFile === file.path;

                const fileIssues = [
                  ...(file.issues || []),
                  ...(file.eslintIssues || []),
                ];

                return (
                  <div
                    key={file.path}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    <button
                      onClick={() =>
                        setExpandedFile(
                          isOpen
                            ? null
                            : file.path
                        )
                      }
                      className="flex w-full items-center justify-between p-5 text-left hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3">
                        <FileCode2 className="h-5 w-5 text-cyan-400" />

                        <div>
                          <p className="font-mono text-sm">
                            {file.path}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {file.lines ?? 0} lines ·{" "}
                            {file.functions ?? 0} functions ·{" "}
                            {fileIssues.length} issues
                          </p>
                        </div>
                      </div>

                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 p-5">
                        {fileIssues.length === 0 ? (
                          <p className="text-sm text-green-400">
                            ✓ No issues detected.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {fileIssues.map(
                              (issue, index) => (
                                <div
                                  key={`${issue.line}-${index}`}
                                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                                >
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className={`rounded-full border px-2 py-1 text-xs ${severityClass(
                                        issue.severity as Severity
                                      )}`}
                                    >
                                      {issue.severity}
                                    </span>

                                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-400">
                                      {issue.type}
                                    </span>

                                    <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-xs text-zinc-500">
                                      Line {issue.line}
                                    </span>
                                  </div>

                                  <p className="mt-3 text-sm text-zinc-300">
                                    {issue.message}
                                  </p>

                                  {issue.recommendation && (
                                    <p className="mt-3 text-xs text-zinc-500">
                                      {issue.recommendation}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* RECOMMENDATIONS */}
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Recommendations
          </h2>

          <div className="mt-5 space-y-3">
            {(codeAnalysis?.recommendations || []).length ===
            0 ? (
              <p className="text-sm text-zinc-500">
                No recommendations available.
              </p>
            ) : (
              codeAnalysis?.recommendations?.map(
                (recommendation, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs text-cyan-400">
                      {index + 1}
                    </span>

                    <p className="text-sm text-zinc-300">
                      {recommendation}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <Icon className="h-5 w-5 text-zinc-500" />

      <p className="mt-4 text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SecurityCount({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p className={`mt-2 text-2xl font-bold ${className}`}>
        {value}
      </p>
    </div>
  );
}

function SecurityFinding({
  issue,
}: {
  issue: Issue;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${severityClass(
                issue.severity as Severity
              )}`}
            >
              {issue.severity}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
              {issue.type}
            </span>
          </div>

          <h3 className="mt-3 font-medium">
            {issue.message}
          </h3>

          <p className="mt-2 font-mono text-xs text-zinc-500">
            {issue.file}:{issue.line}
          </p>

          {issue.recommendation && (
            <div className="mt-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-4">
              <p className="text-xs font-medium text-cyan-400">
                Recommended Fix
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {issue.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}