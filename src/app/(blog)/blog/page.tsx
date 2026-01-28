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

  if (!site) {
    return {
      title: "Blog | VintCluster",
    };
  }

  return {
    title: `Blog | ${site.name}`,
    description: `Tous les articles de ${site.name}`,
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
        <p className="text-xl">Site non trouvé</p>
      </div>
    );
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (currentPage - 1) * ARTICLES_PER_PAGE;

  const primaryColor = site.primary_color || "#FFE500";

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(site.id, ARTICLES_PER_PAGE, offset),
    getPublishedArticlesCount(site.id),
  ]);

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase text-black mb-4">
          Tous les articles
        </h1>
        <p className="text-gray-700">
          {totalCount} article{totalCount > 1 ? "s" : ""} publié
          {totalCount > 1 ? "s" : ""}
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="inline-block p-8 border-4 border-black"
            style={{ backgroundColor: primaryColor }}
          >
            <p className="text-xl font-bold uppercase">Aucun article trouvé</p>
          </div>
        </div>
      ) : (
        <>
          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                primaryColor={primaryColor}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="px-4 py-2 font-bold uppercase border-4 border-black bg-white hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  &larr; Précédent
                </Link>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Afficher: première, dernière, et pages autour de la courante
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    // Ajouter des ellipses si nécessaire
                    const showEllipsisBefore =
                      index > 0 && page - array[index - 1] > 1;

                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsisBefore && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <Link
                          href={`/blog?page=${page}`}
                          className={`w-10 h-10 flex items-center justify-center font-bold border-4 border-black transition-colors ${
                            page === currentPage
                              ? "text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              : "bg-white hover:bg-gray-100"
                          }`}
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

              {currentPage < totalPages && (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="px-4 py-2 font-bold uppercase border-4 border-black bg-white hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  Suivant &rarr;
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
