import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const BASE = siteConfig.url;
const NOW  = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Core pages
    { url: BASE,                 lastModified: NOW, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/rooms`,      lastModified: NOW, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/book`,       lastModified: NOW, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/about`,      lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/contact`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/location`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/gallery`,    lastModified: NOW, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/privacy-policy`, lastModified: NOW, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,          lastModified: NOW, changeFrequency: "yearly",  priority: 0.3 },

    // Blog
    { url: `${BASE}/blog`,                                         lastModified: NOW, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/blog/places-to-visit-chakwal`,                 lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog/best-family-guest-house-chakwal`,         lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog/chakwal-travel-guide`,                    lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog/katas-raj-temples-visitor-guide`,         lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog/where-to-stay-chakwal`,                   lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
  ];
}
