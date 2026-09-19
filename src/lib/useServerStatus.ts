import { useState } from "react";

export type ServerStatus = "connected" | "disconnected" | "checking";

export function useServerStatus() {
  const [status] = useState<ServerStatus>("disconnected");
  const [lastSync] = useState<number | null>(null);

  const check = () => {
    // حالت آفلاین - بدون نیاز به سرور
    return false;
  };

  return { status, lastSync, check };
}
