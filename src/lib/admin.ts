import "server-only";

function allowlist(): string[] {
  const raw = process.env.SPOTLE_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = allowlist();
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export function adminAllowlistSize(): number {
  return allowlist().length;
}
