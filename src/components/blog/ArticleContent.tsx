import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { ChevronDown } from "lucide-react";
import type { PublicArticle } from "@/lib/actions/blog";

interface ArticleContentProps {
  article: PublicArticle;
  primaryColor: string;
  secondaryColor?: string;
}

export function ArticleContent({ article, primaryColor, secondaryColor }: ArticleContentProps) {
  const secondary = secondaryColor || "#000000";

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
      <header className="mb-12 relative">
        {/* Decorative shapes */}
        <div className="absolute -top-4 -left-4 w-20 h-20 border-[6px] border-black rotate-12 opacity-10 -z-10" style={{ backgroundColor: primaryColor }} />

        {/* Date badge with geometric accent */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-4 h-4 rotate-45 border-[3px] border-black"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="px-5 py-2 text-sm font-black uppercase tracking-wider border-[5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            style={{ backgroundColor: primaryColor }}
          >
            {formattedDate}
          </div>
          <div className="flex-1 h-[4px] bg-black" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black uppercase leading-[0.95] tracking-tighter mb-8">
          {article.title}
        </h1>

        {/* Summary */}
        {article.summary && (
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-2"
              style={{ backgroundColor: primaryColor }}
            />
            <p className="text-xl md:text-2xl text-gray-700 pl-6 leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}
      </header>

      {/* Featured Image */}
      {article.image_url && (
        <div className="relative mb-16">
          {/* Image container with offset shadow */}
          <div className="relative">
            <div
              className="absolute top-4 left-4 right-4 bottom-4 border-[4px] border-black -z-10"
              style={{ backgroundColor: secondary }}
            />
            <div className="relative aspect-[16/9] border-[6px] border-black overflow-hidden bg-white">
              <Image
                src={article.image_url}
                alt={article.image_alt || article.title}
                fill
                className="object-cover"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* Decorative corner */}
          <div
            className="absolute -bottom-3 -right-3 w-12 h-12 border-[4px] border-black rotate-45"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none
        prose-headings:font-black prose-headings:uppercase prose-headings:text-black prose-headings:tracking-tight
        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:relative prose-h2:pl-6
        prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4
        prose-p:text-gray-800 prose-p:leading-relaxed
        prose-a:text-black prose-a:font-bold prose-a:no-underline
        prose-strong:text-black prose-strong:font-black
        prose-blockquote:border-l-0 prose-blockquote:bg-gray-100 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:not-italic prose-blockquote:relative prose-blockquote:my-8
        prose-ul:my-6 prose-ol:my-6
        prose-li:text-gray-800
        prose-img:border-[4px] prose-img:border-black prose-img:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
      ">
        <ReactMarkdown
          components={{
            // Custom heading with accent bar
            h2: ({ children }) => (
              <h2 className="relative pl-6">
                <span
                  className="absolute left-0 top-1 bottom-1 w-2"
                  style={{ backgroundColor: primaryColor }}
                />
                {children}
              </h2>
            ),
            // Custom blockquote with geometric accent
            blockquote: ({ children }) => (
              <blockquote className="relative border-[4px] border-black">
                <div
                  className="absolute -top-2 -left-2 w-6 h-6 rotate-45"
                  style={{ backgroundColor: primaryColor }}
                />
                {children}
              </blockquote>
            ),
            // Rendu des liens
            a: ({ href, children }) => {
              if (!href) return <span>{children}</span>;

              // Lien externe
              if (href.startsWith("http")) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-black border-b-[3px] hover:border-b-[4px] transition-all"
                    style={{ borderColor: primaryColor }}
                  >
                    {children}
                  </a>
                );
              }

              // Lien interne
              return (
                <Link
                  href={href}
                  className="font-bold text-black border-b-[3px] hover:border-b-[4px] transition-all"
                  style={{ borderColor: primaryColor }}
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

      {/* FAQ Section */}
      {article.faq && Array.isArray(article.faq) && article.faq.length > 0 && (
        <section className="mt-20 relative">
          {/* Decorative background */}
          <div className="absolute -inset-4 border-[4px] border-dashed border-gray-200 -z-10" />

          {/* Section header */}
          <div className="flex items-center gap-4 mb-10">
            <div
              className="w-14 h-14 flex items-center justify-center border-[5px] border-black"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-2xl font-black">?</span>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-black uppercase text-black tracking-tight">
                Questions Fréquentes
              </h2>
              <div className="h-[5px] bg-black mt-2 w-48" />
            </div>
          </div>

          {/* FAQ items */}
          <div className="space-y-4">
            {article.faq.map((item, index) => (
              <details
                key={index}
                className="group bg-white border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <summary
                  className="flex items-center justify-between p-5 cursor-pointer font-black text-black uppercase tracking-tight hover:bg-gray-50 transition-colors"
                  style={{ listStyle: "none" }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="w-8 h-8 flex items-center justify-center border-[3px] border-black text-sm font-black shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-left">{item.question}</span>
                  </div>
                  <ChevronDown className="w-6 h-6 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div
                  className="p-5 border-t-[4px] border-black"
                  style={{ backgroundColor: primaryColor + "15" }}
                >
                  <div className="flex gap-4">
                    <div
                      className="w-1 shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <p className="text-gray-800 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
