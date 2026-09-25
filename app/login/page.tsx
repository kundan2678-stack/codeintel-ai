"use client";

import { signIn } from "next-auth/react";
import { Code2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Code2 size={28} />
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Welcome to CodeIntel AI
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Sign in with GitHub to analyze your repositories,
            review pull requests and track engineering intelligence.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            signIn("github", {
              callbackUrl: "/dashboard",
            })
          }
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
        >
          <Code2 size={19} />
          Continue with GitHub
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <ShieldCheck size={14} />
          Secure OAuth authentication
        </div>
      </div>
    </main>
  );
}