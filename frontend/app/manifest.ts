import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CHKN-FIT",
    short_name: "CHKN-FIT",
    description:
      "Le suivi sportif de l'équipe : planning, séances, progression, classement.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#eb6800",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
