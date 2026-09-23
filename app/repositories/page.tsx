import {
  Search,
  GitBranch,
  Star,
  GitPullRequest,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";

const repositories = [
  {
    name: "ai-stock-analyzer",
    description: "AI-powered stock analysis and market intelligence platform.",
    language: "Python",
    stars: 12,
    branches: 8,
    quality: 91,
    security: 94,
  },
  {
    name: "codeintel-ai",
    description: "AI-powered code review and developer intelligence platform.",
    language: "TypeScript",
    stars: 7,
    branches: 5,
    quality: 86,
    security: 92,
  },
  {
    name: "placement-prediction",
    description: "Machine learning based student placement analysis system.",
    language: "Python",
    stars: 5,
    branches: 3,
    quality: 82,
    security: 88,
  },
  {
    name: "java-dsa",
    description: "Data structures and algorithms practice repository.",
    language: "Java",
    stars: 3,
    branches: 4,
    quality: 78,
    security: 90,
  },
];

export default function RepositoriesPage() {
  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-zinc-500">CodeIntel AI</p>
            <h1 className="mt-1 text-2xl font-bold">Repositories</h1>
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
            <h2 className="text-xl font-semibold">Your repositories</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Analyze your GitHub projects with CodeIntel AI.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 md:max-w-sm">
            <Search size={18} className="text-zinc-500" />

            <input
              type="text"
              placeholder="Search repositories..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Repository Grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {repositories.map((repo) => (
            <div
              key={repo.name}
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
                      <h3 className="font-semibold">{repo.name}</h3>

                      <p className="mt-1 text-xs text-zinc-600">
                        GitHub Repository
                      </p>
                    </div>
                  </div>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">
                  {repo.language}
                </span>
              </div>

              {/* Description */}
              <p className="mt-5 min-h-12 text-sm leading-6 text-zinc-500">
                {repo.description}
              </p>

              {/* GitHub Stats */}
              <div className="mt-5 flex gap-5 border-y border-white/10 py-4 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Star size={15} />
                  {repo.stars}
                </div>

                <div className="flex items-center gap-2">
                  <GitBranch size={15} />
                  {repo.branches} branches
                </div>

                <div className="flex items-center gap-2">
                  <GitPullRequest size={15} />
                  PR ready
                </div>
              </div>

              {/* Scores */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Score
                  icon={<ShieldCheck size={16} />}
                  title="Security"
                  value={repo.security}
                />

                <Score
                  icon={<ShieldCheck size={16} />}
                  title="Code Quality"
                  value={repo.quality}
                />
              </div>

              {/* Action */}
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium transition hover:bg-white/10">
                Analyze Repository
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </button>
            </div>
          ))}
        </div>
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
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {icon}
        {title}
      </div>

      <div className="mt-2 flex items-end gap-1">
        <span className="text-2xl font-bold">{value}</span>

        <span className="mb-1 text-xs text-zinc-600">/100</span>
      </div>
    </div>
  );
}