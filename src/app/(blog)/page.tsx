import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import {
  getSiteByDomain,
  getPublishedArticles,
  getPublishedArticlesCount,
} from "@/lib/actions/blog";
import { ArticleCard } from "@/components/blog";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const site = await getSiteByDomain(domain);

  if (!site) {
    return {
      title: "VintCluster Blog",
      description: "Plateforme de blogs IA multi-sites",
    };
  }

  return {
    title: site.name,
    description: site.meta_description || `Blog ${site.name}`,
    openGraph: {
      title: site.name,
      description: site.meta_description || `Blog ${site.name}`,
      type: "website",
    },
  };
}

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const site = await getSiteByDomain(domain);

  // Si pas de site, afficher page d'accueil par défaut
  if (!site) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black uppercase mb-8">
            VintCluster
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Plateforme de génération de blogs IA multi-sites
          </p>
          <Link
            href="/admin"
            className="inline-block px-8 py-4 bg-black text-white font-bold uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
          >
            Accéder à l&apos;admin
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = site.primary_color || "#FFE500";
  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(site.id, 7),
    getPublishedArticlesCount(site.id),
  ]);

  // Séparer le premier article (featured) des autres
  const [featuredArticle, ...recentArticles] = articles;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16">
        <h1 className="text-5xl md:text-7xl font-black uppercase text-black mb-4">
          {site.name}
        </h1>
        {site.meta_description && (
          <p className="text-xl text-gray-700 max-w-2xl">
            {site.meta_description}
          </p>
        )}
      </section>

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="inline-block p-8 border-4 border-black"
            style={{ backgroundColor: primaryColor }}
          >
            <p className="text-xl font-bold uppercase">
              Aucun article publié pour le moment
            </p>
            <p className="text-gray-700 mt-2">Revenez bientôt !</p>
          </div>
        </div>
      ) : (
        <>
          {/* Featured Article */}
          {featuredArticle && (
            <section className="mb-16">
              <h2
                className="text-2xl font-black uppercase mb-6 pb-2 border-b-4 border-black inline-block"
                style={{ borderColor: primaryColor }}
              >
                À la une
              </h2>
              <ArticleCard
                article={featuredArticle}
                primaryColor={primaryColor}
                featured
              />
            </section>
          )}

          {/* Recent Articles Grid */}
          {recentArticles.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-black uppercase mb-6 pb-2 border-b-4 border-black inline-block">
                Articles récents
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    primaryColor={primaryColor}
                  />
                ))}
              </div>
            </section>
          )}

          {/* View All Link */}
          {totalCount > 7 && (
            <div className="text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-bold uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
              >
                Voir tous les articles
                <span className="text-xl">&rarr;</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
