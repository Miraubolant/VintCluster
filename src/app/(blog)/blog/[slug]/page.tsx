import { headers } from "next/headers";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSiteByDomain,
  getArticleBySlug,
} from "@/lib/actions/blog";
import { getCachedRelatedArticles } from "@/lib/actions/related-articles";
import { ArticleContent, ArticleCard, TemplateLinkButton } from "@/components/blog";
import { isLightColor, colorWithOpacity } from "@/components/blog/TemplateContext";
import type { SiteTemplate } from "@/types/database";

// Force dynamic rendering because we use headers() for multi-tenant domain detection
export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const site = await getSiteByDomain(domain);
  if (!site) {
    return { title: "Article non trouvé" };
  }

  const article = await getArticleBySlug(site.id, slug);
  if (!article) {
    return { title: "Article non trouvé" };
  }

  // Determine base URL
  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
  const protocol = isLocalhost ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${article.title} | ${site.name}`,
    description: article.summary || article.title,
    icons: site.favicon_url
      ? {
          icon: site.favicon_url,
          shortcut: site.favicon_url,
          apple: site.favicon_url,
        }
      : undefined,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary || article.title,
      type: "article",
      siteName: site.name,
      url: `${baseUrl}/blog/${slug}`,
      locale: "fr_FR",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at || undefined,
      images: article.image_url
        ? [{ url: article.image_url, alt: article.image_alt || article.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary || article.title,
      images: article.image_url ? [article.image_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const site = await getSiteByDomain(domain);
  if (!site) {
    notFound();
  }

  const article = await getArticleBySlug(site.id, slug);
  if (!article) {
    notFound();
  }

  const template = (site.template || "brutal") as SiteTemplate;
  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  // Récupérer les articles liés sémantiquement
  const relatedArticles = await getCachedRelatedArticles(article.id, 3);

  // Template-specific styles
  const getPageBgClass = () => {
    switch (template) {
      case "fresh":
        return "bg-gray-950";
      case "magazine":
        return "bg-gray-50";
      default:
        return "bg-white";
    }
  };

  const getBreadcrumbClass = () => {
    switch (template) {
      case "brutal":
        return "bg-white border-b-[4px] border-black";
      case "minimal":
        return "bg-white border-b border-gray-100";
      case "magazine":
        return "bg-white border-b-4";
      case "tech":
        return "bg-white border-b border-gray-200";
      case "fresh":
        return "bg-gray-900 border-b border-gray-800";
      default:
        return "";
    }
  };

  const getBreadcrumbStyle = (): React.CSSProperties => {
    if (template === "magazine") {
      return { borderColor: primaryColor };
    }
    return {};
  };

  const getLinkClass = () => {
    switch (template) {
      case "brutal":
        return "group inline-flex items-center gap-2 font-bold text-black hover:underline decoration-2 underline-offset-2";
      case "minimal":
        return "text-gray-500 hover:text-gray-900 transition-colors";
      case "magazine":
        return "font-bold text-gray-900 hover:underline";
      case "tech":
        return "text-gray-600 hover:text-gray-900 transition-colors";
      case "fresh":
        return "text-gray-400 hover:text-white transition-colors";
      default:
        return "";
    }
  };

  const getSeparatorClass = () => {
    switch (template) {
      case "brutal":
        return "text-black font-bold";
      case "fresh":
        return "text-gray-600";
      default:
        return "text-gray-400";
    }
  };

  const getCurrentPageClass = () => {
    switch (template) {
      case "brutal":
        return "text-gray-600 truncate max-w-[200px] md:max-w-xs font-medium";
      case "fresh":
        return "text-gray-500 truncate max-w-[200px] md:max-w-xs";
      default:
        return "text-gray-400 truncate max-w-[200px] md:max-w-xs";
    }
  };

  const getRelatedSectionClass = () => {
    switch (template) {
      case "brutal":
        return "mt-24 relative";
      case "minimal":
        return "mt-20 pt-16 border-t border-gray-100";
      case "magazine":
        return "mt-20 pt-12 border-t-4";
      case "tech":
        return "mt-20 pt-12 bg-gray-50 -mx-4 px-4 rounded-3xl";
      case "fresh":
        return "mt-20 pt-12 border-t border-gray-800";
      default:
        return "";
    }
  };

  const getRelatedTitleClass = () => {
    switch (template) {
      case "brutal":
        return "text-2xl md:text-3xl font-black uppercase text-black tracking-tight";
      case "minimal":
        return "text-xl font-light text-gray-800";
      case "magazine":
        return "text-2xl font-extrabold text-gray-900";
      case "tech":
        return "text-xl font-semibold text-gray-900";
      case "fresh":
        return "text-2xl font-bold text-white";
      default:
        return "";
    }
  };

  return (
    <div className={`relative ${getPageBgClass()}`}>
      {/* Breadcrumb */}
      <nav className={getBreadcrumbClass()} style={getBreadcrumbStyle()}>
        <div className="container mx-auto px-4 py-4">
          <ol className="flex items-center gap-2 text-sm flex-wrap">
            <li>
              <Link href="/" className={getLinkClass()}>
                {template === "brutal" && (
                  <div
                    className="w-4 h-4 border-2 border-black group-hover:rotate-45 transition-transform"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
                Accueil
              </Link>
            </li>
            <li className={getSeparatorClass()}>/</li>
            <li>
              <Link href="/blog" className={getLinkClass()}>
                Blog
              </Link>
            </li>
            <li className={getSeparatorClass()}>/</li>
            <li className={getCurrentPageClass()}>
              {article.title}
            </li>
          </ol>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Article Content */}
        <ArticleContent
          article={article}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />

        {/* Back Link */}
        <div className="max-w-4xl mx-auto mt-20 relative">
          {/* Decorative line for brutal */}
          {template === "brutal" && (
            <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-black -translate-y-1/2" />
          )}

          <div className={`relative ${template === "brutal" ? "flex justify-start" : "flex justify-center"}`}>
            {template === "brutal" ? (
              <Link
                href="/blog"
                className="group inline-flex items-center gap-0 bg-white"
              >
                <div
                  className="px-4 py-3 border-[5px] border-black border-r-0 flex items-center group-hover:bg-black group-hover:text-white transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-xl font-black group-hover:-translate-x-1 transition-transform inline-block">←</span>
                </div>
                <span className="px-6 py-3 font-black uppercase text-sm tracking-wider bg-white border-[5px] border-black transition-all group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
                  Retour aux articles
                </span>
              </Link>
            ) : (
              <TemplateLinkButton
                href="/blog"
                template={template}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                variant={template === "minimal" ? "ghost" : "primary"}
              >
                <span>←</span>
                <span>Retour aux articles</span>
              </TemplateLinkButton>
            )}
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section
            className={getRelatedSectionClass()}
            style={template === "magazine" ? { borderColor: primaryColor } : {}}
          >
            {/* Section background decoration for brutal */}
            {template === "brutal" && (
              <div className="absolute -inset-x-4 -inset-y-8 bg-gray-50 border-y-[4px] border-black -z-10" />
            )}

            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className={`flex items-center gap-4 mb-10 ${template === "minimal" ? "justify-center" : ""}`}>
                {template === "brutal" && (
                  <div
                    className="w-14 h-14 flex items-center justify-center border-[5px] border-black rotate-45"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <span className="text-2xl font-black text-white -rotate-45">+</span>
                  </div>
                )}
                {template === "fresh" && (
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      boxShadow: `0 8px 30px ${colorWithOpacity(primaryColor, 0.3)}`,
                    }}
                  >
                    <span className="text-xl font-bold text-white">+</span>
                  </div>
                )}
                <div className={template === "brutal" ? "flex-1" : ""}>
                  <h2 className={getRelatedTitleClass()}>
                    Articles similaires
                  </h2>
                  {template === "brutal" && (
                    <div
                      className="h-[5px] mt-2 w-32"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </div>
              </div>

              {/* Grid */}
              <div className={`grid gap-6 ${
                template === "brutal" || template === "magazine"
                  ? "grid-cols-1 md:grid-cols-12"
                  : "grid-cols-1 md:grid-cols-3"
              }`}>
                {relatedArticles.map((relatedArticle, index) => {
                  if (template === "brutal" || template === "magazine") {
                    const spans = ["md:col-span-5", "md:col-span-4", "md:col-span-3"];
                    const colSpan = spans[index] || "md:col-span-4";

                    return (
                      <div key={relatedArticle.id} className={`${colSpan} relative`}>
                        {relatedArticle.reason && template === "brutal" && (
                          <div
                            className="absolute -top-3 left-4 z-10 px-3 py-1 text-xs font-bold uppercase border-[3px] border-black bg-white"
                            style={{ boxShadow: `2px 2px 0px 0px ${primaryColor}` }}
                          >
                            {relatedArticle.reason}
                          </div>
                        )}
                        <ArticleCard
                          article={relatedArticle}
                          primaryColor={primaryColor}
                          secondaryColor={secondaryColor}
                        />
                      </div>
                    );
                  }

                  return (
                    <ArticleCard
                      key={relatedArticle.id}
                      article={relatedArticle}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                    />
                  );
                })}
              </div>

              {/* View all link */}
              <div className="text-center mt-10">
                <Link
                  href="/blog"
                  className={`inline-flex items-center gap-2 text-sm ${
                    template === "brutal"
                      ? "font-bold uppercase tracking-wider text-black hover:gap-4"
                      : template === "fresh"
                      ? "font-bold text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                  } transition-all`}
                >
                  <span>Voir tous les articles</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* JSON-LD Structured Data - BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Accueil",
                item: `https://${domain}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `https://${domain}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: article.title,
                item: `https://${domain}/blog/${slug}`,
              },
            ],
          }),
        }}
      />

      {/* JSON-LD Structured Data - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.summary || "",
            image: article.image_url || undefined,
            datePublished: article.published_at,
            dateModified: article.updated_at || article.published_at,
            author: {
              "@type": "Organization",
              name: site.name,
              url: `https://${domain}`,
            },
            publisher: {
              "@type": "Organization",
              name: site.name,
              url: `https://${domain}`,
              logo: site.logo_url ? {
                "@type": "ImageObject",
                url: site.logo_url,
              } : undefined,
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://${domain}/blog/${slug}`,
            },
          }),
        }}
      />

      {/* JSON-LD Structured Data - FAQ (séparé) */}
      {article.faq && Array.isArray(article.faq) && article.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            }),
          }}
        />
      )}
    </div>
  );
}
