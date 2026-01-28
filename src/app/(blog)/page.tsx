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
        <div className="relative max-w-3xl mx-auto">
          {/* Decorative elements */}
          <div className="absolute -top-8 -left-8 w-24 h-24 border-[6px] border-black rotate-12 bg-yellow-400 -z-10" />
          <div className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full border-[6px] border-black bg-pink-400 -z-10" />

          <div className="bg-white border-[6px] border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-6xl md:text-8xl font-black uppercase mb-6 leading-none">
              Vint
              <span className="text-yellow-400">Cluster</span>
            </h1>
            <p className="text-xl text-gray-700 mb-10 border-l-[6px] border-black pl-4">
              Plateforme de génération de blogs IA multi-sites
            </p>
            <Link
              href="/admin"
              className="group inline-flex items-center gap-4"
            >
              <span className="px-8 py-4 bg-black text-white font-black uppercase text-lg border-[5px] border-black transition-all group-hover:bg-yellow-400 group-hover:text-black">
                Accéder à l&apos;admin
              </span>
              <div className="w-14 h-14 flex items-center justify-center bg-yellow-400 border-[5px] border-black group-hover:translate-x-2 transition-transform">
                <span className="text-3xl font-black">&rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(site.id, 7),
    getPublishedArticlesCount(site.id),
  ]);

  // Séparer le premier article (featured) des autres
  const [featuredArticle, ...recentArticles] = articles;

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-10 right-20 w-40 h-40 border-[8px] border-black rotate-12 opacity-20"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute top-1/2 -left-16 w-32 h-32 rounded-full border-[8px] border-black opacity-10"
            style={{ backgroundColor: secondaryColor }}
          />
          <svg
            className="absolute bottom-10 right-1/4 w-48 h-12 opacity-20"
            viewBox="0 0 200 40"
          >
            <path
              d="M0,20 Q25,0 50,20 T100,20 T150,20 T200,20"
              stroke="black"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            {/* Site name with geometric accent */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-4 h-24 md:h-32 shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase text-black leading-[0.9] tracking-tighter">
                {site.name}
              </h1>
            </div>

            {site.meta_description && (
              <div className="flex items-center gap-4 ml-8">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-black" />
                  <div className="w-2 h-2 bg-black rotate-45" />
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
                <p className="text-xl md:text-2xl text-gray-700 max-w-2xl leading-relaxed">
                  {site.meta_description}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-4 pb-16">
        {articles.length === 0 ? (
          <div className="relative py-20">
            {/* Decorative background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-[4px] border-dashed border-gray-300 rotate-45" />
            </div>

            <div className="relative z-10 text-center">
              <div
                className="inline-block p-10 border-[6px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex justify-center gap-3 mb-4">
                  <div className="w-4 h-4 bg-black" />
                  <div className="w-4 h-4 bg-black rotate-45" />
                  <div className="w-4 h-4 bg-black" />
                </div>
                <p className="text-2xl font-black uppercase mb-2">
                  Aucun article publié
                </p>
                <p className="text-gray-800">Revenez bientôt !</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <section className="mb-20">
                {/* Section header */}
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="w-12 h-12 flex items-center justify-center border-[5px] border-black rotate-45"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="text-xl font-black -rotate-45">01</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                      À la une
                    </h2>
                    <div className="h-[4px] bg-black mt-2 w-32" />
                  </div>
                </div>

                <ArticleCard
                  article={featuredArticle}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  featured
                />
              </section>
            )}

            {/* Recent Articles - Asymmetric Grid */}
            {recentArticles.length > 0 && (
              <section className="mb-20">
                {/* Section header */}
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="w-12 h-12 flex items-center justify-center border-[5px] border-black"
                    style={{ backgroundColor: secondaryColor, color: 'white' }}
                  >
                    <span className="text-xl font-black">02</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                      Articles récents
                    </h2>
                    <div className="h-[4px] bg-black mt-2 w-48" />
                  </div>
                </div>

                {/* Asymmetric grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {recentArticles.map((article, index) => {
                    // Asymmetric column spans
                    let colSpan = "md:col-span-4";
                    if (index === 0) colSpan = "md:col-span-7";
                    else if (index === 1) colSpan = "md:col-span-5";
                    else if (index === 2) colSpan = "md:col-span-5";
                    else if (index === 3) colSpan = "md:col-span-7";
                    else if (index === 4) colSpan = "md:col-span-6";
                    else if (index === 5) colSpan = "md:col-span-6";

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
              </section>
            )}

            {/* View All Link */}
            {totalCount > 7 && (
              <div className="relative py-8">
                {/* Decorative line */}
                <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-black -translate-y-1/2" />

                <div className="relative z-10 flex justify-center">
                  <Link
                    href="/blog"
                    className="group inline-flex items-center gap-0 bg-white"
                  >
                    <span
                      className="px-8 py-4 font-black uppercase text-lg border-[5px] border-black transition-all group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-x-1 group-hover:-translate-y-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Voir tous les articles
                    </span>
                    <div className="px-4 py-4 bg-black text-white border-[5px] border-black border-l-0 flex items-center group-hover:bg-white group-hover:text-black transition-colors">
                      <span className="text-2xl font-black group-hover:translate-x-2 transition-transform inline-block">&rarr;</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
