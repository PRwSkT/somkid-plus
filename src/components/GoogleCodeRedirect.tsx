"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function GoogleCodeRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const next = searchParams.get("next") || "/mock-exam";
      const redirectUri = window.location.origin;
      window.location.href = `/auth/callback?code=${encodeURIComponent(
        code
      )}&next=${encodeURIComponent(next)}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;
    }
  }, [searchParams]);

  return null;
}
