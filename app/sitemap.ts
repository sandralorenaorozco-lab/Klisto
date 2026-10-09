import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/politica-de-datos", "/demo"].map((path) => ({ url: `${SITE_URL}${path}` }));
}
