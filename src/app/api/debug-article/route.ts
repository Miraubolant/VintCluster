import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Auth check - require CRON_SECRET for debug routes
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = request.headers.get("host") || "";
  const xCurrentHost = request.headers.get("x-current-host") || "";
  const domain = host.split(":")[0];
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

  const slug = request.nextUrl.searchParams.get("slug");

  const supabase = createPublicClient();

  // Récupérer le site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("domain", normalizedDomain)
    .single();

  if (!site) {
    return NextResponse.json({
      error: "Site not found",
      domain: normalizedDomain,
      siteError: siteError?.message,
    });
  }

  // Si pas de slug, lister les articles publiés
  if (!slug) {
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, title, slug, status, published_at")
      .eq("site_id", site.id)
      .eq("status", "published")
      .limit(10);

    return NextResponse.json({
      site: { id: site.id, name: site.name, domain: site.domain },
      publishedArticles: articles,
      articlesError: articlesError?.message,
    });
  }

  // Récupérer l'article spécifique
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("*, site:sites(name, domain, primary_color, secondary_color)")
    .eq("site_id", site.id)
    .eq("slug", slug)
    .single();

  // Vérifier le statut
  const { data: articleAnyStatus } = await supabase
    .from("articles")
    .select("id, title, slug, status")
    .eq("site_id", site.id)
    .eq("slug", slug)
    .single();

  return NextResponse.json({
    site: { id: site.id, name: site.name, domain: site.domain },
    slug,
    articleFound: !!article,
    articleError: articleError?.message,
    articleAnyStatus: articleAnyStatus,
    articleData: article ? {
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      hasContent: !!article.content,
      contentLength: article.content?.length,
      hasFaq: !!article.faq,
      faqLength: Array.isArray(article.faq) ? article.faq.length : 0,
      hasImage: !!article.image_url,
      hasSiteRelation: !!article.site,
    } : null,
  });
}
