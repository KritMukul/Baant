import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dibs",
    short_name: "Dibs",
    description: "Call dibs on what you ate. Split the bill fairly.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
