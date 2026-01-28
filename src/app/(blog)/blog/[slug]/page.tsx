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

// Générer les pages statiques pour ISR
export async function generateStaticParams() {
  // Cette fonction est appelée au build time
  // En production, on peut pré-générer les articles les plus récents
  return [];
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

  // Récupérer les articles liés (autres articles récents)
  const relatedArticles = await getPublishedArticles(site.id, 4);
  const filteredRelated = relatedArticles.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              href="/"
              className="font-bold text-black hover:underline decoration-2 underline-offset-2"
            >
              Accueil
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link
              href="/blog"
              className="font-bold text-black hover:underline decoration-2 underline-offset-2"
            >
              Blog
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-600 truncate max-w-xs">{article.title}</li>
        </ol>
      </nav>

      {/* Article Content */}
      <ArticleContent article={article} primaryColor={primaryColor} />

      {/* Back Link */}
      <div className="mt-16 pt-8 border-t-4 border-black">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-bold uppercase text-black hover:gap-3 transition-all"
        >
          <span className="text-xl">&larr;</span>
          Retour aux articles
        </Link>
      </div>

      {/* Related Articles */}
      {filteredRelated.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-black uppercase text-black mb-8 pb-2 border-b-4 border-black inline-block">
            Articles similaires
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRelated.map((relatedArticle) => (
              <ArticleCard
                key={relatedArticle.id}
                article={relatedArticle}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.summary,
            image: article.image_url,
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
            ...(article.faq && article.faq.length > 0
              ? {
                  "@type": "FAQPage",
                  mainEntity: article.faq.map((item) => ({
                    "@type": "Question",
                    name: item.question,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: item.answer,
                    },
                  })),
                }
              : {}),
          }),
        }}
      />
    </div>
  );
}
