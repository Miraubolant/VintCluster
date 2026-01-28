import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const host = request.headers.get("host") || "";
  const domain = host.split(":")[0].toLowerCase().replace(/^www\./, "");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const supabase = createPublicClient();

  try {
    // 1. Récupérer le site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("domain", domain)
      .single();

    if (siteError || !site) {
      return NextResponse.json({
        step: "site_fetch",
        error: siteError?.message || "Site not found",
        domain,
      });
    }

    // 2. Récupérer l'article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*, site:sites(name, domain, primary_color, secondary_color)")
      .eq("site_id", site.id)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (articleError || !article) {
      return NextResponse.json({
        step: "article_fetch",
        error: articleError?.message || "Article not found",
        siteId: site.id,
        slug,
      });
    }

    // 3. Analyser le contenu
    const contentAnalysis = {
      length: article.content?.length || 0,
      hasContent: !!article.content,
      firstChars: article.content?.substring(0, 200) || "",
      lastChars: article.content?.substring(-200) || "",
      containsHtml: /<[^>]+>/.test(article.content || ""),
      containsScriptTag: /<script/i.test(article.content || ""),
      lineCount: (article.content?.match(/\n/g) || []).length + 1,
    };

    // 4. Analyser la FAQ
    let faqAnalysis: Record<string, unknown> = { hasFaq: false };
    if (article.faq) {
      const faqType = typeof article.faq;
      const isArray = Array.isArray(article.faq);

      faqAnalysis = {
        hasFaq: true,
        faqType,
        isArray,
        faqLength: isArray ? article.faq.length : null,
        faqRaw: JSON.stringify(article.faq).substring(0, 500),
      };

      if (isArray && article.faq.length > 0) {
        faqAnalysis.firstItem = article.faq[0];
        faqAnalysis.firstItemType = typeof article.faq[0];
        faqAnalysis.hasQuestion = "question" in (article.faq[0] || {});
        faqAnalysis.hasAnswer = "answer" in (article.faq[0] || {});
      }
    }

    // 5. Analyser la relation site
    const siteRelationAnalysis = {
      hasSiteRelation: !!article.site,
      siteRelationType: typeof article.site,
      siteRelationData: article.site,
    };

    // 6. Vérifier les champs potentiellement problématiques
    const fieldChecks = {
      title: { value: article.title, type: typeof article.title, length: article.title?.length },
      slug: { value: article.slug, type: typeof article.slug },
      summary: { value: article.summary?.substring(0, 100), type: typeof article.summary, length: article.summary?.length },
      image_url: { value: article.image_url, type: typeof article.image_url },
      image_alt: { value: article.image_alt, type: typeof article.image_alt },
      published_at: { value: article.published_at, type: typeof article.published_at },
      status: { value: article.status, type: typeof article.status },
    };

    // 7. Tester la sérialisation JSON
    let jsonSerializationOk = true;
    let jsonError = null;
    try {
      JSON.stringify(article);
    } catch (e) {
      jsonSerializationOk = false;
      jsonError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      success: true,
      domain,
      site: { id: site.id, name: site.name },
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      },
      contentAnalysis,
      faqAnalysis,
      siteRelationAnalysis,
      fieldChecks,
      jsonSerialization: { ok: jsonSerializationOk, error: jsonError },
    });

  } catch (error) {
    return NextResponse.json({
      step: "unexpected_error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
