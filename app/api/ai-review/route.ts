"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Sparkles,
  Code2,
} from "lucide-react";

type Severity = "High" | "Medium" | "Low";

type Issue = {
  type: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
};

type AnalysisFile = {
  path: string;
  lines?: number;
  functions?: number;
  issues?: Issue[];
  eslintIssues?: Issue[];
};

type AnalysisResponse = {
  success: boolean;
  error?: string;
  issues?: Issue[];
  files?: AnalysisFile[];
};

export default function ReviewPage() {
  const [analysis, setAnalysis] =
    useState<AnalysisResponse | null>(null);

  const [selectedIssue, setSelectedIssue] =
    useState<Issue | null>(null);

  const [review, setReview] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState("");

  const repo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("repo") ||
        "kundan2678-stack/codeintel-ai"
      : "kundan2678-stack/codeintel-ai";

  /*
   * Load repository analysis
   */
  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoadingAnalysis(true);
        setError("");

        const response = await fetch(
          `/api/github/analyze?repo=${encodeURIComponent(repo)}`
        );

        const result: AnalysisResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load analysis"
          );
        }

        setAnalysis(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load analysis"
        );
      } finally {
        setLoadingAnalysis(false);
      }
    }

    loadAnalysis();
  }, [repo]);

  /*
   * Combine normal analyzer + ESLint issues
   */
  const issues = useMemo(() => {
    if (!analysis) return [];

    const result: Issue[] = [...(analysis.issues || [])];

    for (const file of analysis.files || []) {
      for (const issue of file.eslintIssues || []) {
        const exists = result.some(
          (item) =>
            item.file === issue.file &&
            item.line === issue.line &&
            item.message === issue.message
        );

        if (!exists) {
          result.push(issue);
        }
      }
    }

    return result;
  }, [analysis]);

  /*
   * Find source code for selected file
   *
   * The GitHub files API is used so the AI receives
   * real repository code.
   */
  async function getFileContent(filePath: string) {
    const response = await fetch(
      `/api/github/files?repo=${encodeURIComponent(
        repo
      )}&path=${encodeURIComponent(filePath)}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Failed to fetch file content"
      );
    }

    return result.content || "";
  }

  /*
   * Generate AI review
   */
  async function generateReview(issue: Issue) {
    try {
      setSelectedIssue(issue);
      setReview("");
      setLoadingAI(true);
      setError("");

      const code = await getFileContent(issue.file);

      if (!code) {
        throw new Error(
          "Could not retrieve source code for this file."
        );
      }

      const response = await fetch("/api/ai-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          file: issue.file,
          issue: `${issue.type}: ${issue.message} at line ${issue.line}`,
          language: getLanguage(issue.file),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "AI review failed"
        );
      }

      setReview(result.review || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate AI review"
      );
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-black/40">
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
              AI Code Review
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              {repo}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
            <Bot className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-300">
              AI Reviewer
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        {/* LEFT SIDE */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Detected Issues
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Select an issue for AI analysis.
                </p>
              </div>

              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                {issues.length}
              </span>
            </div>
          </div>

          {loadingAnalysis ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : error && !analysis ? (
            <div className="p-6">
              <AlertTriangle className="mb-3 h-6 w-6 text-red-400" />
              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          ) : issues.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-400" />

              <p className="font-medium">
                No issues detected
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Your current analyzer did not find any issues.
              </p>
            </div>
          ) : (
            <div className="max-h-[700px] overflow-y-auto">
              {issues.map((issue, index) => (
                <button
                  key={`${issue.file}-${issue.line}-${index}`}
                  onClick={() => generateReview(issue)}
                  className={`w-full border-b border-white/10 p-5 text-left transition hover:bg-white/[0.05] ${
                    selectedIssue === issue
                      ? "bg-cyan-500/[0.07]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] ${
                        issue.severity === "High"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : issue.severity === "Medium"
                          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                          : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {issue.severity}
                    </span>

                    <span className="text-[10px] text-zinc-600">
                      Line {issue.line}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium text-zinc-200">
                    {issue.message}
                  </p>

                  <p className="mt-2 truncate font-mono text-xs text-zinc-500">
                    {issue.file}
                  </p>

                  <p className="mt-2 text-[10px] text-zinc-600">
                    {issue.type}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT SIDE */}
        <section className="space-y-6">
          {/* SELECTED ISSUE */}
          {selectedIssue && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-red-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {selectedIssue.type}
                    </span>

                    <span className="text-xs text-zinc-600">
                      •
                    </span>

                    <span className="font-mono text-xs text-zinc-500">
                      {selectedIssue.file}:{selectedIssue.line}
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-semibold">
                    {selectedIssue.message}
                  </h2>
                </div>
              </div>
            </div>
          )}

          {/* AI PANEL */}
          <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/10 p-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    AI Review
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Powered by AI code analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!selectedIssue ? (
                <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
                  <div className="rounded-2xl bg-white/5 p-5">
                    <Code2 className="h-8 w-8 text-zinc-500" />
                  </div>

                  <h3 className="mt-5 font-semibold">
                    Select an issue
                  </h3>

                  <p className="mt-2 max-w-sm text-sm text-zinc-500">
                    Choose a detected issue from the left panel
                    to generate an AI-powered code review.
                  </p>
                </div>
              ) : loadingAI ? (
                <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />

                  <h3 className="mt-5 font-semibold">
                    AI is reviewing your code...
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    Analyzing security, bugs, performance and
                    maintainability.
                  </p>
                </div>
              ) : review ? (
                <div>
                  <div className="prose prose-invert max-w-none">
                    <MarkdownLikeText text={review} />
                  </div>

                  <button
                    onClick={() =>
                      selectedIssue &&
                      generateReview(selectedIssue)
                    }
                    className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    Regenerate Review
                  </button>
                </div>
              ) : (
                <div className="flex min-h-[450px] items-center justify-center">
                  <p className="text-sm text-zinc-500">
                    No AI review generated.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ERROR */}
          {error && analysis && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getLanguage(file: string) {
  const extension = file.split(".").pop()?.toLowerCase();

  const languages: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript React",
    js: "JavaScript",
    jsx: "JavaScript React",
    py: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
  };

  return languages[extension || ""] || "Unknown";
}

function MarkdownLikeText({
  text,
}: {
  text: string;
}) {
  const blocks = text.split("\n");

  return (
    <div className="space-y-3">
      {blocks.map((line, index) => {
        if (line.startsWith("```")) {
          return null;
        }

        if (line.startsWith("# ")) {
          return (
            <h2
              key={index}
              className="mt-6 text-xl font-bold text-white"
            >
              {line.replace("# ", "")}
            </h2>
          );
        }

        if (line.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="mt-5 text-lg font-semibold text-cyan-300"
            >
              {line.replace("## ", "")}
            </h3>
          );
        }

        if (/^\d+\.\s/.test(line)) {
          return (
            <p
              key={index}
              className="text-sm leading-7 text-zinc-300"
            >
              {line}
            </p>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <div
              key={index}
              className="flex gap-2 text-sm leading-7 text-zinc-300"
            >
              <span className="text-cyan-400">•</span>
              <span>{line.substring(2)}</span>
            </div>
          );
        }

        if (!line.trim()) {
          return <div key={index} className="h-1" />;
        }

        return (
          <p
            key={index}
            className="text-sm leading-7 text-zinc-300"
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}