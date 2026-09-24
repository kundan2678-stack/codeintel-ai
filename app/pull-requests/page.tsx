"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GitPullRequest,
  RefreshCw,
  GitMerge,
  XCircle,
  Clock,
  FileCode2,
  Plus,
  Minus,
  ExternalLink,
  Sparkles,
} from "lucide-react";

type PullRequest = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  draft: boolean | null;
  merged: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  branch: string;
  baseBranch: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  commits: number;
};

export default function PullRequestsPage() {
  const [pullRequests, setPullRequests] =
    useState<PullRequest[]>([]);

  const [state, setState] =
    useState<"all" | "open" | "closed">("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const repo =
    typeof window !== "undefined"
      ? new URLSearchParams(
          window.location.search
        ).get("repo") ||
        "kundan2678-stack/codeintel-ai"
      : "kundan2678-stack/codeintel-ai";

  async function loadPullRequests(
    selectedState = state
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/github/prs?repo=${encodeURIComponent(
          repo
        )}&state=${selectedState}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Failed to fetch pull requests"
        );
      }

      setPullRequests(
        result.pullRequests || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load pull requests"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPullRequests(state);
  }, [repo, state]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}

      <header className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            href="/repositories"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Repositories
          </Link>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <GitPullRequest className="h-7 w-7 text-cyan-400" />

                <h1 className="text-3xl font-bold">
                  Pull Requests
                </h1>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                AI-powered review workspace
              </p>

              <p className="mt-1 font-mono text-xs text-zinc-600">
                {repo}
              </p>
            </div>

            <button
              onClick={() =>
                loadPullRequests(state)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* FILTERS */}

        <div className="mb-6 flex flex-wrap gap-2">
          {(
            ["all", "open", "closed"] as const
          ).map((item) => (
            <button
              key={item}
              onClick={() => setState(item)}
              className={`rounded-xl px-4 py-2 text-sm capitalize transition ${
                state === item
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

              <p className="mt-4 text-sm text-zinc-400">
                Loading pull requests...
              </p>
            </div>
          </div>
        ) : pullRequests.length === 0 ? (
          /* EMPTY STATE */

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <GitPullRequest className="mx-auto h-12 w-12 text-zinc-600" />

            <h2 className="mt-5 text-xl font-semibold">
              No pull requests found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              This repository does not currently have
              any pull requests in the selected state.
            </p>

            <a
              href={`https://github.com/${repo}/pulls`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Open GitHub Pull Requests
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          /* PR LIST */

          <div className="space-y-4">
            {pullRequests.map((pr) => (
              <div
                key={pr.number}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    {/* STATUS */}

                    <div className="flex flex-wrap items-center gap-2">
                      {pr.merged ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-400">
                          <GitMerge className="h-3 w-3" />
                          Merged
                        </span>
                      ) : pr.state === "open" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs text-green-400">
                          <GitPullRequest className="h-3 w-3" />
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                          <XCircle className="h-3 w-3" />
                          Closed
                        </span>
                      )}

                      {pr.draft && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-500">
                          Draft
                        </span>
                      )}

                      <span className="font-mono text-xs text-zinc-600">
                        #{pr.number}
                      </span>
                    </div>

                    {/* TITLE */}

                    <h2 className="mt-3 text-xl font-semibold">
                      {pr.title}
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                      by{" "}
                      <span className="text-zinc-300">
                        {pr.author}
                      </span>
                    </p>

                    {/* BRANCH */}

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-zinc-400">
                        {pr.branch}
                      </span>

                      <span className="text-zinc-600">
                        →
                      </span>

                      <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-zinc-400">
                        {pr.baseBranch}
                      </span>
                    </div>

                    {/* STATS */}

                    <div className="mt-5 flex flex-wrap gap-5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <FileCode2 className="h-4 w-4" />
                        {pr.changedFiles} files
                      </span>

                      <span className="flex items-center gap-1.5 text-green-400">
                        <Plus className="h-4 w-4" />
                        {pr.additions}
                      </span>

                      <span className="flex items-center gap-1.5 text-red-400">
                        <Minus className="h-4 w-4" />
                        {pr.deletions}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <GitPullRequest className="h-4 w-4" />
                        {pr.commits} commits
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatDate(pr.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex shrink-0 flex-col gap-2">
                    <Link
                      href={`/pull-requests/${pr.number}?repo=${encodeURIComponent(
                        repo
                      )}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-black hover:bg-cyan-300"
                    >
                      <Sparkles className="h-4 w-4" />
                      Review with AI
                    </Link>

                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10"
                    >
                      GitHub
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return date;
  }
}