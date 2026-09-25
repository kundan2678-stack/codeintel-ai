"use client";

import { useEffect, useState } from "react";
import {
  Code2,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Gauge,
  GitPullRequest,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

type Repository = {
  name: string;
  fullName: string;
  language: string | null;
};

type Finding = {
  id?: string;
  title?: string;
  message?: string;
  type: string;
  severity: string;
  file?: string | null;
  line?: number | null;
};

type Analysis = {
  id: string;
  codeQuality: number;
  security: number;
  performance: number;
  maintainability: number;
  codeHealth: number;
  filesAnalyzed: number;
  sourceFiles: number;
  functions: number;
  lines: number;
  issueCount: number;
  summary?: string | null;
  createdAt: string;
  findings: Finding[];
};

type HistoryResponse = {
  success: boolean;
  repository?: {
    name: string;
    fullName: string;
    language: string | null;
  };
  analyses?: Analysis[];
  error?: string;
};

const emptyMetrics = [
  {
    title: "Code Quality",
    value: 0,
    icon: CheckCircle2,
  },
  {
    title: "Security",
    value: 0,
    icon: ShieldCheck,
  },
  {
    title: "Performance",
    value: 0,
    icon: Gauge,
  },
  {
    title: "Maintainability",
    value: 0,
    icon: BrainCircuit,
  },
];

export default function Dashboard() {
  const [repo, setRepo] = useState("kundan2678-stack/codeintel-ai");

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepositories, setLoadingRepositories] = useState(true);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState("");

  async function loadRepositories() {
    try {
      setLoadingRepositories(true);

      const response = await fetch("/api/github/repos", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.repositories)) {
        setRepositories(data.repositories);

        const currentExists = data.repositories.some(
          (repository: Repository) => repository.fullName === repo
        );

        if (!currentExists && data.repositories.length > 0) {
          setRepo(data.repositories[0].fullName);
        }
      }
    } catch (error) {
      console.error("Failed to load repositories:", error);
    } finally {
      setLoadingRepositories(false);
    }
  }

  async function loadAnalysis(selectedRepo: string) {
    if (!selectedRepo) return;

    try {
      setLoadingAnalysis(true);
      setAnalysisError("");

      const response = await fetch(
        `/api/analysis/history?repo=${encodeURIComponent(selectedRepo)}`,
        {
          cache: "no-store",
        }
      );

      const data: HistoryResponse = await response.json();

      if (!response.ok || !data.success) {
        setAnalysis(null);
        setHistory([]);
        setAnalysisError(
          data.error || "No analysis data available for this repository."
        );
        return;
      }

      const analyses = Array.isArray(data.analyses)
        ? data.analyses
        : [];

      setHistory(analyses);
      setAnalysis(analyses.length > 0 ? analyses[0] : null);

      if (analyses.length === 0) {
        setAnalysisError(
          "This repository has not been analyzed yet."
        );
      }
    } catch (error) {
      console.error("Failed to load analysis:", error);
      setAnalysis(null);
      setHistory([]);
      setAnalysisError("Failed to load analysis data.");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    loadAnalysis(repo);
  }, [repo]);

  const metrics = analysis
    ? [
        {
          title: "Code Quality",
          value: analysis.codeQuality,
          icon: CheckCircle2,
        },
        {
          title: "Security",
          value: analysis.security,
          icon: ShieldCheck,
        },
        {
          title: "Performance",
          value: analysis.performance,
          icon: Gauge,
        },
        {
          title: "Maintainability",
          value: analysis.maintainability,
          icon: BrainCircuit,
        },
      ]
    : emptyMetrics;

  const recentFindings =
    analysis?.findings?.slice(0, 5) || [];

  const chartData = [...history]
    .reverse()
    .slice(-10);

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
              <Code2 size={20} />
            </div>

            <div>
              <h1 className="font-semibold">
                CodeIntel AI
              </h1>

              <p className="text-xs text-zinc-500">
                Developer Intelligence
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
            KS
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <div>
          <p className="text-sm text-zinc-500">
            Developer Dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Good morning, Kundan 👋
          </h2>

          <p className="mt-2 text-zinc-400">
            Here is an overview of your engineering intelligence.
          </p>
        </div>

        {/* Repository Selector */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Active Repository
              </p>

              <h3 className="mt-1 font-semibold">
                Select repository to analyze
              </h3>
            </div>

            <div className="relative w-full md:w-[420px]">
              <select
                value={repo}
                onChange={(event) =>
                  setRepo(event.target.value)
                }
                disabled={loadingRepositories}
                className="w-full appearance-none rounded-xl border border-white/10 bg-[#0d0d12] px-4 py-3 pr-10 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {repositories.length === 0 ? (
                  <option value={repo}>
                    {loadingRepositories
                      ? "Loading repositories..."
                      : repo}
                  </option>
                ) : (
                  repositories.map((repository) => (
                    <option
                      key={repository.fullName}
                      value={repository.fullName}
                    >
                      {repository.fullName}
                    </option>
                  ))
                )}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Currently selected:
            <span className="text-zinc-400">
              {repo}
            </span>
          </div>
        </div>

        {/* Refresh */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => loadAnalysis(repo)}
            disabled={loadingAnalysis}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loadingAnalysis ? "animate-spin" : ""
              }
            />
            Refresh Analysis
          </button>
        </div>

        {/* Metrics */}
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-500">
                    {metric.title}
                  </p>

                  <Icon
                    size={18}
                    className="text-zinc-500"
                  />
                </div>

                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold">
                    {loadingAnalysis
                      ? "..."
                      : metric.value}
                  </span>

                  <span className="mb-1 text-sm text-zinc-600">
                    / 100
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{
                      width: `${metric.value}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Error / Empty */}
        {!loadingAnalysis && analysisError && (
          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={19}
                className="mt-0.5 text-yellow-500"
              />

              <div>
                <p className="font-medium text-yellow-400">
                  Analysis unavailable
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {analysisError}
                </p>

                <a
                  href={`/analysis?repo=${encodeURIComponent(repo)}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-white hover:underline"
                >
                  Analyze repository
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Quality Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Code Quality Trend
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Repository analysis history
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                {history.length} Analyses
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="mt-10 flex h-56 items-end gap-3">
                {chartData.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-1 flex-col items-center justify-end"
                  >
                    <div className="mb-2 text-xs text-zinc-600 opacity-0 transition group-hover:opacity-100">
                      {item.codeQuality}
                    </div>

                    <div
                      className="w-full rounded-t-lg bg-white/20 transition hover:bg-white/40"
                      style={{
                        height: `${Math.max(
                          item.codeQuality,
                          5
                        )}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-zinc-600">
                No analysis history available
              </div>
            )}
          </div>

          {/* Developer Score */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-semibold">
              Developer Score
            </h3>

            <div className="mt-8 flex items-center justify-center">
              <div
                className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-white/10"
                style={{
                  boxShadow: analysis
                    ? `inset 0 0 0 6px rgba(255,255,255,${Math.max(
                        analysis.codeHealth / 1000,
                        0.05
                      )})`
                    : undefined,
                }}
              >
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {loadingAnalysis
                      ? "..."
                      : analysis?.codeHealth ?? 0}
                  </p>

                  <p className="text-xs text-zinc-500">
                    / 100
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-zinc-400">
              {analysis
                ? "Based on latest repository analysis"
                : "Run an analysis to generate score"}
            </p>
          </div>
        </div>

        {/* Analysis Stats */}
        {analysis && (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Stat
              label="Files Analyzed"
              value={analysis.filesAnalyzed}
            />

            <Stat
              label="Source Files"
              value={analysis.sourceFiles}
            />

            <Stat
              label="Functions"
              value={analysis.functions}
            />

            <Stat
              label="Issues Found"
              value={analysis.issueCount}
            />
          </div>
        )}

        {/* Developer Intelligence */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <BrainCircuit size={22} />
              </div>

              <div>
                <p className="text-sm text-zinc-500">
                  Developer Intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Understand your engineering profile
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Analyze code quality, security,
                  performance, maintainability, strengths
                  and areas for improvement.
                </p>
              </div>
            </div>

            <a
              href={`/developer-intelligence?repo=${encodeURIComponent(
                repo
              )}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              View Intelligence
              <ArrowRight size={16} />
            </a>
          </div>
        </section>

        {/* Recent Findings */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                Recent Findings
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Issues detected during code analysis
              </p>
            </div>

            <a
              href={`/analysis?repo=${encodeURIComponent(repo)}`}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              View all
            </a>
          </div>

          <div className="mt-6 space-y-3">
            {recentFindings.length > 0 ? (
              recentFindings.map((finding, index) => (
                <div
                  key={finding.id || `${finding.message}-${index}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                    {finding.type.toLowerCase().includes(
                      "security"
                    ) ? (
                      <ShieldCheck size={18} />
                    ) : finding.type
                        .toLowerCase()
                        .includes("performance") ? (
                      <Gauge size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {finding.title ||
                        finding.message ||
                        "Code issue detected"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {finding.type}
                      {finding.file
                        ? ` • ${finding.file}`
                        : ""}
                      {finding.line
                        ? `:${finding.line}`
                        : ""}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                    {finding.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center">
                <CheckCircle2
                  size={24}
                  className="mx-auto text-zinc-500"
                />

                <p className="mt-3 text-sm text-zinc-400">
                  {analysis
                    ? "No findings in the latest analysis."
                    : "No analysis findings available."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Action
            href={`/pull-requests?repo=${encodeURIComponent(
              repo
            )}`}
            icon={<GitPullRequest size={19} />}
            title="Review Pull Request"
            description="Analyze a GitHub pull request with CodeIntel AI."
          />

          <Action
            href={`/security?repo=${encodeURIComponent(repo)}`}
            icon={<ShieldCheck size={19} />}
            title="Security Scan"
            description="Scan your repository for security vulnerabilities."
          />

          <Action
            href={`/analysis?repo=${encodeURIComponent(repo)}`}
            icon={<CheckCircle2 size={19} />}
            title="Code Health"
            description="Review your overall engineering health."
          />
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Action({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:-translate-y-1 hover:bg-white/[0.04]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        {icon}
      </div>

      <h3 className="mt-5 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </a>
  );
}