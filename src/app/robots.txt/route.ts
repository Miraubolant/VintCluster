import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";
  const domain = host.split(":")[0];

  // Use HTTPS for production, HTTP for localhost
  const protocol = domain === "localhost" || domain === "127.0.0.1" ? "http" : "https";
  const baseUrl = `${protocol}://${domain}`;

  const robotsTxt = `# Robots.txt for ${domain}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
