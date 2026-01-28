import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import {
  getSiteByDomain,
  getPublishedArticles,
  getPublishedArticlesCount,
} from "@/lib/actions/blog";
import { ArticleCard } from "@/components/blog";

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
        <div className="inline-block p-8 border-[6px] border-black bg-red-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-black uppercase">Site non trouvé</p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (currentPage - 1) * ARTICLES_PER_PAGE;

  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(site.id, ARTICLES_PER_PAGE, offset),
    getPublishedArticlesCount(site.id),
  ]);

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  return (
    <div className="relative">
      {/* Header Section */}
      <header className="relative py-12 md:py-16 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-4 right-10 w-20 h-20 border-[6px] border-black rotate-45 opacity-20"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute bottom-0 left-20 w-16 h-16 rounded-full border-[6px] border-black opacity-10"
            style={{ backgroundColor: secondaryColor }}
          />
          {/* Dotted line */}
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-repeat-x" style={{
            backgroundImage: `radial-gradient(circle, black 2px, transparent 2px)`,
            backgroundSize: '16px 4px'
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            {/* Title with geometric accent */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 border-[4px] border-black"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="w-4 h-4 border-[3px] border-black rotate-45" />
                <div className="w-3 h-3 rounded-full border-[3px] border-black" />
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase text-black leading-[0.9] tracking-tighter">
                Tous les
                <br />
                <span className="relative inline-block">
                  articles
                  <div
                    className="absolute -bottom-2 left-0 h-3 w-full -z-10"
                    style={{ backgroundColor: primaryColor }}
                  />
                </span>
              </h1>
            </div>

            {/* Stats badge */}
            <div
              className="inline-flex items-center gap-3 px-6 py-4 border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-4xl font-black">{totalCount}</span>
              <div className="text-left">
                <p className="text-sm font-black uppercase leading-tight">
                  Article{totalCount > 1 ? "s" : ""}
                </p>
                <p className="text-xs uppercase text-gray-700">
                  Publié{totalCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {articles.length === 0 ? (
          <div className="relative py-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-[4px] border-dashed border-gray-300 rounded-full" />
            </div>
            <div className="relative z-10 text-center">
              <div
                className="inline-block p-10 border-[6px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-black" />
                  <div className="w-3 h-3 bg-black rotate-45" />
                  <div className="w-3 h-3 bg-black" />
                </div>
                <p className="text-xl font-black uppercase">
                  Aucun article trouvé
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Articles Grid - Asymmetric */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
              {articles.map((article, index) => {
                // Create asymmetric layout pattern
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
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="relative">
                {/* Decorative line */}
                <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-black -translate-y-1/2 -z-10" />

                <div className="flex justify-center items-center gap-3 flex-wrap">
                  {/* Previous button */}
                  {currentPage > 1 && (
                    <Link
                      href={`/blog?page=${currentPage - 1}`}
                      className="group flex items-center gap-2 px-5 py-3 font-black uppercase text-sm border-[5px] border-black bg-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px] hover:-translate-x-0.5 hover:-translate-y-0.5"
                      style={{ "--tw-shadow-color": primaryColor } as React.CSSProperties}
                    >
                      <span className="text-lg group-hover:-translate-x-1 transition-transform">&larr;</span>
                      Précédent
                    </Link>
                  )}

                  {/* Page numbers */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore =
                          index > 0 && page - array[index - 1] > 1;

                        return (
                          <span key={page} className="flex items-center">
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500 font-bold">•••</span>
                            )}
                            <Link
                              href={`/blog?page=${page}`}
                              className={`
                                w-12 h-12 flex items-center justify-center font-black text-lg
                                border-[4px] border-black transition-all
                                ${page === currentPage
                                  ? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                                  : "bg-white hover:bg-gray-100"
                                }
                              `}
                              style={
                                page === currentPage
                                  ? { backgroundColor: primaryColor }
                                  : undefined
                              }
                            >
                              {page}
                            </Link>
                          </span>
                        );
                      })}
                  </div>

                  {/* Next button */}
                  {currentPage < totalPages && (
                    <Link
                      href={`/blog?page=${currentPage + 1}`}
                      className="group flex items-center gap-2 px-5 py-3 font-black uppercase text-sm border-[5px] border-black bg-black text-white hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                      style={{ "--tw-shadow-color": primaryColor, backgroundColor: secondaryColor } as React.CSSProperties}
                    >
                      Suivant
                      <span className="text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </Link>
                  )}
                </div>

                {/* Page indicator */}
                <div className="text-center mt-6">
                  <span className="inline-block px-4 py-2 bg-white border-[3px] border-black text-sm font-bold">
                    Page {currentPage} sur {totalPages}
                  </span>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
