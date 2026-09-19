import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

export type ServerStatus = "connected" | "disconnected" | "checking";

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const [lastSync, setLastSync] = useState<number | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await api.health();
      if (res && res.status === "ok") {
        setStatus("connected");
        setLastSync(Date.now());
        return true;
      }
    } catch {
      // سرور در دسترس نیست
    }
    setStatus("disconnected");
    return false;
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000); // هر 30 ثانیه چک کن
    return () => clearInterval(interval);
  }, [check]);

  return { status, lastSync, check };
}
