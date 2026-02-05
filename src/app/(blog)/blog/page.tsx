import { headers } from "next/headers";
import { Metadata } from "next";
import {
  getSiteByDomain,
  getPublishedArticles,
  getPublishedArticlesCount,
} from "@/lib/actions/blog";
import {
  ArticleCard,
  TemplatePagination,
  TemplatePageHeader,
  TemplateEmptyState,
} from "@/components/blog";
import type { SiteTemplate } from "@/types/database";

const ARTICLES_PER_PAGE = 12;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const site = await getSiteByDomain(domain);

  // Determine base URL
  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
  const protocol = isLocalhost ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (!site) {
    return {
      title: "Blog | VintCluster",
    };
  }

  const title = `Blog | ${site.name}`;
  const description = site.meta_description || `Tous les articles de ${site.name}`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    icons: site.favicon_url
      ? {
          icon: site.favicon_url,
          shortcut: site.favicon_url,
          apple: site.favicon_url,
        }
      : undefined,
    alternates: {
      canonical: "/blog",
      types: {
        "application/rss+xml": "/feed.xml",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: site.name,
      url: `${baseUrl}/blog`,
      locale: "fr_FR",
      images: site.logo_url ? [{ url: site.logo_url, alt: site.name }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: site.logo_url ? [site.logo_url] : undefined,
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const site = await getSiteByDomain(domain);

  if (!site) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl font-bold">Site non trouvé</p>
      </div>
    );
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (currentPage - 1) * ARTICLES_PER_PAGE;

  const template = (site.template || "brutal") as SiteTemplate;
  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(site.id, ARTICLES_PER_PAGE, offset),
    getPublishedArticlesCount(site.id),
  ]);

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  // Get background class based on template
  const getPageBgClass = () => {
    switch (template) {
      case "fresh":
        return "bg-gray-950 min-h-screen";
      case "tech":
        return "bg-white min-h-screen";
      case "magazine":
        return "bg-gray-50 min-h-screen";
      default:
        return "bg-white min-h-screen";
    }
  };

  return (
    <div className={getPageBgClass()}>
      {/* Header Section */}
      <TemplatePageHeader
        title="Tous les articles"
        template={template}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        badge={{
          value: totalCount,
          label: `Article${totalCount > 1 ? "s" : ""}`,
          sublabel: `Publié${totalCount > 1 ? "s" : ""}`,
        }}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {articles.length === 0 ? (
          <TemplateEmptyState
            message="Aucun article trouvé"
            template={template}
            primaryColor={primaryColor}
          />
        ) : (
          <>
            {/* Articles Grid */}
            <div className={`grid gap-6 mb-16 ${
              template === "minimal"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : template === "tech"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : template === "fresh"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-12"
            }`}>
              {articles.map((article, index) => {
                // Asymmetric layout for brutal/magazine, simple grid for others
                if (template === "brutal" || template === "magazine") {
                  const patterns = [
                    "md:col-span-7", "md:col-span-5",
                    "md:col-span-4", "md:col-span-4", "md:col-span-4",
                    "md:col-span-5", "md:col-span-7",
                    "md:col-span-6", "md:col-span-6",
                    "md:col-span-4", "md:col-span-4", "md:col-span-4",
                  ];
                  const colSpan = patterns[index % patterns.length];

                  return (
                    <div key={article.id} className={colSpan}>
                      <ArticleCard
                        article={article}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                      />
                    </div>
                  );
                }

                return (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            <TemplatePagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/blog"
              template={template}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </>
        )}
      </div>
    </div>
  );
}
