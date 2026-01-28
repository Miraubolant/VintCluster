import { headers } from "next/headers";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSiteByDomain,
  getArticleBySlug,
  getAllArticleSlugs,
  getPublishedArticles,
} from "@/lib/actions/blog";
import { ArticleContent, ArticleCard } from "@/components/blog";

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

  return {
    title: `${article.title} | ${site.name}`,
    description: article.summary || article.title,
    openGraph: {
      title: article.title,
      description: article.summary || article.title,
      type: "article",
      publishedTime: article.published_at,
      images: article.image_url ? [article.image_url] : undefined,
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

  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  // Récupérer les articles liés (autres articles récents)
  const relatedArticles = await getPublishedArticles(site.id, 4);
  const filteredRelated = relatedArticles.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="relative">
      {/* Breadcrumb */}
      <nav className="bg-white border-b-[4px] border-black">
        <div className="container mx-auto px-4 py-4">
          <ol className="flex items-center gap-2 text-sm flex-wrap">
            <li>
              <Link
                href="/"
                className="group inline-flex items-center gap-2 font-bold text-black hover:underline decoration-2 underline-offset-2"
              >
                <div
                  className="w-4 h-4 border-2 border-black group-hover:rotate-45 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                />
                Accueil
              </Link>
            </li>
            <li className="text-black font-bold">/</li>
            <li>
              <Link
                href="/blog"
                className="font-bold text-black hover:underline decoration-2 underline-offset-2"
              >
                Blog
              </Link>
            </li>
            <li className="text-black font-bold">/</li>
            <li className="text-gray-600 truncate max-w-[200px] md:max-w-xs font-medium">
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
          {/* Decorative line */}
          <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-black -translate-y-1/2" />

          <div className="relative flex justify-start">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-0 bg-white"
            >
              <div
                className="px-4 py-3 border-[5px] border-black border-r-0 flex items-center group-hover:bg-black group-hover:text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-xl font-black group-hover:-translate-x-1 transition-transform inline-block">&larr;</span>
              </div>
              <span className="px-6 py-3 font-black uppercase text-sm tracking-wider bg-white border-[5px] border-black transition-all group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
                Retour aux articles
              </span>
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        {filteredRelated.length > 0 && (
          <section className="mt-24 relative">
            {/* Section background decoration */}
            <div className="absolute -inset-x-4 -inset-y-8 bg-gray-50 border-y-[4px] border-black -z-10" />

            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="flex items-center gap-4 mb-10">
                <div
                  className="w-14 h-14 flex items-center justify-center border-[5px] border-black rotate-45"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <span className="text-2xl font-black text-white -rotate-45">+</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-black uppercase text-black tracking-tight">
                    Articles similaires
                  </h2>
                  <div
                    className="h-[5px] mt-2 w-32"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>

              {/* Grid asymétrique */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {filteredRelated.map((relatedArticle, index) => {
                  // Asymmetric spans for 3 items: 5, 4, 3
                  const spans = ["md:col-span-5", "md:col-span-4", "md:col-span-3"];
                  const colSpan = spans[index] || "md:col-span-4";

                  return (
                    <div key={relatedArticle.id} className={colSpan}>
                      <ArticleCard
                        article={relatedArticle}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                      />
                    </div>
                  );
                })}
              </div>

              {/* View all link */}
              <div className="text-center mt-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 font-bold uppercase text-sm tracking-wider text-black hover:gap-4 transition-all"
                >
                  <span>Voir tous les articles</span>
                  <span className="text-lg">&rarr;</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

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
            author: {
              "@type": "Organization",
              name: site.name,
            },
            publisher: {
              "@type": "Organization",
              name: site.name,
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
