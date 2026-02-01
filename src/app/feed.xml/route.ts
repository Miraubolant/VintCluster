import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSiteByDomain, getPublishedArticles } from "@/lib/actions/blog";

// Force dynamic rendering pour détection multi-tenant
export const dynamic = "force-dynamic";

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Tronque un texte à une longueur maximale
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Génère le flux RSS pour le site courant
 */
export async function GET() {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";
  const domain = host.split(":")[0].toLowerCase().replace(/^www\./, "");

  // Récupérer le site
  const site = await getSiteByDomain(domain);

  if (!site) {
    return new NextResponse("Site not found", { status: 404 });
  }

  // Récupérer les 20 derniers articles publiés
  const articles = await getPublishedArticles(site.id, 20, 0);

  // Générer le RSS
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(site.meta_title || site.name)}</title>
    <link>https://${site.domain}</link>
    <description>${escapeXml(site.meta_description || `Blog ${site.name}`)}</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://${site.domain}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>VintCluster RSS Generator</generator>
    ${site.favicon_url ? `<image>
      <url>${site.favicon_url}</url>
      <title>${escapeXml(site.name)}</title>
      <link>https://${site.domain}</link>
    </image>` : ""}
    ${articles
      .map(
        (article) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>https://${site.domain}/blog/${article.slug}</link>
      <guid isPermaLink="true">https://${site.domain}/blog/${article.slug}</guid>
      <description><![CDATA[${truncate(article.summary || "", 300)}]]></description>
      <pubDate>${new Date(article.published_at || article.created_at || new Date()).toUTCString()}</pubDate>
      ${article.image_url ? `<enclosure url="${article.image_url}" type="image/webp" length="0"/>
      <media:content url="${article.image_url}" medium="image"/>` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
