"use client";

import Link from "next/link";

/**
 * Subtle prompt shown to anonymous users after completing a puzzle,
 * encouraging them to create an account to save their progress.
 */
export function SignupPrompt() {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            Want to save your streak and progress?
          </p>
          <p className="text-xs text-muted">
            Create a free account and continue your journey across devices.
          </p>
        </div>
        <Link
          href="/signup"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold hover:opacity-90"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}
