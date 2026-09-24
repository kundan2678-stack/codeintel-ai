"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GitPullRequest,
  FileCode2,
  Plus,
  Minus,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
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

export default function PullRequestDetailPage() {
  const [pr, setPr] =
    useState<PullRequest | null>(null);

  const [files, setFiles] =
    useState<PRFile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiReview, setAiReview] =
    useState("");

  const [error, setError] =
    useState("");

  const repo =
    typeof window !== "undefined"
      ? new URLSearchParams(
          window.location.search
        ).get("repo") ||
        "kundan2678-stack/codeintel-ai"
      : "kundan2678-stack/codeintel-ai";

  const number =
    typeof window !== "undefined"
      ? new URLSearchParams(
          window.location.search
        ).get("number")
      : null;

  useEffect(() => {
    if (!number) {
      setError("Pull request number is missing.");
      setLoading(false);
      return;
    }

    async function loadPR() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/github/pr?repo=${encodeURIComponent(
            repo
          )}&number=${number}`
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
      setAiReview("");
      setError("");

      const diff = files
        .map(
          (file) => `
FILE: ${file.filename}

STATUS: ${file.status}

ADDITIONS: ${file.additions}

DELETIONS: ${file.deletions}

PATCH:
${file.patch}
`
        )
        .join("\n\n");

      const response = await fetch(
        "/api/ai-review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: `Pull Request #${pr.number}`,
            language: "Multi-file GitHub Pull Request",
            issue:
              "Review the following GitHub Pull Request diff for bugs, security vulnerabilities, performance problems and maintainability issues.",
            code: diff,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "AI review failed"
        );
      }

      setAiReview(result.review || "");
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
      {/* HEADER */}

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

                <div className="flex gap-2">
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
                </div>
              </div>

              {/* PR STATS */}

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

                <span className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-zinc-400">
                  <FileCode2 className="h-3.5 w-3.5" />
                  {pr.changedFiles} files
                </span>

                <span className="flex items-center gap-1 rounded-lg bg-green-500/5 px-3 py-2 text-green-400">
                  <Plus className="h-3.5 w-3.5" />
                  {pr.additions}
                </span>

                <span className="flex items-center gap-1 rounded-lg bg-red-500/5 px-3 py-2 text-red-400">
                  <Minus className="h-3.5 w-3.5" />
                  {pr.deletions}
                </span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* ERROR */}

        {error && pr && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* AI REVIEW */}

        {aiReview && (
          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <h2 className="font-semibold">
                  AI Pull Request Review
                </h2>

                <p className="text-xs text-zinc-500">
                  CodeIntel AI analysis
                </p>
              </div>
            </div>

            <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
              {aiReview}
            </div>
          </section>
        )}

        {/* PR DESCRIPTION */}

        {pr?.body && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-semibold">
              Pull Request Description
            </h2>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-400">
              {pr.body}
            </p>
          </section>
        )}

        {/* FILES */}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Changed Files
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {files.length} files changed in this pull request.
            </p>
          </div>

          {files.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />

              <p className="mt-4 text-sm text-zinc-500">
                No changed files found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.filename}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode2 className="h-5 w-5 text-cyan-400" />

                      <div>
                        <p className="font-mono text-sm text-zinc-200">
                          {file.filename}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {file.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 text-xs">
                      <span className="text-green-400">
                        +{file.additions}
                      </span>

                      <span className="text-red-400">
                        -{file.deletions}
                      </span>

                      <span className="text-zinc-500">
                        {file.changes} changes
                      </span>
                    </div>
                  </div>

                  {file.patch ? (
                    <pre className="max-h-[500px] overflow-auto bg-black/40 p-5 font-mono text-xs leading-6 text-zinc-400">
                      {file.patch}
                    </pre>
                  ) : (
                    <div className="p-5 text-sm text-zinc-600">
                      No patch available for this file.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}