"use client";
import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // ⚠️ Skip SW in development to avoid hydration mismatches
    // from stale cached HTML. SW runs normally in production (Vercel).
    if (process.env.NODE_ENV !== "production") {
      // Also unregister any existing SW to clean up old cache
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (e) {
        console.warn("SW registration failed", e);
      }
    };

    register();

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_NOW") {
        window.dispatchEvent(new CustomEvent("app:sync-now"));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return null;
}