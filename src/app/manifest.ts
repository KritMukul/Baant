import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dibs",
    short_name: "Dibs",
    description: "Call dibs on what you ate. Photograph the bill, share a link, everyone pays their own share.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f4fb",
    theme_color: "#f5f4fb",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
