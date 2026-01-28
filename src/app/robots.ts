import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";
  const domain = host.split(":")[0];

  // Use HTTPS for production, HTTP for localhost
  const protocol = domain === "localhost" || domain === "127.0.0.1" ? "http" : "https";
  const baseUrl = `${protocol}://${domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
