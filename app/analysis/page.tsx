import {
  ArrowLeft,
  ShieldCheck,
  Gauge,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Sparkles,
  GitBranch,
} from "lucide-react";
import Link from "next/link";

const issues = [
  {
    severity: "High",
    title: "Potential SQL Injection",
    file: "src/api/users.ts",
    line: 42,
    description:
      "User-controlled input appears to be directly included in a database query.",
  },
  {
    severity: "Medium",
    title: "High Cyclomatic Complexity",
    file: "src/services/auth.ts",
    line: 87,
    description:
      "This function contains multiple branches and may be difficult to maintain.",
  },
  {
    severity: "Low",
    title: "Missing Input Validation",
    file: "src/api/profile.ts",
    line: 21,
    description:
      "Incoming request data should be validated before processing.",
  },
];

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/repositories"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <ArrowLeft size={17} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <GitBranch size={17} className="text-zinc-500" />

                <h1 className="font-semibold">codeintel-ai</h1>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Repository Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
            <CheckCircle2 size={14} />
            Analysis Complete
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Title */}
        <div>
          <p className="text-sm text-zinc-500">Repository Intelligence</p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            codeintel-ai
          </h2>

          <p className="mt-2 max-w-2xl text-zinc-400">
            AI-powered analysis of code quality, security, performance and
            maintainability.
          </p>
        </div>

        {/* Scores */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            icon={<Code2 size={19} />}
            title="Code Quality"
            value="86"
            description="Good"
          />

          <ScoreCard
            icon={<ShieldCheck size={19} />}
            title="Security"
            value="92"
            description="Excellent"
          />

          <ScoreCard
            icon={<Gauge size={19} />}
            title="Performance"
            value="78"
            description="Needs attention"
          />

          <ScoreCard
            icon={<Sparkles size={19} />}
            title="Maintainability"
            value="88"
            description="Good"
          />
        </div>

        {/* Main */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Quality */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Code Health</h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Overall repository engineering health
                </p>
              </div>

              <span className="text-2xl font-bold">86%</span>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: "86%" }}
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <HealthItem
                title="Functions"
                value="142"
              />

              <HealthItem
                title="Files"
                value="38"
              />

              <HealthItem
                title="Dependencies"
                value="27"
              />
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />

              <h3 className="font-semibold">AI Summary</h3>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-400">
              The repository has a strong overall structure with good security
              practices. The main improvement area is reducing complexity in
              backend services and improving input validation.
            </p>

            <button className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium transition hover:bg-white/10">
              Generate Detailed Report
            </button>
          </div>
        </div>

        {/* Findings */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Detected Issues</h3>

              <p className="mt-1 text-sm text-zinc-500">
                Findings from static analysis and AI review
              </p>
            </div>

            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">
              3 Issues
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {issues.map((issue) => (
              <Issue
                key={`${issue.file}-${issue.line}`}
                severity={issue.severity}
                title={issue.title}
                file={issue.file}
                line={issue.line}
                description={issue.description}
              />
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />

            <h3 className="font-semibold">AI Recommendations</h3>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Recommendation
              number="01"
              title="Improve input validation"
              description="Validate and sanitize external request data before processing."
            />

            <Recommendation
              number="02"
              title="Refactor complex functions"
              description="Break large functions into smaller reusable units."
            />

            <Recommendation
              number="03"
              title="Improve test coverage"
              description="Add automated tests around authentication and API services."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {icon}
        {title}
      </div>

      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-bold">{value}</span>

        <span className="mb-1 text-xs text-zinc-600">/100</span>
      </div>

      <p className="mt-2 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function HealthItem({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Issue({
  severity,
  title,
  file,
  line,
  description,
}: {
  severity: string;
  title: string;
  file: string;
  line: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
          {severity === "High" ? (
            <AlertTriangle size={18} />
          ) : severity === "Medium" ? (
            <Bug size={18} />
          ) : (
            <ShieldCheck size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="font-medium">{title}</h4>

            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500">
              {severity}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {description}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            {file} : line {line}
          </p>
        </div>
      </div>
    </div>
  );
}

function Recommendation({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <span className="text-xs text-zinc-600">{number}</span>

      <h4 className="mt-3 font-medium">{title}</h4>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}