import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskFlow — Offline-First Workspace",
    short_name: "TaskFlow",
    description: "Create, edit, and sync tasks even without internet.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b14",
    theme_color: "#3b66f5",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}