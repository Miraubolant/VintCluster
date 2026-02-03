import { headers } from "next/headers";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSiteByDomain, getArticleBySlug } from "@/lib/actions/blog";
import { ArticleContent } from "@/components/blog";
import {
  getCityBySlug,
  getTopCitiesByPopulation,
  formatPopulation,
  City,
} from "@/lib/cities";

// ISR: régénération toutes les 24h
export const revalidate = 86400;

interface LocalArticlePageProps {
  params: Promise<{ city: string; slug: string }>;
}

// Pré-rendre les combinaisons top 100 villes × sera fait à la demande
// (trop de combinaisons pour generateStaticParams)
export async function generateStaticParams() {
  // On ne pré-génère rien, tout sera généré à la demande avec ISR
  return [];
}

/**
 * Localise le titre de l'article avec le nom de la ville
 */
function localizeTitle(title: string, city: City): string {
  // Ajouter la ville au titre
  return `${title} ${city.nom_a}`;
}

/**
 * Localise le contenu de l'article avec le nom de la ville
 * Insère des mentions de la ville de manière naturelle
 */
function localizeContent(content: string, city: City): string {
  // Ajouter une introduction locale avant le premier paragraphe
  const localIntro = `
<div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
<p class="font-semibold text-gray-800">📍 Guide local pour ${city.nom_standard}</p>
<p class="text-gray-600 text-sm mt-1">Ce guide est adapté pour les vendeurs Vinted ${city.nom_a} (${city.code_postal}, ${city.dep_nom}).</p>
</div>

`;

  // Ajouter un encart local avant la conclusion (avant le dernier ## ou à la fin)
  const localTip = `

<div class="bg-blue-50 border-l-4 border-blue-400 p-4 my-6 rounded-r-lg">
<p class="font-semibold text-gray-800">💡 Astuce pour ${city.nom_standard}</p>
<p class="text-gray-600 text-sm mt-1">${city.gentile ? `Les ${city.gentile}` : `Les vendeurs ${city.nom_de}`} qui mentionnent "${city.nom_standard}" dans leurs annonces obtiennent souvent plus de visibilité locale sur Vinted.</p>
</div>

`;

  // Insérer l'intro au début
  let localizedContent = localIntro + content;

  // Trouver le dernier ## pour insérer l'astuce avant
  const lastHeadingIndex = localizedContent.lastIndexOf("\n## ");
  if (lastHeadingIndex > 0) {
    localizedContent =
      localizedContent.slice(0, lastHeadingIndex) +
      localTip +
      localizedContent.slice(lastHeadingIndex);
  } else {
    // Sinon ajouter à la fin
    localizedContent += localTip;
  }

  return localizedContent;
}

export async function generateMetadata({
  params,
}: LocalArticlePageProps): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
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

  const article = await getArticleBySlug(site.id, slug);
  if (!article) {
    return { title: "Article non trouvé" };
  }

  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
  const protocol = isLocalhost ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const localizedTitle = localizeTitle(article.title, city);
  const localizedDescription = `${article.summary || article.title} - Guide spécial pour les vendeurs Vinted ${city.nom_a} (${city.code_postal}).`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${localizedTitle} | ${site.name}`,
    description: localizedDescription,
    icons: site.favicon_url
      ? {
          icon: site.favicon_url,
          shortcut: site.favicon_url,
          apple: site.favicon_url,
        }
      : undefined,
    alternates: {
      canonical: `/ville/${citySlug}/${slug}`,
    },
    openGraph: {
      title: localizedTitle,
      description: localizedDescription,
      type: "article",
      siteName: site.name,
      url: `${baseUrl}/ville/${citySlug}/${slug}`,
      locale: "fr_FR",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at || undefined,
      images: article.image_url
        ? [{ url: article.image_url, alt: article.image_alt || localizedTitle }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: localizedTitle,
      description: localizedDescription,
      images: article.image_url ? [article.image_url] : undefined,
    },
  };
}

export default async function LocalArticlePage({ params }: LocalArticlePageProps) {
  const { city: citySlug, slug } = await params;
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

  const article = await getArticleBySlug(site.id, slug);
  if (!article) {
    notFound();
  }

  const primaryColor = site.primary_color || "#FFE500";
  const secondaryColor = site.secondary_color || "#000000";

  // Localiser le contenu
  const localizedArticle = {
    ...article,
    title: localizeTitle(article.title, city),
    content: localizeContent(article.content, city),
  };

  return (
    <div className="relative">
      {/* Location Banner */}
      <div
        className="border-b-[4px] border-black py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <span className="font-black text-black uppercase text-sm tracking-wider">
                  Guide local
                </span>
                <span className="mx-2 text-black/50">•</span>
                <span className="font-bold text-black">
                  {city.nom_standard}
                </span>
                <span className="text-sm text-black/70 ml-2">
                  ({city.code_postal})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-black/70">
                {formatPopulation(city.population)} hab.
              </span>
              <span className="font-medium text-black/70">
                {city.dep_nom}
              </span>
            </div>
          </div>
        </div>
      </div>

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
                href={`/ville/${citySlug}`}
                className="font-bold text-black hover:underline decoration-2 underline-offset-2"
              >
                {city.nom_standard}
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
          article={localizedArticle}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div
            className="p-8 border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            style={{ backgroundColor: primaryColor }}
          >
            <h3 className="text-2xl font-black uppercase text-black mb-4">
              Booste tes ventes {city.nom_a} 🚀
            </h3>
            <p className="text-black/80 mb-6">
              Rejoins les vendeurs {city.nom_de} qui utilisent nos outils IA pour vendre plus vite sur Vinted.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://vintdress.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-black text-white font-black uppercase text-sm tracking-wider border-[3px] border-black hover:bg-white hover:text-black transition-colors"
              >
                Photos IA - VintDress
              </a>
              <a
                href="https://vintboost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-black font-black uppercase text-sm tracking-wider border-[3px] border-black hover:bg-black hover:text-white transition-colors"
              >
                Vidéos - VintBoost
              </a>
              <a
                href="https://vintpower.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-black font-black uppercase text-sm tracking-wider border-[3px] border-black hover:bg-black hover:text-white transition-colors"
              >
                Descriptions - VintPower
              </a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mt-12 flex flex-wrap justify-between gap-4">
          <Link
            href={`/ville/${citySlug}`}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white border-[4px] border-black font-bold uppercase text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            Tous les guides {city.nom_a}
          </Link>
          <Link
            href={`/blog/${slug}`}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white border-[4px] border-black font-bold uppercase text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            Version nationale
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: localizeTitle(article.title, city),
            description: `${article.summary || article.title} - Guide pour ${city.nom_standard}`,
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
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://${domain}/ville/${citySlug}/${slug}`,
            },
            about: {
              "@type": "City",
              name: city.nom_standard,
              containedInPlace: {
                "@type": "AdministrativeArea",
                name: city.dep_nom,
              },
            },
            spatialCoverage: {
              "@type": "Place",
              name: city.nom_standard,
              geo: {
                "@type": "GeoCoordinates",
                latitude: city.latitude_centre,
                longitude: city.longitude_centre,
              },
            },
          }),
        }}
      />

      {/* BreadcrumbList */}
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
                name: city.nom_standard,
                item: `https://${domain}/ville/${citySlug}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: article.title,
                item: `https://${domain}/ville/${citySlug}/${slug}`,
              },
            ],
          }),
        }}
      />
    </div>
  );
}
