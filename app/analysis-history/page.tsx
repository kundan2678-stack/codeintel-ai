
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  History,
} from "lucide-react";

type Trend = "improved" | "declined" | "unchanged" | "insufficient_data";

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
};

type ComparisonItem = {
  current: number;
  previous: number;
  change: number;
  trend: Trend;
};

type HistoryResponse = {
  success: boolean;
  error?: string;
  repository: {
    id: string;
    name: string;
    fullName: string;
    description?: string | null;
    language?: string | null;
    url?: string;
    stars?: number;
    forks?: number;
  };
  historyStats: {
    totalAnalyses: number;
    totalIssues: number;
    latestAnalysisAt: string | null;
    previousAnalysisAt: string | null;
  };
  improvementSummary: {
    available: boolean;
    currentScore: number | null;
    previousScore: number | null;
    change: number | null;
    trend: Trend;
  };
  comparison: Record<string, ComparisonItem> | null;
  trend: Analysis[];
  analyses: Analysis[];
};

const metricLabels: Record<string, string> = {
  codeQuality: "Code Quality",
  security: "Security",
  performance: "Performance",
  maintainability: "Maintainability",
  codeHealth: "Overall Code Health",
};

function formatDate(date: string | null) {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function scoreColor(score: number) {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "improved") {
    return <TrendingUp className="h-4 w-4 text-green-400" />;
  }

  if (trend === "declined") {
    return <TrendingDown className="h-4 w-4 text-red-400" />;
  }

  return <Minus className="h-4 w-4 text-zinc-400" />;
}

function MetricCard({
  label,
  value,
  comparison,
}: {
  label: string;
  value: number;
  comparison?: ComparisonItem;
}) {
  const change = comparison?.change ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-zinc-400">{label}</p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p className={`text-3xl font-bold ${scoreColor(value)}`}>
          {value}
          <span className="text-sm font-normal text-zinc-500">/100</span>
        </p>

        {comparison && (
          <div className="flex items-center gap-1 text-xs">
            <TrendIcon trend={comparison.trend} />
            <span
              className={
                change > 0
                  ? "text-green-400"
                  : change < 0
                    ? "text-red-400"
                    : "text-zinc-400"
              }
            >
              {change > 0 ? "+" : ""}
              {change}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: Analysis[] }) {
  const width = 700;
  const height = 240;
  const padding = 35;

  const points = useMemo(() => {
    if (data.length === 0) return [];

    return data.map((item, index) => {
      const x =
        data.length === 1
          ? width / 2
          : padding +
            (index / (data.length - 1)) * (width - padding * 2);

      const score = Math.max(0, Math.min(100, item.codeHealth));
      const y =
        height -
        padding -
        (score / 100) * (height - padding * 2);

      return {
        x,
        y,
        score,
        date: item.createdAt,
      };
    });
  }, [data]);

  const line = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Code Health Trend</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Score progression across saved analyses
          </p>
        </div>
        <BarChart3 className="h-5 w-5 text-cyan-400" />
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
          No trend data available.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[500px] w-full"
            role="img"
            aria-label="Code health score trend chart"
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const y =
                height -
                padding -
                (value / 100) * (height - padding * 2);

              return (
                <g key={value}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="currentColor"
                    opacity="0.12"
                    strokeDasharray="4 5"
                  />
                  <text
                    x="4"
                    y={y + 4}
                    fill="currentColor"
                    opacity="0.5"
                    fontSize="11"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {points.length > 1 && (
              <path d={area} fill="#22d3ee" opacity="0.08" />
            )}

            {points.length > 1 && (
              <path
                d={line}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {points.map((point, index) => (
              <g key={`${point.date}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#22d3ee"
                  stroke="#050505"
                  strokeWidth="2"
                />
                <text
                  x={point.x}
                  y={point.y - 12}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="11"
                >
                  {point.score}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      <div className="mt-3 flex justify-between text-xs text-zinc-500">
        <span>Oldest analysis</span>
        <span>Latest analysis</span>
      </div>
    </div>
  );
}

export default function AnalysisHistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const repo =
    params?.get("repo") || "kundan2678-stack/codeintel-ai";

  const loadHistory = useCallback(async () => {
    setError("");
    setRefreshing(true);

    try {
      const response = await fetch(
        `/api/analysis/history?repo=${encodeURIComponent(repo)}`,
        { cache: "no-store" }
      );

      const result: HistoryResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to load analysis history"
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [repo]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-400" />
          <p className="font-medium">Loading analysis history...</p>
          <p className="mt-2 text-sm text-zinc-500">
            Fetching saved repository analyses.
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <AlertTriangle className="mb-4 h-10 w-10 text-red-400" />
          <h1 className="text-2xl font-bold">
            Unable to load history
          </h1>
          <p className="mt-3 text-zinc-400">{error}</p>

          <button
            onClick={loadHistory}
            className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const latest = data.analyses[0];
  const previous = data.analyses[1];
  const comparison = data.comparison;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <h1 className="text-2xl font-bold">
              Analysis History
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {data.repository.fullName}
            </p>
          </div>

          <button
            onClick={loadHistory}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <History className="h-5 w-5 text-cyan-400" />
            <p className="mt-4 text-sm text-zinc-500">
              Total Analyses
            </p>
            <p className="mt-1 text-3xl font-bold">
              {data.historyStats.totalAnalyses}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Activity className="h-5 w-5 text-cyan-400" />
            <p className="mt-4 text-sm text-zinc-500">
              Latest Code Health
            </p>
            <p
              className={`mt-1 text-3xl font-bold ${scoreColor(
                latest?.codeHealth ?? 0
              )}`}
            >
              {latest?.codeHealth ?? "N/A"}
              {latest && (
                <span className="text-sm font-normal text-zinc-500">
                  /100
                </span>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="mt-4 text-sm text-zinc-500">
              Issues in Latest Scan
            </p>
            <p className="mt-1 text-3xl font-bold">
              {latest?.issueCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Clock className="h-5 w-5 text-cyan-400" />
            <p className="mt-4 text-sm text-zinc-500">
              Last Analysis
            </p>
            <p className="mt-2 text-sm font-medium">
              {formatDate(data.historyStats.latestAnalysisAt)}
            </p>
          </div>
        </section>

        {latest && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                Latest Score Breakdown
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Current metrics and changes from the previous analysis.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {(
                [
                  "codeQuality",
                  "security",
                  "performance",
                  "maintainability",
                  "codeHealth",
                ] as const
              ).map((key) => (
                <MetricCard
                  key={key}
                  label={metricLabels[key]}
                  value={latest[key] ?? 0}
                  comparison={
                    comparison?.[key] as ComparisonItem | undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">
                Overall Improvement
              </h2>
            </div>

            {data.improvementSummary.available ? (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <p
                    className={`text-4xl font-bold ${
                      (data.improvementSummary.change ?? 0) > 0
                        ? "text-green-400"
                        : (data.improvementSummary.change ?? 0) < 0
                          ? "text-red-400"
                          : "text-zinc-300"
                    }`}
                  >
                    {(data.improvementSummary.change ?? 0) > 0
                      ? "+"
                      : ""}
                    {data.improvementSummary.change}
                  </p>
                  <div>
                    <p className="text-sm text-zinc-400">
                      Points since previous scan
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <TrendIcon
                        trend={data.improvementSummary.trend}
                      />
                      {data.improvementSummary.trend}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">Previous</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {data.improvementSummary.previousScore}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">Current</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {data.improvementSummary.currentScore}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-black/20 p-5 text-sm text-zinc-400">
                <p className="font-medium text-white">
                  Not enough data yet
                </p>
                <p className="mt-2">
                  Run another analysis to compare scores and track improvement.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">
                Repository Information
              </h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Language</span>
                <span>{data.repository.language || "Not specified"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Stars</span>
                <span>{data.repository.stars ?? 0}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Forks</span>
                <span>{data.repository.forks ?? 0}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Previous Scan</span>
                <span className="text-right">
                  {formatDate(
                    data.historyStats.previousAnalysisAt
                  )}
                </span>
              </div>
            </div>

            {data.repository.url && (
              <a
                href={data.repository.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex text-sm text-cyan-400 hover:text-cyan-300"
              >
                View GitHub Repository →
              </a>
            )}
          </div>
        </section>

        <TrendChart data={data.trend} />

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-semibold">
              Previous Analyses
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Latest 20 saved analysis records
            </p>
          </div>

          {data.analyses.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
              <p className="font-medium">No analysis history found</p>
              <p className="mt-2 text-sm text-zinc-500">
                Analyze this repository to create your first history record.
              </p>
              <Link
                href={`/analysis?repo=${encodeURIComponent(repo)}`}
                className="mt-5 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-300"
              >
                Analyze Repository
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {data.analyses.map((analysis, index) => (
                <div
                  key={analysis.id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white/5 p-3">
                      <History className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          Analysis #{data.analyses.length - index}
                        </p>
                        {index === 0 && (
                          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(analysis.createdAt)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        {analysis.filesAnalyzed} files ·{" "}
                        {analysis.functions} functions ·{" "}
                        {analysis.lines.toLocaleString()} lines
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Code Health
                      </p>
                      <p
                        className={`mt-1 text-xl font-bold ${scoreColor(
                          analysis.codeHealth
                        )}`}
                      >
                        {analysis.codeHealth}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Issues</p>
                      <p className="mt-1 text-xl font-semibold">
                        {analysis.issueCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Security</p>
                      <p className="mt-1 text-xl font-semibold">
                        {analysis.security}/100
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/analysis?repo=${encodeURIComponent(repo)}`}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black hover:bg-cyan-300"
          >
            Open Repository Analysis
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm hover:bg-white/5"
          >
            Back to Dashboard
          </Link>
        </div>

        {previous && (
          <p className="text-xs text-zinc-600">
            Comparison uses the two most recent saved analyses.
          </p>
        )}
      </div>
    </main>
  );
}
