import type { MetadataRoute } from "next";

const BASE = "https://www.staychakwal.de";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              BASE,
      lastModified:     new Date(),
      changeFrequency:  "weekly",
      priority:         1.0,
    },
    {
      url:              `${BASE}/rooms`,
      lastModified:     new Date(),
      changeFrequency:  "weekly",
      priority:         0.9,
    },
    {
      url:              `${BASE}/book`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.8,
    },
  ];
}
