"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UNIverseLogo } from "@/components/UNIverseLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = "data-wipe-notice-first-seen";
    const stored = localStorage.getItem(key);

    if (stored === null) {
      localStorage.setItem(key, Date.now().toString());
      setShowNotice(true);
    } else {
      const firstSeen = parseInt(stored, 10);
      if (Date.now() - firstSeen < 172800000) {
        setShowNotice(true);
      }
    }
  }, []);

  const dismissNotice = () => {
    setShowNotice(false);
    setTimeout(() => emailRef.current?.focus(), 100);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      let loginEmail = email;

      if (!email.includes("@")) {
        const resolveResponse = await fetch("/api/auth/resolve-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email }),
        });

        if (!resolveResponse.ok) {
          setError("User not found");
          setLoading(false);
          return;
        }

        const { email: resolvedEmail } = await resolveResponse.json();
        loginEmail = resolvedEmail;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <UNIverseLogo size={48} />
          <h1 className="text-2xl font-bold mt-4">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email or Username
            </label>
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                ref={emailRef}
                className="w-full px-4 py-2.5 bg-bg-overlay border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="you@example.com or username"
              />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-bg-overlay border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary-light hover:text-primary transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>

    {showNotice && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative max-w-md w-full rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <h2 className="text-xl font-bold text-zinc-100 mb-3">Important Notice</h2>
          <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
            Due to a major refactor, our development team had to revise the entire database.{" "}
            Unfortunately, this process resulted in the deletion of all data and accounts.{" "}
            We sincerely apologize for the inconvenience.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="w-full px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg"
            >
              Create New Account
            </button>
            <button
              type="button"
              onClick={dismissNotice}
              className="w-full px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              I already have an account
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
