import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getSiteByDomain,
  getPublishedArticles,
  getPublishedArticlesCount,
} from "@/lib/actions/blog";
import { ArticleCard, TemplateLinkButton, TemplateEmptyState } from "@/components/blog";
import { isLightColor, colorWithOpacity } from "@/lib/utils/colors";
import type { SiteTemplate } from "@/types/database";

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
      title: "VintCluster Blog",
      description: "Plateforme de blogs IA multi-sites",
    };
  }

  return {
    metadataBase: new URL(baseUrl),
    title: site.meta_title || site.name,
    description: site.meta_description || `Blog ${site.name}`,
    icons: site.favicon_url
      ? {
          icon: site.favicon_url,
          shortcut: site.favicon_url,
          apple: site.favicon_url,
        }
      : undefined,
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": "/feed.xml",
      },
    },
    openGraph: {
      title: site.meta_title || site.name,
      description: site.meta_description || `Blog ${site.name}`,
      type: "website",
      siteName: site.name,
      url: baseUrl,
      locale: "fr_FR",
      images: site.logo_url ? [{ url: site.logo_url, alt: site.name }] : undefined,
    },
    twitter: {
      card: "summary",
      title: site.meta_title || site.name,
      description: site.meta_description || `Blog ${site.name}`,
      images: site.logo_url ? [site.logo_url] : undefined,
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
  const template = (site.template || "brutal") as SiteTemplate;

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(site.id, 7),
    getPublishedArticlesCount(site.id),
  ]);

  // Séparer le premier article (featured) des autres
  const [featuredArticle, ...recentArticles] = articles;

  // Template-specific hero classes
  const getHeroClass = () => {
    switch (template) {
      case "minimal":
        return "py-20 md:py-32";
      case "magazine":
        return "py-16 md:py-24 border-b-4";
      case "tech":
        return "py-16 md:py-28";
      case "fresh":
        return "py-20 md:py-32 relative overflow-hidden";
      default:
        return "py-16 md:py-24 overflow-hidden";
    }
  };

  const getHeroStyle = (): React.CSSProperties => {
    if (template === "magazine") {
      return { borderColor: primaryColor };
    }
    return {};
  };

  const getTitleClass = () => {
    switch (template) {
      case "minimal":
        return "text-4xl md:text-6xl lg:text-7xl font-extralight tracking-[0.05em] text-gray-800 leading-tight";
      case "magazine":
        return "text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-gray-900 leading-[0.95]";
      case "tech":
        return "text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-900 leading-tight";
      case "fresh":
        return "text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95]";
      default:
        return "text-5xl md:text-7xl lg:text-8xl font-black uppercase text-black leading-[0.9] tracking-tighter";
    }
  };

  const getDescriptionClass = () => {
    switch (template) {
      case "minimal":
        return "text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed font-light";
      case "magazine":
        return "text-xl md:text-2xl text-gray-700 max-w-2xl leading-relaxed font-medium";
      case "tech":
        return "text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed";
      case "fresh":
        return "text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed";
      default:
        return "text-xl md:text-2xl text-gray-700 max-w-2xl leading-relaxed";
    }
  };

  const getSectionTitleClass = () => {
    switch (template) {
      case "minimal":
        return "text-xs font-light tracking-[0.3em] uppercase text-gray-400";
      case "magazine":
        return "text-xl md:text-2xl font-extrabold text-gray-900";
      case "tech":
        return "text-lg font-semibold text-gray-900";
      case "fresh":
        return "text-xl font-bold text-white";
      default:
        return "text-2xl md:text-3xl font-black uppercase tracking-tight";
    }
  };

  const getGridClass = () => {
    switch (template) {
      case "minimal":
      case "tech":
      case "fresh":
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default:
        return "grid-cols-1 md:grid-cols-12";
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className={`relative ${getHeroClass()}`} style={getHeroStyle()}>
        {/* Template-specific decorative elements */}
        {template === "brutal" && (
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
        )}

        {template === "fresh" && (
          <>
            <div
              className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
              style={{ backgroundColor: secondaryColor }}
            />
          </>
        )}

        {template === "tech" && (
          <div
            className="absolute top-0 right-0 w-1/3 h-full opacity-30"
            style={{
              background: `linear-gradient(135deg, ${colorWithOpacity(primaryColor, 0.1)} 0%, transparent 100%)`,
            }}
          />
        )}

        <div className="container mx-auto px-4 relative z-10">
          <div className={template === "minimal" ? "max-w-3xl mx-auto text-center" : "max-w-4xl"}>
            {/* Site name with template-specific styling */}
            {template === "brutal" ? (
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-4 h-24 md:h-32 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
                <h1 className={getTitleClass()}>
                  {site.name}
                </h1>
              </div>
            ) : template === "magazine" ? (
              <div className="mb-6">
                <div
                  className="inline-block px-4 py-1 text-sm font-bold uppercase tracking-wider mb-4"
                  style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" }}
                >
                  Bienvenue
                </div>
                <h1 className={getTitleClass()}>
                  {site.name}
                </h1>
              </div>
            ) : template === "fresh" ? (
              <div className="mb-8">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    color: isLightColor(primaryColor) ? "#000" : "#FFF",
                    boxShadow: `0 8px 30px ${colorWithOpacity(primaryColor, 0.4)}`,
                  }}
                >
                  <span>✨</span>
                  Bienvenue
                </div>
                <h1 className={getTitleClass()}>
                  {site.name}
                </h1>
              </div>
            ) : (
              <h1 className={`${getTitleClass()} mb-6`}>
                {site.name}
              </h1>
            )}

            {site.meta_description && (
              <div className={template === "brutal" ? "flex items-center gap-4 ml-8" : "mt-6"}>
                {template === "brutal" && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-black" />
                    <div className="w-2 h-2 bg-black rotate-45" />
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>
                )}
                <p className={getDescriptionClass()}>
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
          <TemplateEmptyState
            message="Aucun article publié"
            template={template}
            primaryColor={primaryColor}
          />
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <section className={template === "minimal" ? "mb-16" : "mb-20"}>
                {/* Section header - template-specific */}
                {template === "brutal" && (
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-12 h-12 flex items-center justify-center border-[5px] border-black rotate-45"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="text-xl font-black -rotate-45">01</span>
                    </div>
                    <div className="flex-1">
                      <h2 className={getSectionTitleClass()}>À la une</h2>
                      <div className="h-[4px] bg-black mt-2 w-32" />
                    </div>
                  </div>
                )}

                {template === "minimal" && (
                  <div className="text-center mb-12">
                    <h2 className={getSectionTitleClass()}>À la une</h2>
                    <div className="w-12 h-px bg-gray-300 mx-auto mt-4" />
                  </div>
                )}

                {template === "magazine" && (
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-2 h-10"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <h2 className={getSectionTitleClass()}>À la une</h2>
                  </div>
                )}

                {template === "tech" && (
                  <div className="flex items-center gap-3 mb-8">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: isLightColor(primaryColor) ? "#000" : "#FFF" }}>01</span>
                    </div>
                    <h2 className={getSectionTitleClass()}>À la une</h2>
                  </div>
                )}

                {template === "fresh" && (
                  <div className="flex items-center gap-3 mb-10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 8px 20px ${colorWithOpacity(primaryColor, 0.4)}`,
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: isLightColor(primaryColor) ? "#000" : "#FFF" }}>🔥</span>
                    </div>
                    <h2 className={getSectionTitleClass()}>À la une</h2>
                  </div>
                )}

                <ArticleCard
                  article={featuredArticle}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  featured
                />
              </section>
            )}

            {/* Recent Articles */}
            {recentArticles.length > 0 && (
              <section className={template === "minimal" ? "mb-16" : "mb-20"}>
                {/* Section header - template-specific */}
                {template === "brutal" && (
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-12 h-12 flex items-center justify-center border-[5px] border-black"
                      style={{ backgroundColor: secondaryColor, color: 'white' }}
                    >
                      <span className="text-xl font-black">02</span>
                    </div>
                    <div className="flex-1">
                      <h2 className={getSectionTitleClass()}>Articles récents</h2>
                      <div className="h-[4px] bg-black mt-2 w-48" />
                    </div>
                  </div>
                )}

                {template === "minimal" && (
                  <div className="text-center mb-12">
                    <h2 className={getSectionTitleClass()}>Articles récents</h2>
                    <div className="w-12 h-px bg-gray-300 mx-auto mt-4" />
                  </div>
                )}

                {template === "magazine" && (
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-2 h-10"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <h2 className={getSectionTitleClass()}>Articles récents</h2>
                  </div>
                )}

                {template === "tech" && (
                  <div className="flex items-center gap-3 mb-8">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: isLightColor(primaryColor) ? "#000" : "#FFF" }}>02</span>
                    </div>
                    <h2 className={getSectionTitleClass()}>Articles récents</h2>
                  </div>
                )}

                {template === "fresh" && (
                  <div className="flex items-center gap-3 mb-10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 8px 20px ${colorWithOpacity(primaryColor, 0.4)}`,
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: isLightColor(primaryColor) ? "#000" : "#FFF" }}>✨</span>
                    </div>
                    <h2 className={getSectionTitleClass()}>Articles récents</h2>
                  </div>
                )}

                {/* Grid layout - template specific */}
                <div className={`grid gap-6 ${getGridClass()}`}>
                  {recentArticles.map((article, index) => {
                    // Asymmetric layout only for brutal/magazine
                    if (template === "brutal" || template === "magazine") {
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
              </section>
            )}

            {/* View All Link */}
            {totalCount > 7 && (
              <div className={`relative ${template === "brutal" ? "py-8" : "py-6"}`}>
                {/* Decorative line - only for brutal */}
                {template === "brutal" && (
                  <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-black -translate-y-1/2" />
                )}

                <div className={`relative z-10 flex ${template === "minimal" || template === "fresh" ? "justify-center" : template === "brutal" ? "justify-center" : "justify-start"}`}>
                  {template === "brutal" ? (
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
                  ) : (
                    <TemplateLinkButton
                      href="/blog"
                      template={template}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      variant="primary"
                    >
                      <span>Voir tous les articles</span>
                      <ArrowRight className="w-4 h-4" />
                    </TemplateLinkButton>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
