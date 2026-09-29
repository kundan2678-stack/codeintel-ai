
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  GitMerge,
  GitPullRequestClosed,
  ExternalLink,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  GitBranch,
  FileCode,
} from "lucide-react";

type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  draft: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  } | null;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  changed_files: number;
  additions: number;
  deletions: number;
  commits: number;
};

type PullRequestResponse = {
  success?: boolean;
  data?: PullRequest[];
  pullRequests?: PullRequest[];
  error?: string;
  message?: string;
};

type FilterState = "all" | "open" | "closed";

const DEFAULT_REPO = "kundan2678-stack/codeintel-ai";

export default function PullRequestsPage() {
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [filter, setFilter] = useState<FilterState>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Read repository name from URL without synchronous state updates in an effect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedRepo = params.get("repo");

    if (!selectedRepo) return;

    const timeoutId = setTimeout(() => {
      setRepo(selectedRepo);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const loadPullRequests = useCallback(
    async (selectedFilter: FilterState = filter) => {
      if (!repo.trim()) {
        setError("Repository name is missing.");
        setLoading(false);
        return;
      }

      setError("");
      setLoading(true);

      try {
        const response = await fetch(
          `/api/github/prs?repo=${encodeURIComponent(repo)}&state=${selectedFilter}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result: PullRequestResponse = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.error || result.message || "Failed to load pull requests."
          );
        }

        const requests = result.data ?? result.pullRequests ?? [];

        setPullRequests(Array.isArray(requests) ? requests : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading pull requests."
        );
        setPullRequests([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [repo, filter]
  );

  // Defer fetching to avoid calling state setters directly inside an effect.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadPullRequests(filter);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadPullRequests, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPullRequests(filter);
  };

  const openCount = pullRequests.filter(
    (pr) => pr.state === "open"
  ).length;

  const closedCount = pullRequests.filter(
    (pr) => pr.state === "closed"
  ).length;

  const mergedCount = pullRequests.filter(
    (pr) => pr.merged_at !== null
  ).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (pr: PullRequest) => {
    if (pr.merged_at) {
      return {
        label: "Merged",
        icon: GitMerge,
        className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    }

    if (pr.state === "open") {
      return {
        label: "Open",
        icon: GitPullRequest,
        className: "bg-green-500/10 text-green-400 border-green-500/20",
      };
    }

    return {
      label: "Closed",
      icon: GitPullRequestClosed,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    };
  };

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
              <GitPullRequest size={16} />
              <span>CodeIntel AI</span>
              <span>/</span>
              <span>Pull Requests</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pull Requests
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Review, analyze, and track pull requests from your GitHub
              repository.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Repository */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-zinc-800 p-2.5">
              <GitBranch size={20} className="text-zinc-300" />
            </div>

            <div>
              <p className="text-xs text-zinc-500">Selected repository</p>
              <p className="font-medium text-zinc-200">{repo}</p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            GitHub Connected
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Total PRs</p>
              <GitPullRequest className="text-blue-400" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold">{pullRequests.length}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Loaded pull requests
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Open</p>
              <Clock className="text-green-400" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold">{openCount}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Awaiting review or merge
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Closed</p>
              <XCircle className="text-red-400" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold">{closedCount}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Closed pull requests
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Merged</p>
              <GitMerge className="text-purple-400" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold">{mergedCount}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Successfully merged
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">All Pull Requests</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Select a pull request to inspect its changes and review results.
            </p>
          </div>

          <div className="flex w-fit gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {(["all", "open", "closed"] as FilterState[]).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition ${
                  filter === item
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-400"
            />
            <div className="flex-1">
              <p className="font-medium text-red-400">
                Unable to load pull requests
              </p>
              <p className="mt-1 text-sm text-zinc-400">{error}</p>
              <button
                onClick={() => void loadPullRequests(filter)}
                className="mt-3 text-sm font-medium text-red-400 underline underline-offset-4 hover:text-red-300"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <Loader2 className="animate-spin text-blue-400" size={30} />
            <p className="text-sm text-zinc-400">
              Loading pull requests...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && pullRequests.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 text-center">
            <div className="mb-4 rounded-full bg-zinc-800 p-4">
              <Search size={28} className="text-zinc-400" />
            </div>

            <h3 className="text-lg font-semibold">
              No pull requests found
            </h3>

            <p className="mt-2 max-w-md text-sm text-zinc-500">
              There are no {filter === "all" ? "" : filter} pull requests
              available for this repository.
            </p>

            <button
              onClick={handleRefresh}
              className="mt-5 rounded-lg border border-zinc-700 px-4 py-2 text-sm transition hover:bg-zinc-800"
            >
              Refresh list
            </button>
          </div>
        )}

        {/* Pull request list */}
        {!loading && !error && pullRequests.length > 0 && (
          <div className="space-y-3">
            {pullRequests.map((pr) => {
              const status = getStatus(pr);
              const StatusIcon = status.icon;

              return (
                <div
                  key={pr.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>

                        {pr.draft && (
                          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                            Draft
                          </span>
                        )}

                        <span className="text-sm text-zinc-500">
                          #{pr.number}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold leading-snug text-zinc-100">
                        {pr.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                        {pr.body || "No description provided."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1.5">
                          <GitBranch size={14} />
                          {pr.head.ref}
                          <span>→</span>
                          {pr.base.ref}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} />
                          Updated {formatDate(pr.updated_at)}
                        </span>

                        {pr.user && (
                          <span>
                            by <span className="text-zinc-300">{pr.user.login}</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <FileCode size={14} />
                          {pr.changed_files} files
                        </span>

                        <span className="text-green-400">
                          +{pr.additions}
                        </span>

                        <span className="text-red-400">
                          -{pr.deletions}
                        </span>

                        <span>{pr.commits} commits</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                      <Link
                        href={`/pull-requests/${pr.number}?repo=${encodeURIComponent(repo)}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                      >
                        <CheckCircle2 size={16} />
                        Review with AI
                      </Link>

                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
                      >
                        <ExternalLink size={15} />
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
