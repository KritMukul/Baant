import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baant",
    short_name: "Baant",
    description: "Bill ki photo kheencho, 30 second mein hisaab settle.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
