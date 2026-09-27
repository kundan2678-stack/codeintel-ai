"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  FileCode2,
} from "lucide-react";

type Finding = {
  id: string;
  category: string;
  severity: string;
  title: string;
  file: string | null;
  line: number | null;
  explanation: string;
  recommendation: string | null;
  suggestedFix: string | null;
};

type Review = {
  id: string;
  score: number;
  risk: string;
  summary: string;
  createdAt: string;
  pullRequest: {
    number: number;
    title: string;
    repository: string;
  };
  findings: Finding[];
};

export default function ReviewDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const number = String(params.number || "");
  const reviewId = String(params.reviewId || "");

  const repo =
    searchParams.get("repo") ||
    "kundan2678-stack/codeintel-ai";

  const [review, setReview] =
    useState<Review | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!reviewId) return;

    async function loadReview() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/ai-review/${reviewId}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Failed to load review"
          );
        }

        setReview(result.review);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load review"
        );
      } finally {
        setLoading(false);
      }
    }

    loadReview();
  }, [reviewId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />

          <p className="mt-4 text-sm text-zinc-500">
            Loading review...
          </p>
        </div>
      </main>
    );
  }

  if (error || !review) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
        <Link
          href={`/pull-requests/${number}?repo=${encodeURIComponent(
            repo
          )}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pull Request
        </Link>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <AlertTriangle className="h-8 w-8 text-red-400" />

          <h1 className="mt-4 text-xl font-semibold">
            Review unavailable
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error || "Review not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            href={`/pull-requests/${number}?repo=${encodeURIComponent(
              repo
            )}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pull Request
          </Link>

          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-cyan-400" />

                <span className="text-sm text-zinc-500">
                  CodeIntel Review
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold">
                Review Details
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                PR #{review.pullRequest.number} ·{" "}
                {review.pullRequest.title}
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                {review.pullRequest.repository}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-center">
                <p className="text-xs text-zinc-500">
                  Score
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {review.score}
                  <span className="text-sm text-zinc-600">
                    /100
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-center">
                <p className="text-xs text-zinc-500">
                  Risk
                </p>

                <p className="mt-2 font-semibold">
                  {review.risk}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Summary */}
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <p className="text-xs uppercase tracking-wider text-cyan-400">
            Review Summary
          </p>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            {review.summary}
          </p>

          <p className="mt-4 text-xs text-zinc-600">
            Reviewed on{" "}
            {new Date(
              review.createdAt
            ).toLocaleString()}
          </p>
        </section>

        {/* Findings */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Findings
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Issues detected during this review.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
              {review.findings.length}{" "}
              {review.findings.length === 1
                ? "Finding"
                : "Findings"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {review.findings.length === 0 ? (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-400" />

                  <div>
                    <p className="font-medium text-green-300">
                      No issues detected
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      CodeIntel did not detect any
                      review findings.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              review.findings.map((finding) => (
                <article
                  key={finding.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                      {finding.severity}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                      {finding.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">
                    {finding.title}
                  </h3>

                  {finding.file && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <FileCode2 className="h-4 w-4" />

                      <span className="font-mono">
                        {finding.file}
                      </span>

                      {finding.line && (
                        <span>
                          :{finding.line}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    {finding.explanation}
                  </p>

                  {finding.recommendation && (
                    <div className="mt-5 rounded-xl bg-white/5 p-4">
                      <p className="text-xs font-medium text-zinc-300">
                        Recommendation
                      </p>

                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {finding.recommendation}
                      </p>
                    </div>
                  )}

                  {finding.suggestedFix && (
                    <div className="mt-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                      <p className="text-xs font-medium text-cyan-300">
                        Suggested Fix
                      </p>

                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {finding.suggestedFix}
                      </p>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}