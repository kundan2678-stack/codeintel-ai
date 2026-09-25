import {
  Code2,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Gauge,
  GitPullRequest,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const metrics = [
  {
    title: "Code Quality",
    value: "84",
    label: "/ 100",
  },
  {
    title: "Security",
    value: "91",
    label: "/ 100",
  },
  {
    title: "Performance",
    value: "76",
    label: "/ 100",
  },
  {
    title: "Maintainability",
    value: "88",
    label: "/ 100",
  },
];

const findings = [
  {
    title: "Potential SQL injection",
    type: "Security",
    severity: "High",
  },
  {
    title: "High complexity function",
    type: "Performance",
    severity: "Medium",
  },
  {
    title: "Missing input validation",
    type: "Code Quality",
    severity: "Low",
  },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
              <Code2 size={20} />
            </div>

            <div>
              <h1 className="font-semibold">CodeIntel AI</h1>
              <p className="text-xs text-zinc-500">
                Developer Intelligence
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
            KS
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <div>
          <p className="text-sm text-zinc-500">Developer Dashboard</p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Good morning, Kundan 👋
          </h2>

          <p className="mt-2 text-zinc-400">
            Here is an overview of your engineering intelligence.
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <p className="text-sm text-zinc-500">{metric.title}</p>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold">
                  {metric.value}
                </span>

                <span className="mb-1 text-sm text-zinc-600">
                  {metric.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Quality Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Code Quality Trend</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Repository quality over the last 30 days
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                30 Days
              </span>
            </div>

            <div className="mt-10 flex h-56 items-end gap-3">
              {[35, 42, 38, 51, 48, 61, 58, 72, 69, 84].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-lg bg-white/20 transition hover:bg-white/40"
                    style={{ height: `${height}%` }}
                  />
                ),
              )}
            </div>
          </div>

          {/* Developer Score */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-semibold">Developer Score</h3>

            <div className="mt-8 flex items-center justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-white/10">
                <div className="text-center">
                  <p className="text-4xl font-bold">84</p>
                  <p className="text-xs text-zinc-500">/ 100</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Strong engineering profile
            </p>
          </div>
        </div>

        {/* Findings */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
    <div className="flex items-start gap-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <BrainCircuit size={22} />
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Developer Intelligence
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Understand your engineering profile
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Analyze code quality, security, performance,
          maintainability, strengths and areas for improvement.
        </p>
      </div>
    </div>

    <a
      href="/developer-intelligence"
      className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
    >
        View Intelligence
        <ArrowRight size={16} />
        </a>
        </div>
      </section>


        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Recent Findings</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Issues detected during code analysis
              </p>
            </div>

            <button className="text-sm text-zinc-400 transition hover:text-white">
              View all
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {findings.map((finding) => (
              <div
                key={finding.title}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  {finding.type === "Security" ? (
                    <ShieldCheck size={18} />
                  ) : finding.type === "Performance" ? (
                    <Gauge size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {finding.title}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {finding.type}
                  </p>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                  {finding.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Action
            icon={<GitPullRequest size={19} />}
            title="Review Pull Request"
            description="Analyze a GitHub pull request with AI."
          />

          <Action
            icon={<ShieldCheck size={19} />}
            title="Security Scan"
            description="Scan your repository for vulnerabilities."
          />

          <Action
            icon={<CheckCircle2 size={19} />}
            title="Code Health"
            description="Review your overall engineering health."
          />
        </div>
      </section>
    </main>
  );
}

function Action({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:-translate-y-1 hover:bg-white/[0.04]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        {icon}
      </div>

      <h3 className="mt-5 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}