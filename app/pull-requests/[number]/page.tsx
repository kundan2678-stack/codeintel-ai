"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitPullRequest,
  FileCode2,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

type PRFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
  blobUrl?: string;
};

type PullRequest = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  draft: boolean | null;
  author: string;
  branch: string;
  baseBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  commits: number;
  url: string;
};

type Finding = {
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  title: string;
  file: string;
  line: number;
  explanation: string;
  recommendation: string;
  suggestedFix: string;
};

type AIReview = {
  summary: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  score: number;
  findings: Finding[];
};

type ReviewHistoryItem = {
  id: string;
  summary: string;
  risk: string;
  score: number;
  findingsCount: number;
  createdAt: string;
};

export default function PullRequestDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const number = String(params.number || "");

  const repo =
    searchParams.get("repo") ||
    "kundan2678-stack/codeintel-ai";

  const [pr, setPr] = useState<PullRequest | null>(null);
  const [files, setFiles] = useState<PRFile[]>([]);

  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [autoReviewLoading, setAutoReviewLoading] =
    useState(false);

  const [aiReview, setAiReview] =
    useState<AIReview | null>(null);

  const [reviewHistory, setReviewHistory] =
    useState<ReviewHistoryItem[]>([]);

  const [error, setError] = useState("");

  async function loadReviewHistory() {
    if (!number) return;

    try {
      const response = await fetch(
        `/api/ai-review?repo=${encodeURIComponent(
          repo
        )}&number=${number}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.review) {
          setAiReview(result.review);
        }

        setReviewHistory(result.history || []);
      }
    } catch (error) {
      console.error(
        "Failed to load review history:",
        error
      );
    }
  }

  // The effect intentionally performs async loading and updates
  // page state after the request completes.
  
  useEffect(() => {
  if (!number) {
    return;
  }

  
    async function loadPR() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/github/pr?repo=${encodeURIComponent(
            repo
          )}&number=${number}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Failed to load pull request"
          );
        }

        setPr(result.pullRequest);
        setFiles(result.files || []);

        const reviewResponse = await fetch(
          `/api/ai-review?repo=${encodeURIComponent(
            repo
          )}&number=${number}`,
          {
            cache: "no-store",
          }
        );

        const reviewResult =
          await reviewResponse.json();

        if (
          reviewResponse.ok &&
          reviewResult.success
        ) {
          if (reviewResult.review) {
            setAiReview(reviewResult.review);
          }

          setReviewHistory(
            reviewResult.history || []
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load pull request"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPR();
  }, [repo, number]);

  async function generateAIReview() {
    if (!pr || files.length === 0) {
      return;
    }

    try {
      setAiLoading(true);
      setAiReview(null);
      setError("");

      const diff = files
        .map((file) =>
          [
            `FILE: ${file.filename}`,
            `STATUS: ${file.status}`,
            `ADDITIONS: ${file.additions}`,
            `DELETIONS: ${file.deletions}`,
            "",
            "PATCH:",
            file.patch || "No patch available",
          ].join("\n")
        )
        .join(
          "\n\n--------------------------------\n\n"
        );

      const response = await fetch(
        "/api/ai-review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo,
            number: pr.number,
            file: `Pull Request #${pr.number}`,
            language:
              "Multi-file GitHub Pull Request",
            issue:
              "Review the following GitHub Pull Request diff for bugs, security vulnerabilities, performance problems and maintainability issues.",
            code: diff,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "AI review failed"
        );
      }

      setAiReview(result.review || null);

      await loadReviewHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI review failed"
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function runAutomaticReview() {
    if (!pr) return;

    try {
      setAutoReviewLoading(true);
      setError("");

      const response = await fetch(
        "/api/github/auto-review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo,
            number: pr.number,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Automatic review failed"
        );
      }

      if (result.review) {
        setAiReview(result.review);
      }

      await loadReviewHistory();
    } catch (error) {
      console.error(
        "Automatic review error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Automatic review failed"
      );
    } finally {
      setAutoReviewLoading(false);
    }
  }
  if (!number) {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <Link
        href={`/pull-requests?repo=${encodeURIComponent(repo)}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Pull Requests
      </Link>

      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <AlertTriangle className="h-8 w-8 text-red-400" />

        <h1 className="mt-4 text-xl font-semibold">
          Pull Request number is missing
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          A valid pull request number is required to load this page.
        </p>
      </div>
    </main>
  );
}

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

          <p className="mt-4 text-sm text-zinc-500">
            Loading pull request...
          </p>
        </div>
      </main>
    );
  }

  if (error && !pr) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
        <Link
          href={`/pull-requests?repo=${encodeURIComponent(
            repo
          )}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Pull Requests
        </Link>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <AlertTriangle className="h-8 w-8 text-red-400" />

          <h1 className="mt-4 text-xl font-semibold">
            Pull Request unavailable
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            href={`/pull-requests?repo=${encodeURIComponent(
              repo
            )}`}
            className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Pull Requests
          </Link>

          {pr && (
            <>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <GitPullRequest className="h-7 w-7 text-cyan-400" />

                    <span className="font-mono text-sm text-zinc-500">
                      #{pr.number}
                    </span>

                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs text-green-400">
                      {pr.state}
                    </span>
                  </div>

                  <h1 className="mt-3 text-2xl font-bold">
                    {pr.title}
                  </h1>

                  <p className="mt-2 text-sm text-zinc-500">
                    by{" "}
                    <span className="text-zinc-300">
                      {pr.author}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    GitHub
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    onClick={generateAIReview}
                    disabled={
                      aiLoading ||
                      files.length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}

                    {aiLoading
                      ? "Reviewing..."
                      : "Review with AI"}
                  </button>

                  <button
                    type="button"
                    onClick={runAutomaticReview}
                    disabled={
                      autoReviewLoading ||
                      files.length === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {autoReviewLoading ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                        Running Review...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        Run Automatic Review
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-xs">
                <span className="rounded-lg bg-white/5 px-3 py-2 font-mono text-zinc-400">
                  {pr.branch}
                </span>

                <span className="text-zinc-600">
                  →
                </span>

                <span className="rounded-lg bg-white/5 px-3 py-2 font-mono text-zinc-400">
                  {pr.baseBranch}
                </span>

                <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-zinc-400">
                  <FileCode2 className="h-4 w-4" />
                  {pr.changedFiles} files
                </span>

                <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-green-400">
                  <Plus className="h-4 w-4" />
                  {pr.additions}
                </span>

                <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-red-400">
                  <Minus className="h-4 w-4" />
                  {pr.deletions}
                </span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && pr && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* AI Review */}
        {aiReview && (
          <section className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-cyan-400">
                  CodeIntel Review
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {aiReview.score}/100
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  {aiReview.summary}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center">
                <p className="text-xs text-zinc-500">
                  Risk
                </p>

                <p className="mt-1 font-semibold">
                  {aiReview.risk}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {aiReview.findings.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <CheckCircle2 className="text-green-400" />

                  <span className="text-sm text-green-300">
                    No major issues detected.
                  </span>
                </div>
              ) : (
                aiReview.findings.map(
                  (finding, index) => (
                    <div
                      key={`${finding.file}-${finding.line}-${index}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
                          {finding.severity}
                        </span>

                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                          {finding.category}
                        </span>
                      </div>

                      <h3 className="mt-3 font-semibold">
                        {finding.title}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-400">
                        {finding.explanation}
                      </p>

                      <p className="mt-3 text-xs text-zinc-500">
                        {finding.file} : line{" "}
                        {finding.line}
                      </p>

                      <div className="mt-4 rounded-lg bg-white/5 p-3">
                        <p className="text-xs font-medium text-zinc-300">
                          Recommendation
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {finding.recommendation}
                        </p>
                      </div>

                      {finding.suggestedFix && (
                        <div className="mt-3 rounded-lg bg-cyan-500/5 p-3">
                          <p className="text-xs font-medium text-cyan-300">
                            Suggested Fix
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {finding.suggestedFix}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )
              )}
            </div>
          </section>
        )}

        {/* Review History */}
        {reviewHistory.length > 0 && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  CodeIntel
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Review History
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Previous automated reviews for this pull request.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                {reviewHistory.length}{" "}
                {reviewHistory.length === 1
                  ? "Review"
                  : "Reviews"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {reviewHistory.map(
                (review, index) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-semibold">
                        {review.score}
                      </div>

                      <Link
  key={review.id}
  href={`/pull-requests/${number}/reviews/${review.id}?repo=${encodeURIComponent(
    repo
  )}`}
  className="block rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-500/30 hover:bg-white/[0.04]"
>
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-semibold">
        {review.score}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            Review #{reviewHistory.length - index}
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400">
            {review.risk}
          </span>
        </div>

        <p className="mt-1 text-xs text-zinc-500">
          {new Date(
            review.createdAt
          ).toLocaleString()}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4 text-xs">
      <span className="text-zinc-500">
        {review.findingsCount}{" "}
        {review.findingsCount === 1
          ? "finding"
          : "findings"}
      </span>

      <span
        className={
          review.score >= 80
            ? "text-green-400"
            : review.score >= 60
              ? "text-yellow-400"
              : "text-red-400"
        }
      >
        {review.score}/100
      </span>
    </div>
  </div>
</Link>   
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-zinc-500">
                        {review.findingsCount}{" "}
                        {review.findingsCount === 1
                          ? "finding"
                          : "findings"}
                      </span>

                      <span
                        className={
                          review.score >= 80
                            ? "text-green-400"
                            : review.score >= 60
                              ? "text-yellow-400"
                              : "text-red-400"
                        }
                      >
                        {review.score}/100
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* Changed Files */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">
            Changed Files
          </h2>

          <div className="mt-5 space-y-3">
            {files.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-500">
                No changed files found.
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.filename}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileCode2 className="h-5 w-5 shrink-0 text-zinc-500" />

                      <span className="truncate font-mono text-sm text-zinc-300">
                        {file.filename}
                      </span>
                    </div>

                    <div className="flex shrink-0 gap-3 text-xs">
                      <span className="text-green-400">
                        +{file.additions}
                      </span>

                      <span className="text-red-400">
                        -{file.deletions}
                      </span>
                    </div>
                  </div>

                  {file.patch && (
                    <pre className="mt-4 overflow-x-auto rounded-lg bg-black p-4 text-xs leading-6 text-zinc-400">
                      {file.patch}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}