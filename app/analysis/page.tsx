"use client";

import {
  ArrowLeft,
  ShieldCheck,
  Gauge,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Sparkles,
  GitBranch,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

type AnalysisIssue = {
  type: string;
  severity: "High" | "Medium" | "Low";
  message: string;
  file: string;
  line: number;
};

type AnalysisResult = {
  success: boolean;

  repository: {
    name: string;
    fullName: string;
    branch: string;
    url: string;
  };

  summary: {
    filesAnalyzed: number;
    totalSourceFiles: number;
    lines: number;
    functions: number;
    imports: number;
    complexity: number;
    issues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };

  issues: AnalysisIssue[];
};

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams(window.location.search);
        const repo = params.get("repo");

        if (!repo) {
          throw new Error("Repository not specified.");
        }

        const response = await fetch(
          `/api/github/analyze?repo=${encodeURIComponent(repo)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to analyze repository."
          );
        }

        setData(result);
      } catch (err) {
        console.error("Analysis error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load repository analysis."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07070a] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <RefreshCw
              size={22}
              className="animate-spin text-zinc-400"
            />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Analyzing repository
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Fetching source code and running static analysis...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07070a] px-6 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="mx-auto text-red-400" size={30} />

          <h2 className="mt-4 text-xl font-semibold">
            Analysis failed
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {error || "Unable to load analysis."}
          </p>

          <Link
            href="/repositories"
            className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10"
          >
            Back to repositories
          </Link>
        </div>
      </main>
    );
  }

  const { repository, summary, issues } = data;

  /*
   * These are transparent heuristic scores based on the
   * real findings returned by our current analyzer.
   *
   * Later we will replace these with dedicated
   * ESLint/Semgrep/Bandit/AST metrics.
   */

  const qualityScore = calculateScore(
    summary.issues,
    summary.highIssues,
    summary.mediumIssues
  );

  const securityScore = calculateScore(
    summary.highIssues,
    summary.highIssues,
    0
  );

  const maintainabilityScore = calculateScore(
    summary.complexity,
    Math.floor(summary.complexity / 20),
    Math.floor(summary.complexity / 40)
  );

  const performanceScore = Math.max(
    0,
    Math.min(
      100,
      100 - Math.min(50, Math.floor(summary.complexity / 5))
    )
  );

  const codeHealth = Math.round(
    (qualityScore +
      securityScore +
      performanceScore +
      maintainabilityScore) /
      4
  );

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/repositories"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <ArrowLeft size={17} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <GitBranch
                  size={17}
                  className="text-zinc-500"
                />

                <h1 className="font-semibold">
                  {repository.name}
                </h1>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Repository Analysis · {repository.branch}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
            <CheckCircle2 size={14} />
            Analysis Complete
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Title */}
        <div>
          <p className="text-sm text-zinc-500">
            Repository Intelligence
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {repository.name}
          </h2>

          <p className="mt-2 max-w-2xl text-zinc-400">
            Real static analysis of your GitHub repository.
          </p>
        </div>

        {/* Scores */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            icon={<Code2 size={19} />}
            title="Code Quality"
            value={qualityScore}
            description={getScoreDescription(qualityScore)}
          />

          <ScoreCard
            icon={<ShieldCheck size={19} />}
            title="Security"
            value={securityScore}
            description={getScoreDescription(securityScore)}
          />

          <ScoreCard
            icon={<Gauge size={19} />}
            title="Performance"
            value={performanceScore}
            description={getScoreDescription(performanceScore)}
          />

          <ScoreCard
            icon={<Sparkles size={19} />}
            title="Maintainability"
            value={maintainabilityScore}
            description={getScoreDescription(
              maintainabilityScore
            )}
          />
        </div>

        {/* Main */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Quality */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Code Health</h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Overall repository engineering health
                </p>
              </div>

              <span className="text-2xl font-bold">
                {codeHealth}%
              </span>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${codeHealth}%` }}
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <HealthItem
                title="Files analyzed"
                value={summary.filesAnalyzed.toString()}
              />

              <HealthItem
                title="Source files"
                value={summary.totalSourceFiles.toString()}
              />

              <HealthItem
                title="Functions"
                value={summary.functions.toString()}
              />

              <HealthItem
                title="Lines"
                value={summary.lines.toString()}
              />
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />

              <h3 className="font-semibold">Analysis Summary</h3>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-400">
              CodeIntel analyzed{" "}
              <span className="text-white">
                {summary.filesAnalyzed}
              </span>{" "}
              source files containing approximately{" "}
              <span className="text-white">
                {summary.lines}
              </span>{" "}
              lines of code.
            </p>

            <p className="mt-4 text-sm leading-7 text-zinc-400">
              The analyzer detected{" "}
              <span className="text-white">
                {summary.issues}
              </span>{" "}
              issues, including{" "}
              <span className="text-white">
                {summary.highIssues}
              </span>{" "}
              high-severity findings.
            </p>

            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-medium transition hover:bg-white/10"
            >
              View GitHub Repository
            </a>
          </div>
        </div>

        {/* Findings */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Detected Issues</h3>

              <p className="mt-1 text-sm text-zinc-500">
                Findings generated by the current static analyzer
              </p>
            </div>

            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">
              {summary.issues} Issues
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {issues.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center">
                <CheckCircle2
                  className="mx-auto text-zinc-400"
                  size={24}
                />

                <p className="mt-3 text-sm text-zinc-400">
                  No issues detected by the current analyzer.
                </p>
              </div>
            ) : (
              issues.map((issue, index) => (
                <Issue
                  key={`${issue.file}-${issue.line}-${index}`}
                  severity={issue.severity}
                  title={issue.type}
                  file={issue.file}
                  line={issue.line}
                  description={issue.message}
                />
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />

            <h3 className="font-semibold">
              Automated Recommendations
            </h3>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Recommendation
              number="01"
              title="Review high-severity issues"
              description={`${summary.highIssues} high-severity findings require attention.`}
            />

            <Recommendation
              number="02"
              title="Reduce complexity"
              description={`Current estimated complexity is ${summary.complexity}. Refactor complex control-flow where appropriate.`}
            />

            <Recommendation
              number="03"
              title="Improve code quality"
              description={`${summary.lowIssues} low-severity findings were detected by the current analyzer.`}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- Helpers ---------------- */

function calculateScore(
  issues: number,
  highIssues: number,
  mediumIssues: number
) {
  const score =
    100 -
    issues * 3 -
    highIssues * 10 -
    mediumIssues * 5;

  return Math.max(0, Math.min(100, score));
}

function getScoreDescription(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Needs attention";
  return "Needs improvement";
}

function ScoreCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {icon}
        {title}
      </div>

      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-bold">{value}</span>

        <span className="mb-1 text-xs text-zinc-600">
          /100
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function HealthItem({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{title}</p>

      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Issue({
  severity,
  title,
  file,
  line,
  description,
}: {
  severity: string;
  title: string;
  file: string;
  line: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
          {severity === "High" ? (
            <AlertTriangle size={18} />
          ) : severity === "Medium" ? (
            <Bug size={18} />
          ) : (
            <ShieldCheck size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="font-medium">{title}</h4>

            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500">
              {severity}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {description}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            {file} : line {line}
          </p>
        </div>
      </div>
    </div>
  );
}

function Recommendation({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <span className="text-xs text-zinc-600">{number}</span>

      <h4 className="mt-3 font-medium">{title}</h4>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}