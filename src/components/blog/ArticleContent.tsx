import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Camera, Video, Sparkles, ExternalLink } from "lucide-react";
import type { PublicArticle } from "@/lib/actions/blog";

interface ArticleContentProps {
  article: PublicArticle;
  primaryColor: string;
}

// Produits Vint pour les CTA
const VINT_PRODUCTS = {
  "vintdress.com": {
    name: "VintDress",
    icon: Camera,
    color: "#E91E63",
  },
  "vintboost.com": {
    name: "VintBoost",
    icon: Video,
    color: "#9C27B0",
  },
  "vintpower.com": {
    name: "VintPower",
    icon: Sparkles,
    color: "#FF9800",
  },
};

// Vérifie si un lien est vers un produit Vint
function getVintProduct(href: string) {
  try {
    const url = new URL(href);
    const domain = url.hostname.replace("www.", "");
    return VINT_PRODUCTS[domain as keyof typeof VINT_PRODUCTS];
  } catch {
    return null;
  }
}

export function ArticleContent({ article, primaryColor }: ArticleContentProps) {
  const formattedDate = new Date(article.published_at).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div
          className="inline-block px-4 py-2 text-sm font-bold uppercase border-4 border-black mb-6"
          style={{ backgroundColor: primaryColor }}
        >
          {formattedDate}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black uppercase leading-tight mb-6">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-xl text-gray-700 border-l-4 border-black pl-4">
            {article.summary}
          </p>
        )}
      </header>

      {/* Image */}
      {article.image_url && (
        <div className="relative aspect-video border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 overflow-hidden">
          <Image
            src={article.image_url}
            alt={article.image_alt || article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:text-black prose-p:text-gray-800 prose-a:text-black prose-a:font-bold prose-a:underline prose-a:decoration-4 prose-a:underline-offset-4 prose-strong:text-black prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-gray-100 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic">
        <ReactMarkdown
          components={{
            // Rendu personnalisé des liens CTA
            a: ({ href, children }) => {
              if (!href) return <span>{children}</span>;

              const product = getVintProduct(href);

              // Si c'est un lien vers un produit Vint, afficher comme CTA
              if (product) {
                const Icon = product.icon;
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="not-prose inline-flex items-center gap-2 px-6 py-3 my-4 font-bold text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                    style={{ backgroundColor: product.color }}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{children}</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                );
              }

              // Lien externe standard
              if (href.startsWith("http")) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black font-bold underline decoration-4 underline-offset-4 hover:bg-yellow-200 transition-colors"
                  >
                    {children}
                  </a>
                );
              }

              // Lien interne
              return (
                <Link
                  href={href}
                  className="text-black font-bold underline decoration-4 underline-offset-4 hover:bg-yellow-200 transition-colors"
                >
                  {children}
                </Link>
              );
            },
          } as Components}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* FAQ */}
      {article.faq && article.faq.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl font-black uppercase text-black mb-8 border-b-4 border-black pb-4">
            Questions Fréquentes
          </h2>

          <div className="space-y-4">
            {article.faq.map((item, index) => (
              <details
                key={index}
                className="group border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <summary
                  className="flex items-center justify-between p-4 cursor-pointer font-bold text-black uppercase hover:bg-gray-100 transition-colors"
                  style={{ listStyle: "none" }}
                >
                  <span>{item.question}</span>
                  <span className="text-2xl group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div
                  className="p-4 border-t-4 border-black"
                  style={{ backgroundColor: primaryColor + "20" }}
                >
                  <p className="text-gray-800">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
