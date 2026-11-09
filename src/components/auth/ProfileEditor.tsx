"use client";

import { useState } from "react";
import { createClient } from "@/lib/auth/client";
import { validateDisplayName } from "@/lib/auth/validation";
import type { CurrentUser } from "@/lib/auth/server";

type Props = {
  user: CurrentUser;
};

export function ProfileEditor({ user }: Props) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update the auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
        },
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Also update the profile table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEditing(false);
      setLoading(false);

      // Refresh the page to show updated name
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("Failed to update profile");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Display Name
          </span>
          {editing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
            />
          ) : (
            <span className="text-lg font-semibold text-foreground">{user.displayName}</span>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
          >
            Edit
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Email</span>
        <span className="text-sm text-foreground">{user.email}</span>
      </div>

      {editing && (
        <div className="flex gap-2 border-t border-border pt-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setDisplayName(user.displayName);
              setError(null);
            }}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--tile-yellow)" }}>
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm" style={{ color: "var(--tile-green)" }}>
          Profile updated successfully!
        </p>
      )}
    </div>
  );
}
