"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function run(payload: Record<string, string>, endpoint: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/market");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup") {
      await run({ email, username, password }, "/api/auth/register");
    } else {
      await run({ identifier, password }, "/api/auth/login");
    }
  }

  function demoLogin() {
    run({ identifier: "demo", password: "demo1234" }, "/api/auth/login");
  }

  return (
    <div className="card w-full max-w-md p-7">
      <h1 className="text-2xl font-bold text-white">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        {mode === "signup"
          ? "Start with $10,000 in play money."
          : "Sign in to keep trading."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" ? (
          <>
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Username">
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="traderjoe"
              />
            </Field>
          </>
        ) : (
          <Field label="Email or username">
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input"
              placeholder="demo"
            />
          </Field>
        )}
        <Field label="Password">
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>

      {mode === "login" && (
        <button
          onClick={demoLogin}
          disabled={loading}
          className="btn-ghost mt-3 w-full"
        >
          Try the demo account
        </button>
      )}

      <p className="mt-6 text-center text-sm text-zinc-400">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to FANDX?{" "}
            <Link href="/signup" className="font-semibold text-violet-300 hover:text-violet-200">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
