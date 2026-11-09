"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signOut } from "@/lib/auth/client";
import type { CurrentUser } from "@/lib/auth/server";

type Props = {
  user: CurrentUser;
};

export function ProfileDropdown({ user }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  };

  // Get initials for avatar
  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        style={{
          background: user.avatarUrl
            ? `url(${user.avatarUrl}) center/cover`
            : "var(--surface-muted)",
        }}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {!user.avatarUrl && (
          <span className="text-xs font-semibold text-foreground">{initials}</span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border bg-surface shadow-lg"
          role="menu"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
            <p className="mt-0.5 text-xs text-muted">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
              role="menuitem"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-muted"
                aria-hidden="true"
              >
                <path
                  d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9.5c-2.67 0-8 1.34-8 4v1.5h16v-1.5c0-2.66-5.33-4-8-4z"
                  fill="currentColor"
                />
              </svg>
              My Profile
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted disabled:opacity-50"
              role="menuitem"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-muted"
                aria-hidden="true"
              >
                <path
                  d="M6 14H3.33A1.33 1.33 0 012 12.67V3.33A1.33 1.33 0 013.33 2H6M10.67 11.33L14 8m0 0L10.67 4.67M14 8H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {signingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
