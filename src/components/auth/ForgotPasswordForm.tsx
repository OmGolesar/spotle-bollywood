"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/auth/client";
import { validateEmail } from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error!);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to show success message
      window.location.href = "/forgot-password?sent=1";
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-muted">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
          className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--tile-yellow)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-muted hover:text-foreground">
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
