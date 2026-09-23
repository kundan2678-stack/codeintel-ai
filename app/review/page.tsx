"use client";

import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  Code2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const issues = [
  {
    id: 1,
    severity: "High",
    title: "Potential SQL Injection",
    file: "src/api/users.ts",
    line: 42,
    description:
      "User-controlled input is being directly inserted into a SQL query.",
  },
  {
    id: 2,
    severity: "Medium",
    title: "High Complexity",
    file: "src/services/auth.ts",
    line: 87,
    description:
      "This function contains multiple conditional branches and may be difficult to maintain.",
  },
  {
    id: 3,
    severity: "Low",
    title: "Missing Input Validation",
    file: "src/api/profile.ts",
    line: 21,
    description:
      "Incoming request data should be validated before processing.",
  },
];

export default function ReviewPage() {
  const [selectedIssue, setSelectedIssue] = useState(issues[0]);

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/analysis"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <ArrowLeft size={17} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Code2 size={18} />

                <h1 className="font-semibold">
                  AI Code Review
                </h1>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                codeintel-ai / src / api / users.ts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 sm:block">
              AI Analysis Complete
            </span>

            <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
              <Sparkles size={15} />
              Review Again
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Bug size={18} />}
            title="Issues Found"
            value="3"
          />

          <Stat
            icon={<ShieldAlert size={18} />}
            title="Security Issues"
            value="1"
          />

          <Stat
            icon={<Zap size={18} />}
            title="Performance"
            value="76"
          />

          <Stat
            icon={<CheckCircle2 size={18} />}
            title="Review Score"
            value="84"
          />
        </div>
      </section>

      {/* Main Review Workspace */}
      <section className="mx-auto max-w-[1600px] px-6 pb-10">
        <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-white/10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Code Editor */}
          <div className="flex flex-col border-b border-white/10 bg-[#0b0b0f] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-zinc-500" />

                <span className="text-sm font-medium">
                  users.ts
                </span>
              </div>

              <span className="text-xs text-zinc-600">
                TypeScript
              </span>
            </div>

            <div className="flex-1 overflow-auto p-5 font-mono text-sm leading-7">
              <CodeLine number="1">
                <span className="text-purple-400">import</span>{" "}
                <span className="text-zinc-300">
                  {"{ db }"}
                </span>{" "}
                <span className="text-purple-400">from</span>{" "}
                <span className="text-green-400">
                  "@/lib/database"
                </span>
              </CodeLine>

              <CodeLine number="2">
                {" "}
              </CodeLine>

              <CodeLine number="3">
                <span className="text-purple-400">export async function</span>{" "}
                <span className="text-blue-400">
                  getUser
                </span>
                <span className="text-zinc-300">
                  (id: string) {"{"}
                </span>
              </CodeLine>

              <CodeLine number="4">
                <span className="text-purple-400">const</span>{" "}
                <span className="text-zinc-300">
                  query =
                </span>
              </CodeLine>

              <CodeLine number="5">
                <span className="text-zinc-300">
                  {"  "}SELECT * FROM users WHERE id = '
                </span>
                <span className="rounded bg-red-500/20 px-1 text-red-300">
                  ${"id"}
                </span>
                <span className="text-zinc-300">
                  '
                </span>
              </CodeLine>

              <CodeLine number="6">
                {" "}
              </CodeLine>

              <CodeLine number="7">
                <span className="text-purple-400">return</span>{" "}
                <span className="text-zinc-300">
                  db.query(query)
                </span>
              </CodeLine>

              <CodeLine number="8">
                <span className="text-zinc-300">{"}"}</span>
              </CodeLine>

              <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-red-300">
                  <ShieldAlert size={16} />
                  Security issue detected on line 5
                </div>

                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  User input appears to be directly interpolated into
                  a database query.
                </p>
              </div>
            </div>
          </div>

          {/* AI Review Panel */}
          <div className="flex flex-col bg-[#09090c]">
            <div className="border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={17} />

                <span className="text-sm font-medium">
                  AI Review
                </span>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Intelligent analysis of your code
              </p>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {/* Issue selector */}
              <div className="space-y-2">
                {issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedIssue.id === issue.id
                        ? "border-white/20 bg-white/[0.06]"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {issue.severity === "High" ? (
                          <ShieldAlert size={16} />
                        ) : issue.severity === "Medium" ? (
                          <Bug size={16} />
                        ) : (
                          <Lightbulb size={16} />
                        )}

                        <span className="text-sm font-medium">
                          {issue.title}
                        </span>
                      </div>

                      <span className="text-xs text-zinc-500">
                        {issue.severity}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-zinc-600">
                      {issue.file}:{issue.line}
                    </p>
                  </button>
                ))}
              </div>

              {/* Selected Issue */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={17} />

                  <h3 className="font-semibold">
                    AI Explanation
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {selectedIssue.description}
                </p>

                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                    Location
                  </p>

                  <p className="mt-2 font-mono text-xs text-zinc-400">
                    {selectedIssue.file}:{selectedIssue.line}
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2">
                  <Lightbulb size={17} />

                  <h3 className="font-semibold">
                    Suggested Improvement
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  Use parameterized queries or a trusted ORM method
                  instead of directly interpolating user-controlled
                  values into SQL statements.
                </p>

                <button className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                  Generate Suggested Fix
                </button>
              </div>

              {/* Confidence */}
              <div className="mt-4 rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    AI confidence
                  </span>

                  <span className="font-medium">
                    94%
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: "94%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {icon}
        {title}
      </div>

      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function CodeLine({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-max">
      <span className="mr-6 inline-block w-6 select-none text-right text-zinc-700">
        {number}
      </span>

      <code>{children}</code>
    </div>
  );
}