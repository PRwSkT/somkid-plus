import "server-only";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Database-backed fixed-window rate limiter. Works across serverless
 * instances. If the database is unavailable it falls back to allowing the
 * request (availability over strictness) except when `failClosed` is set.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  failClosed = false
): Promise<RateLimitResult> {
  const supabase = getAdminSupabaseClient();
  const open = { allowed: !failClosed, remaining: 0, retryAfterSec: 60 };
  if (!supabase) return open;

  try {
    const now = Date.now();
    const { data } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    const resetAt = data ? new Date(data.reset_at).getTime() : 0;
    if (!data || resetAt <= now) {
      const { error } = await supabase.from("rate_limits").upsert({
        key,
        count: 1,
        reset_at: new Date(now + windowMs).toISOString(),
      });
      if (error) return open;
      return { allowed: true, remaining: max - 1, retryAfterSec: 0 };
    }

    if (data.count >= max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.ceil((resetAt - now) / 1000),
      };
    }

    await supabase
      .from("rate_limits")
      .update({ count: data.count + 1 })
      .eq("key", key);
    return {
      allowed: true,
      remaining: max - data.count - 1,
      retryAfterSec: 0,
    };
  } catch {
    return open;
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from("rate_limits").delete().eq("key", key);
  } catch {
    // ignore
  }
}

export function clientIp(request: Request): string {
  const nf = request.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
