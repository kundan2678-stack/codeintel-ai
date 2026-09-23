import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  GitPullRequest,
  Bug,
  Gauge,
  Code2,
  BrainCircuit,
} from "lucide-react";

const features = [
  {
    icon: GitPullRequest,
    title: "AI Pull Request Review",
    description:
      "Automatically analyze pull requests and receive actionable code review suggestions.",
  },
  {
    icon: ShieldCheck,
    title: "Security Analysis",
    description:
      "Detect common security vulnerabilities, risky patterns and potential secrets.",
  },
  {
    icon: Gauge,
    title: "Complexity Analysis",
    description:
      "Understand code complexity, maintainability and performance bottlenecks.",
  },
  {
    icon: BrainCircuit,
    title: "Developer Intelligence",
    description:
      "Turn repository activity and code metrics into useful engineering insights.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
            <Code2 size={20} />
          </div>

          <span className="text-xl font-semibold tracking-tight">
            CodeIntel<span className="text-zinc-500"> AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#security" className="transition hover:text-white">
            Security
          </a>
        </div>

        <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10">
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-10 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center md:pt-28">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            <Sparkles size={15} />
            AI-powered developer intelligence
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">
            Understand your code.
            <br />
            <span className="text-zinc-500">Build better software.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
            CodeIntel AI analyzes your repositories, reviews your code,
            detects security issues and helps you become a better developer.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button className="group flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200">
              Analyze Repository
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </button>

           <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold transition hover:bg-white/10">
  Connect GitHub
</button>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d11] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <div className="h-3 w-3 rounded-full bg-red-400/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
            <div className="h-3 w-3 rounded-full bg-green-400/70" />
            <span className="ml-4 text-xs text-zinc-500">
              CodeIntel Dashboard
            </span>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-4">
            <Metric title="Code Quality" value="84" />
            <Metric title="Security" value="91" />
            <Metric title="Performance" value="76" />
            <Metric title="Maintainability" value="88" />
          </div>

          <div className="grid gap-6 border-t border-white/10 p-6 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-medium">Code Quality Trend</span>
                <span className="text-sm text-zinc-500">Last 30 days</span>
              </div>

              <div className="flex h-48 items-end gap-2">
                {[35, 42, 38, 51, 48, 61, 58, 72, 69, 84].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-white/20 transition hover:bg-white/40"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 font-medium">Recent Findings</div>

              <div className="space-y-3">
                <Finding
                  icon={<Bug size={16} />}
                  title="Potential SQL injection"
                  severity="High"
                />
                <Finding
                  icon={<Gauge size={16} />}
                  title="High complexity function"
                  severity="Medium"
                />
                <Finding
                  icon={<ShieldCheck size={16} />}
                  title="Missing input validation"
                  severity="Low"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-zinc-500">CORE FEATURES</p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            One platform for
            <br />
            smarter engineering.
          </h2>

          <p className="mt-5 text-zinc-400">
            From security analysis to AI-powered code reviews, CodeIntel gives
            developers a deeper understanding of their software.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition hover:-translate-y-1 hover:bg-white/[0.04]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Icon size={20} />
                </div>

                <h3 className="text-xl font-semibold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500">HOW IT WORKS</p>

            <h2 className="mt-3 text-4xl font-bold">
              From repository to intelligence.
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Step number="01" title="Connect GitHub">
              Connect your repository and securely import your project.
            </Step>

            <Step number="02" title="Analyze Code">
              Static analysis, security scanning and AI review work together.
            </Step>

            <Step number="03" title="Improve">
              Get clear insights, recommendations and engineering metrics.
            </Step>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-14">
          <ShieldCheck size={32} />

          <h2 className="mt-6 max-w-2xl text-4xl font-bold">
            Engineering intelligence without losing sight of security.
          </h2>

          <p className="mt-5 max-w-2xl leading-7 text-zinc-400">
            CodeIntel is designed around secure repository analysis, structured
            findings and transparent engineering insights.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-4xl font-bold md:text-5xl">
          Build better. Review smarter.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-zinc-400">
          Start building your developer intelligence workspace with CodeIntel
          AI.
        </p>

        <button className="mt-8 rounded-xl bg-white px-7 py-3 font-semibold text-black transition hover:bg-zinc-200">
          Get Started
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <span>© 2026 CodeIntel AI</span>
          <span>AI-powered developer intelligence platform</span>
        </div>
      </footer>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-zinc-600">/ 100</p>
    </div>
  );
}

function Finding({
  icon,
  title,
  severity,
}: {
  icon: React.ReactNode;
  title: string;
  severity: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-zinc-400">{icon}</div>

      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">Code analysis finding</p>
      </div>

      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
        {severity}
      </span>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold">
        {number}
      </div>

      <h3 className="mt-5 text-xl font-semibold">{title}</h3>

      <p className="mx-auto mt-3 max-w-sm leading-7 text-zinc-400">
        {children}
      </p>
    </div>
  );
}