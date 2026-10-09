import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KO Systems" },
      {
        name: "description",
        content:
          "Sistemas e softwares personalizados para organizar operações, automatizar processos e acelerar negócios.",
      },
      { property: "og:title", content: "KO Systems" },
      {
        property: "og:description",
        content: "Tecnologia construída a partir do desafio real da sua empresa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://kosystems.com.br/" },
      { property: "og:image", content: "https://kosystems.com.br/brand/ko-systems-light.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kosystems.com.br/" }],
  }),
  component: LandingPage,
});
