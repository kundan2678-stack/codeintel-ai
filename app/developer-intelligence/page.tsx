"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";
import {
  ShieldCheck,
  Code2,
  Gauge,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

type Intelligence = {
  overallScore: number;
  scores: {
    codeQuality: number;
    security: number;
    performance: number;
    maintainability: number;
  };
  developerSignals: {
    totalAnalyses: number;
    totalIssues: number;
    securityIssues: number;
    maintainabilityIssues: number;
    codeQualityIssues: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

type ApiResponse = {
  success: boolean;
  repository?: {
    name: string;
    fullName: string;
    language: string | null;
  };
  intelligence?: Intelligence | null;
  error?: string;
};

function ScoreCard({
  title,
  score,
  icon: Icon,
}: {
  title: string;
  score: number;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <Icon size={18} />
          </div>

          <span className="text-sm text-zinc-400">{title}</span>
        </div>

        <span className="text-xl font-bold">{score}</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function DeveloperIntelligencePage() {
  const repo = "kundan2678-stack/codeintel-ai";

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadIntelligence() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/developer-intelligence?repo=${encodeURIComponent(repo)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      setData(result);
    } catch (error) {
      console.error("Developer intelligence error:", error);

      setData({
        success: false,
        error: "Failed to load developer intelligence",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntelligence();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] p-8 text-white">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-72 rounded bg-white/10" />
          <div className="mt-3 h-4 w-96 rounded bg-white/5" />

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!data?.success || !data.intelligence) {
    return (
      <main className="min-h-screen bg-[#050505] p-8 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400" />

              <h1 className="text-xl font-semibold">
                Developer Intelligence unavailable
              </h1>
            </div>

            <p className="mt-3 text-sm text-zinc-400">
              {data?.error ||
                "Run a repository analysis first."}
            </p>

            <button
              onClick={loadIntelligence}
              className="mt-5 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const intelligence = data.intelligence;

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm text-zinc-500">
              Developer Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Engineering Profile
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {data.repository?.fullName || repo}
            </p>
          </div>

          <button
            onClick={loadIntelligence}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.06]"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Overall Score */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Overall Engineering Score
              </p>

              <div className="mt-3 flex items-end gap-3">
                <span className="text-6xl font-bold">
                  {intelligence.overallScore}
                </span>

                <span className="mb-2 text-zinc-500">
                  / 100
                </span>
              </div>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                Based on code quality, security, performance
                and maintainability signals from repository
                analysis.
              </p>
            </div>

            <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-white/10">
              <div className="text-center">
                <TrendingUp
                  className="mx-auto mb-2"
                  size={22}
                />

                <span className="text-sm text-zinc-400">
                  Engineering
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Score Cards */}
        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            title="Code Quality"
            score={intelligence.scores.codeQuality}
            icon={Code2}
          />

          <ScoreCard
            title="Security"
            score={intelligence.scores.security}
            icon={ShieldCheck}
          />

          <ScoreCard
            title="Performance"
            score={intelligence.scores.performance}
            icon={Gauge}
          />

          <ScoreCard
            title="Maintainability"
            score={intelligence.scores.maintainability}
            icon={Wrench}
          />
        </section>

        {/* Signals */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Developer Signals
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Analyses", intelligence.developerSignals.totalAnalyses],
              ["Total Issues", intelligence.developerSignals.totalIssues],
              ["Security Issues", intelligence.developerSignals.securityIssues],
              [
                "Maintainability",
                intelligence.developerSignals.maintainabilityIssues,
              ],
              [
                "Code Quality",
                intelligence.developerSignals.codeQualityIssues,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="text-sm text-zinc-500">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Strengths / Weaknesses */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} />

              <h2 className="font-semibold">
                Strengths
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {intelligence.strengths.length > 0 ? (
                intelligence.strengths.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300"
                  >
                    ✓ {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  No strong signals detected yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />

              <h2 className="font-semibold">
                Areas to Improve
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {intelligence.weaknesses.length > 0 ? (
                intelligence.weaknesses.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300"
                  >
                    ⚠ {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  No major weaknesses detected.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <Lightbulb size={20} />

            <h2 className="font-semibold">
              Personalized Recommendations
            </h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {intelligence.recommendations.map(
              (recommendation, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-zinc-300"
                >
                  <span className="mr-2 text-zinc-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {recommendation}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}