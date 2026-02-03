import { headers } from "next/headers";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { getSiteByDomain, getPublishedArticles } from "@/lib/actions/blog";
import {
  getCityBySlug,
  getTopCitiesByPopulation,
  generateCityTitle,
  generateCityDescription,
  generateCityContent,
  formatPopulation,
} from "@/lib/cities";

// ISR: régénération toutes les 24h
export const revalidate = 86400;

interface CityPageProps {
  params: Promise<{ city: string }>;
}

// Pré-rendre les 500 villes les plus peuplées
export async function generateStaticParams() {
  const topCities = getTopCitiesByPopulation(500);
  return topCities.map((city) => ({
    city: city.nom_sans_accent,
  }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const city = getCityBySlug(citySlug);
  if (!city) {
    return { title: "Ville non trouvée" };
  }

  const site = await getSiteByDomain(domain);
  if (!site) {
    return { title: "Site non trouvé" };
  }

  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
  const protocol = isLocalhost ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const title = generateCityTitle(city, site.name);
  const description = generateCityDescription(city);

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
      canonical: `/ville/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: site.name,
      url: `${baseUrl}/ville/${citySlug}`,
      locale: "fr_FR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";
  const domain = host.split(":")[0];

  const city = getCityBySlug(citySlug);
  if (!city) {
    notFound();
  }

  const site = await getSiteByDomain(domain);
  if (!site) {
    notFound();
  }

  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  // Récupérer les articles du site
  const articles = await getPublishedArticles(site.id, 6, 0);
  const localContent = generateCityContent(city);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section
        className="relative py-16 md:py-24 border-b-[6px] border-black"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Geometric decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-black opacity-10 rotate-45 translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-[4px] border-black opacity-20 rotate-12 -translate-x-8 translate-y-8" />

        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm flex-wrap">
              <li>
                <Link
                  href="/"
                  className="font-bold text-black hover:underline decoration-2 underline-offset-2"
                >
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
              <li className="font-medium text-gray-700">
                {city.nom_standard}
              </li>
            </ol>
          </nav>

          {/* Title */}
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {city.dep_nom} • {city.reg_nom}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase text-black leading-[0.95] mb-6">
              Vendre sur Vinted
              <br />
              <span style={{ color: secondaryColor }}>
                {city.nom_a}
              </span>
            </h1>

            <p className="text-xl md:text-2xl font-bold text-black/80 max-w-2xl">
              {localContent.intro}
            </p>

            {/* City stats */}
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="px-4 py-3 bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black">{formatPopulation(city.population)}</div>
                <div className="text-sm font-bold uppercase text-gray-600">Habitants</div>
              </div>
              <div className="px-4 py-3 bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black">{city.code_postal}</div>
                <div className="text-sm font-bold uppercase text-gray-600">Code Postal</div>
              </div>
              {city.gentile && (
                <div className="px-4 py-3 bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black">{city.gentile}</div>
                  <div className="text-sm font-bold uppercase text-gray-600">Gentilé</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Local Tips Section */}
      <section className="py-12 bg-gray-50 border-b-[4px] border-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tip 1 */}
              <div className="bg-white p-6 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div
                  className="w-12 h-12 flex items-center justify-center border-[3px] border-black mb-4 rotate-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="font-black text-lg uppercase mb-2">Astuce Locale</h3>
                <p className="text-gray-700">{localContent.localTip}</p>
              </div>

              {/* Tip 2 */}
              <div className="bg-white p-6 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div
                  className="w-12 h-12 flex items-center justify-center border-[3px] border-black mb-4 -rotate-2"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <span className="text-2xl text-white">📦</span>
                </div>
                <h3 className="font-black text-lg uppercase mb-2">Livraison</h3>
                <p className="text-gray-700">{localContent.deliveryInfo}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-4">
            Booste tes ventes {city.nom_a}
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Rejoins les milliers de vendeurs qui utilisent nos outils IA pour vendre plus vite sur Vinted.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://vintdress.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-black uppercase text-sm tracking-wider bg-white text-black border-[4px] border-white hover:bg-transparent hover:text-white transition-colors"
            >
              🚀 Photos IA - VintDress
            </a>
            <a
              href="https://vintboost.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-black uppercase text-sm tracking-wider border-[4px] border-white text-white hover:bg-white hover:text-black transition-colors"
            >
              🎬 Vidéos - VintBoost
            </a>
            <a
              href="https://vintpower.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-black uppercase text-sm tracking-wider border-[4px] border-white text-white hover:bg-white hover:text-black transition-colors"
            >
              ✨ Descriptions - VintPower
            </a>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      {articles.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-10">
              <div
                className="w-12 h-12 flex items-center justify-center border-[4px] border-black rotate-45"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-xl font-black -rotate-45">📚</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase text-black">
                  Nos Guides pour Vendre {city.nom_a}
                </h2>
                <div
                  className="h-[4px] mt-2 w-24"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => {
                const readingTime = Math.ceil((article.content?.split(/\s+/).length || 0) / 200);
                const formattedDate = new Date(article.published_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <Link
                    key={article.id}
                    href={`/ville/${citySlug}/${article.slug}`}
                    className="group block h-full"
                  >
                    <article className="relative h-full flex flex-col overflow-hidden bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                      {/* Corner decoration */}
                      <div
                        className="absolute top-0 right-0 w-12 h-12 z-10"
                        style={{
                          background: `linear-gradient(225deg, ${secondaryColor} 50%, transparent 50%)`
                        }}
                      />

                      {/* Image */}
                      {article.image_url && (
                        <div className="relative aspect-[16/10] overflow-hidden border-b-[4px] border-black">
                          <Image
                            src={article.image_url}
                            alt={article.image_alt || article.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                            style={{ backgroundColor: primaryColor }}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Date + reading time */}
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                          <div
                            className="w-3 h-3 rotate-45"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span
                            className="px-2 py-0.5 border-2 border-black"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readingTime} min
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-black text-lg uppercase text-black leading-tight mb-3 group-hover:underline decoration-4 underline-offset-4 flex-grow" style={{ textDecorationColor: primaryColor }}>
                          {article.title} {city.nom_a}
                        </h3>

                        {/* Summary */}
                        {article.summary && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {article.summary}
                          </p>
                        )}

                        {/* CTA */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t-[3px] border-dashed border-gray-300">
                          <span className="font-black uppercase text-sm tracking-wider text-black">
                            Lire
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-[3px] bg-black group-hover:w-10 transition-all" />
                            <span className="font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                          </div>
                        </div>
                      </div>

                      {/* Side accent on hover */}
                      <div
                        className="absolute left-0 top-0 w-1 h-0 group-hover:h-full transition-all duration-300"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </article>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-black uppercase text-sm tracking-wider border-[4px] border-black hover:bg-white hover:text-black transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                Voir tous les articles
                <span className="text-lg">&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* JSON-LD Structured Data - Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: generateCityTitle(city, site.name),
            description: generateCityDescription(city),
            url: `https://${domain}/ville/${citySlug}`,
            isPartOf: {
              "@type": "WebSite",
              name: site.name,
              url: `https://${domain}`,
            },
            about: {
              "@type": "City",
              name: city.nom_standard,
              containedInPlace: {
                "@type": "AdministrativeArea",
                name: city.dep_nom,
                containedInPlace: {
                  "@type": "AdministrativeArea",
                  name: city.reg_nom,
                },
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: city.latitude_centre,
                longitude: city.longitude_centre,
              },
              population: {
                "@type": "QuantitativeValue",
                value: city.population,
              },
              postalCode: city.code_postal,
            },
            breadcrumb: {
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
                  name: city.nom_standard,
                  item: `https://${domain}/ville/${citySlug}`,
                },
              ],
            },
          }),
        }}
      />
    </div>
  );
}
