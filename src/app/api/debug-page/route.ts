import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import type { FAQItem } from "@/types/database";

interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  image_url: string | null;
  image_alt: string | null;
  faq: FAQItem[];
  published_at: string;
  site: {
    name: string;
    domain: string;
    primary_color: string;
    secondary_color: string;
  };
}

export async function GET(request: NextRequest) {
  // Auth check - require CRON_SECRET for debug routes
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  const domain = request.nextUrl.searchParams.get("domain");
  const steps: { step: string; status: string; error?: string; data?: unknown }[] = [];

  if (!slug || !domain) {
    return NextResponse.json({ error: "Missing slug or domain parameter" }, { status: 400 });
  }

  const supabase = createPublicClient();

  try {
    // Step 1: Get site
    steps.push({ step: "1_init", status: "ok" });

    const { data: siteData, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("domain", domain.toLowerCase().replace(/^www\./, ""))
      .single();

    if (siteError || !siteData) {
      steps.push({ step: "2_site_fetch", status: "error", error: siteError?.message || "Site not found" });
      return NextResponse.json({ steps, error: "Site not found" });
    }
    steps.push({ step: "2_site_fetch", status: "ok", data: { id: siteData.id, name: siteData.name } });

    // Step 2: Get article with site relation
    const { data: articleData, error: articleError } = await supabase
      .from("articles")
      .select("*, site:sites(name, domain, primary_color, secondary_color)")
      .eq("site_id", siteData.id)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (articleError || !articleData) {
      steps.push({ step: "3_article_fetch", status: "error", error: articleError?.message || "Article not found" });
      return NextResponse.json({ steps, error: "Article not found" });
    }
    steps.push({ step: "3_article_fetch", status: "ok", data: { id: articleData.id, title: articleData.title } });

    // Step 3: Transform article data (like getArticleBySlug does)
    let article: PublicArticle;
    try {
      article = {
        id: articleData.id,
        title: articleData.title,
        slug: articleData.slug,
        content: articleData.content,
        summary: articleData.summary,
        image_url: articleData.image_url,
        image_alt: articleData.image_alt,
        faq: (articleData.faq as unknown as FAQItem[]) || [],
        published_at: articleData.published_at || articleData.created_at || "",
        site: articleData.site as PublicArticle["site"],
      };
      steps.push({ step: "4_transform_article", status: "ok" });
    } catch (e) {
      steps.push({ step: "4_transform_article", status: "error", error: e instanceof Error ? e.message : String(e) });
      return NextResponse.json({ steps, error: "Transform error" });
    }

    // Step 4: Test date formatting
    try {
      const formattedDate = new Date(article.published_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      steps.push({ step: "5_date_format", status: "ok", data: { formattedDate } });
    } catch (e) {
      steps.push({ step: "5_date_format", status: "error", error: e instanceof Error ? e.message : String(e) });
    }

    // Step 5: Test FAQ array operations
    try {
      const isFaqArray = Array.isArray(article.faq);
      const faqLength = isFaqArray ? article.faq.length : 0;

      if (isFaqArray && article.faq.length > 0) {
        // Test mapping
        const faqTest = article.faq.map((item, index) => ({
          index,
          hasQuestion: typeof item.question === "string",
          hasAnswer: typeof item.answer === "string",
          question: item.question?.substring(0, 50),
          answer: item.answer?.substring(0, 50),
        }));
        steps.push({ step: "6_faq_test", status: "ok", data: { isFaqArray, faqLength, items: faqTest } });
      } else {
        steps.push({ step: "6_faq_test", status: "ok", data: { isFaqArray, faqLength } });
      }
    } catch (e) {
      steps.push({ step: "6_faq_test", status: "error", error: e instanceof Error ? e.message : String(e) });
    }

    // Step 6: Test JSON-LD serialization for Article
    try {
      const articleJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.summary || "",
        image: article.image_url || undefined,
        datePublished: article.published_at,
        author: {
          "@type": "Organization",
          name: siteData.name,
        },
        publisher: {
          "@type": "Organization",
          name: siteData.name,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://${domain}/blog/${slug}`,
        },
      });
      steps.push({ step: "7_jsonld_article", status: "ok", data: { length: articleJsonLd.length } });
    } catch (e) {
      steps.push({ step: "7_jsonld_article", status: "error", error: e instanceof Error ? e.message : String(e) });
    }

    // Step 7: Test JSON-LD serialization for FAQ
    try {
      if (Array.isArray(article.faq) && article.faq.length > 0) {
        const faqJsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((item) => ({
            "@type": "Question",
            name: item.question || "",
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer || "",
            },
          })),
        });
        steps.push({ step: "8_jsonld_faq", status: "ok", data: { length: faqJsonLd.length } });
      } else {
        steps.push({ step: "8_jsonld_faq", status: "skipped", data: { reason: "No FAQ" } });
      }
    } catch (e) {
      steps.push({ step: "8_jsonld_faq", status: "error", error: e instanceof Error ? e.message : String(e) });
    }

    // Step 8: Test content analysis
    try {
      const contentAnalysis = {
        length: article.content?.length || 0,
        hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(article.content || ""),
        hasMarkdownLinks: /\[.*?\]\(.*?\)/.test(article.content || ""),
        hasHtmlTags: /<[^>]+>/.test(article.content || ""),
        lineCount: (article.content?.match(/\n/g) || []).length + 1,
        hasSpecialChars: /[^\x00-\x7F]/.test(article.content || ""),
      };
      steps.push({ step: "9_content_analysis", status: "ok", data: contentAnalysis });
    } catch (e) {
      steps.push({ step: "9_content_analysis", status: "error", error: e instanceof Error ? e.message : String(e) });
    }

    // All steps passed
    return NextResponse.json({
      success: true,
      steps,
      summary: {
        siteId: siteData.id,
        siteName: siteData.name,
        articleId: article.id,
        articleTitle: article.title,
        primaryColor: article.site?.primary_color,
        secondaryColor: article.site?.secondary_color,
        hasFaq: Array.isArray(article.faq) && article.faq.length > 0,
        faqCount: Array.isArray(article.faq) ? article.faq.length : 0,
        hasImage: !!article.image_url,
        contentLength: article.content?.length || 0,
      },
    });

  } catch (error) {
    steps.push({
      step: "unexpected_error",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ steps, error: "Unexpected error" }, { status: 500 });
  }
}
