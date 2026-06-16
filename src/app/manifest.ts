import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IdeaHub",
    short_name: "IdeaHub",
    description: "アイデアを記録して実行につなげるサービス",
    start_url: "/ideas/new",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
