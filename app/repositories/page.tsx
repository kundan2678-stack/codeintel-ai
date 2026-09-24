"use client";

import {
  Search,
  GitBranch,
  Star,
  GitPullRequest,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";

import { useEffect, useState } from "react";
import Link from "next/link";

type Repository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  private: boolean;
  url: string;
};

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRepositories() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/github/repos");

        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch repositories");
        }

        setRepositories(data.repositories);
      } catch (err) {
        console.error("Repository fetch error:", err);
        setError("Unable to load GitHub repositories.");
      } finally {
        setLoading(false);
      }
    }

    fetchRepositories();
  }, []);

  const filteredRepositories = repositories.filter((repo) =>
    `${repo.name} ${repo.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-zinc-500">CodeIntel AI</p>

            <h1 className="mt-1 text-2xl font-bold">
              Repositories
            </h1>
          </div>

          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">
            <Plus size={17} />
            Connect Repository
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Your repositories
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Analyze your GitHub projects with CodeIntel AI.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 md:max-w-sm">
            <Search size={18} className="text-zinc-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

            <p className="mt-4 text-sm text-zinc-500">
              Loading GitHub repositories...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredRepositories.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-zinc-400">
              No repositories found.
            </p>
          </div>
        )}

        {/* Repository Grid */}
        {!loading && !error && filteredRepositories.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {filteredRepositories.map((repo) => (
              <div
                key={repo.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]"
              >
                {/* Repository Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <GitBranch size={19} />
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          {repo.name}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                          {repo.private
                            ? "Private GitHub Repository"
                            : "Public GitHub Repository"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">
                    {repo.language || "Unknown"}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-5 min-h-12 text-sm leading-6 text-zinc-500">
                  {repo.description ||
                    "No description available for this repository."}
                </p>

                {/* GitHub Stats */}
                <div className="mt-5 flex gap-5 border-y border-white/10 py-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Star size={15} />
                    {repo.stars}
                  </div>

                  <div className="flex items-center gap-2">
                    <GitBranch size={15} />
                    {repo.forks} forks
                  </div>

                  <div className="flex items-center gap-2">
                    <GitPullRequest size={15} />
                    GitHub
                  </div>
                </div>

                {/* Scores */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Score
                    icon={<ShieldCheck size={16} />}
                    title="Security"
                    value="Not analyzed"
                  />

                  <Score
                    icon={<ShieldCheck size={16} />}
                    title="Code Quality"
                    value="Not analyzed"
                  />
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-medium transition hover:bg-white/10"
                  >
                    GitHub
                  </a>

                  <Link
                    href={`/analysis?repo=${encodeURIComponent(
                      repo.fullName
                    )}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                  >
                    Analyze
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Score({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {icon}
        {title}
      </div>

      <div className="mt-2">
        <span className="text-sm font-semibold text-zinc-300">
          {value}
        </span>
      </div>
    </div>
  );
} 