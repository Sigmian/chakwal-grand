"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Silently refreshes the server component every 30 seconds so new orders appear automatically.
export function OrdersRefresher() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
