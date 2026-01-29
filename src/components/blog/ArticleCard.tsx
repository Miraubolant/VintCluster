"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import type { PublicArticle } from "@/lib/actions/blog";
import { useTemplate, CARD_STYLES, isLightColor } from "./TemplateContext";

interface ArticleCardProps {
  article: PublicArticle;
  primaryColor: string;
  secondaryColor?: string;
  featured?: boolean;
  variant?: "default" | "compact" | "horizontal";
}

// Calculate reading time from content
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function ArticleCard({
  article,
  primaryColor,
  secondaryColor,
  featured = false,
  variant = "default",
}: ArticleCardProps) {
  const secondary = secondaryColor || "#000000";
  const { template } = useTemplate();
  const styles = CARD_STYLES[template];
  const readingTime = calculateReadingTime(article.content || "");

  const formattedDate = new Date(article.published_at).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  // Featured variant - large hero card (uses brutal style always for impact)
  if (featured) {
    return (
      <Link href={`/blog/${article.slug}`} className="group block">
        <article className={`relative overflow-hidden ${template === "brutal" ? "bg-white border-[6px] border-black" : template === "minimal" ? "bg-white" : template === "magazine" ? "bg-white border border-gray-200" : template === "tech" ? "bg-white border border-gray-200 rounded-2xl shadow-md" : "bg-white rounded-3xl shadow-xl"}`}>
          {/* Geometric corner decoration (brutal only) */}
          {template === "brutal" && (
            <>
              <div
                className="absolute top-0 left-0 w-24 h-24 z-20"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 50%, transparent 50%)`
                }}
              />
              <div
                className="absolute top-2 left-2 w-6 h-6 border-[3px] border-black bg-white z-30 rotate-45"
              />
            </>
          )}

          <div className="md:flex">
            {/* Image section */}
            {article.image_url && (
              <div className="relative md:w-3/5 overflow-hidden">
                <div className="aspect-[16/10] md:aspect-auto md:h-full relative">
                  <Image
                    src={article.image_url}
                    alt={article.image_alt || article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 ${template === "tech" ? "bg-gradient-to-r from-indigo-900/30 to-transparent" : "bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r"}`} />
                </div>
                {/* Diagonal separator for desktop (not in tech/fresh) */}
                {template !== "tech" && template !== "fresh" && (
                  <div
                    className="hidden md:block absolute top-0 right-0 w-16 h-full"
                    style={{
                      background: "linear-gradient(100deg, transparent 0%, white 50%)"
                    }}
                  />
                )}
              </div>
            )}

            {/* Content section */}
            <div className={`relative p-8 md:p-10 ${article.image_url ? "md:w-2/5" : "w-full"}`}>
              {/* Floating shapes (brutal only) */}
              {template === "brutal" && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-30">
                  <div className="w-3 h-3 bg-black" />
                  <div className="w-3 h-3 bg-black rotate-45" />
                  <div className="w-3 h-3 rounded-full bg-black" />
                </div>
              )}

              {/* Date badge + reading time */}
              <div className="inline-flex items-center gap-2 mb-6 flex-wrap">
                <div
                  className={`px-4 py-2 font-bold text-sm uppercase tracking-wider ${template === "brutal" ? "border-[4px] border-black font-black" : template === "minimal" ? "text-gray-400 font-medium" : template === "magazine" ? "bg-gray-100 text-gray-700" : template === "tech" ? "bg-indigo-100 text-indigo-600 rounded-lg font-mono" : "bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full"}`}
                  style={template === "brutal" ? { backgroundColor: primaryColor } : {}}
                >
                  {formattedDate}
                </div>
                <div className={`px-3 py-2 flex items-center gap-1.5 text-sm font-bold ${template === "brutal" ? "border-[3px] border-black bg-white" : template === "tech" ? "text-gray-500" : "text-gray-500"}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {readingTime} min
                </div>
              </div>

              {/* Title */}
              <h2 className={`leading-[1.1] mb-4 ${template === "brutal" ? "text-3xl md:text-4xl font-black text-black uppercase group-hover:underline decoration-[6px] underline-offset-8" : template === "minimal" ? "text-2xl md:text-3xl font-light text-gray-900" : template === "magazine" ? "text-2xl md:text-3xl font-serif font-bold text-gray-900" : template === "tech" ? "text-2xl md:text-3xl font-mono font-bold text-gray-900" : "text-2xl md:text-3xl font-bold text-gray-900"}`} style={template === "brutal" ? { textDecorationColor: primaryColor } : {}}>
                {article.title}
              </h2>

              {/* Summary */}
              {article.summary && (
                <p className={`text-lg leading-relaxed mb-6 line-clamp-3 ${template === "tech" ? "text-gray-600" : "text-gray-700"}`}>
                  {article.summary}
                </p>
              )}

              {/* CTA */}
              <div className="inline-flex items-center gap-3">
                <span
                  className={`relative px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all ${template === "brutal" ? "bg-black text-white border-[4px] border-black font-black group-hover:bg-white group-hover:text-black" : template === "minimal" ? "text-gray-600 hover:text-gray-900" : template === "magazine" ? "bg-gray-900 text-white" : template === "tech" ? "bg-indigo-600 text-white rounded-lg" : "bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full"}`}
                >
                  Lire l&apos;article
                </span>
                {template === "brutal" && (
                  <div
                    className="w-12 h-12 flex items-center justify-center border-[4px] border-black transition-all group-hover:translate-x-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="text-2xl font-black">&rarr;</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom accent bar (brutal only) */}
          {template === "brutal" && (
            <div
              className="h-2 w-0 group-hover:w-full transition-all duration-500"
              style={{ backgroundColor: secondary }}
            />
          )}
        </article>
      </Link>
    );
  }

  // Horizontal compact variant
  if (variant === "horizontal") {
    return (
      <Link href={`/blog/${article.slug}`} className="group block">
        <article className={`flex overflow-hidden ${template === "brutal" ? "bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200" : template === "minimal" ? "bg-white" : template === "tech" ? "bg-white rounded-xl border border-gray-200 hover:border-indigo-400 transition-all" : "bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"}`}>
          {article.image_url && (
            <div className={`relative w-1/3 min-w-[120px] overflow-hidden ${template === "brutal" ? "border-r-[4px] border-black" : ""}`}>
              <Image
                src={article.image_url}
                alt={article.image_alt || article.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 p-4">
            <div
              className={`inline-block px-2 py-1 text-[10px] font-bold uppercase mb-2 ${template === "brutal" ? "border-2 border-black" : template === "tech" ? "bg-indigo-100 text-indigo-600 rounded" : "text-gray-400"}`}
              style={template === "brutal" ? { backgroundColor: primaryColor } : {}}
            >
              {formattedDate}
            </div>
            <h3 className={`leading-tight ${template === "brutal" ? "font-black text-sm uppercase text-black group-hover:underline decoration-2" : template === "minimal" ? "font-light text-sm text-gray-900" : template === "tech" ? "font-mono text-sm text-gray-900" : "font-bold text-sm text-gray-900"}`}>
              {article.title}
            </h3>
          </div>
        </article>
      </Link>
    );
  }

  // Default card variant - uses template styles
  return (
    <Link href={`/blog/${article.slug}`} className="group block h-full">
      <article className={`relative h-full flex flex-col overflow-hidden ${styles.container}`} style={template === "brutal" ? { "--tw-shadow-color": primaryColor } as React.CSSProperties : {}}>
        {/* Corner decoration (brutal only) */}
        {template === "brutal" && (
          <div
            className="absolute top-0 right-0 w-12 h-12 z-10"
            style={{
              background: `linear-gradient(225deg, ${secondary} 50%, transparent 50%)`
            }}
          />
        )}

        {/* Image */}
        {article.image_url && (
          <div className={styles.imageWrapper}>
            <Image
              src={article.image_url}
              alt={article.image_alt || article.title}
              fill
              className={styles.imageStyle}
            />
            {/* Gradient overlay on hover (brutal only) */}
            {template === "brutal" && (
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className={`${styles.contentWrapper} flex-1 flex flex-col`}>
          {/* Date + reading time */}
          <div className={styles.meta + " mb-3"}>
            {template === "brutal" && (
              <div
                className="w-3 h-3 rotate-45"
                style={{ backgroundColor: primaryColor }}
              />
            )}
            <span
              className={styles.category}
              style={template === "brutal" ? { backgroundColor: primaryColor } : {}}
            >
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTime} min
            </span>
          </div>

          {/* Title */}
          <h2 className={`${styles.title} flex-grow`} style={template === "brutal" ? { textDecorationColor: primaryColor } : {}}>
            {article.title}
          </h2>

          {/* Summary */}
          {article.summary && (
            <p className={styles.excerpt}>
              {article.summary}
            </p>
          )}

          {/* CTA */}
          <div className={`flex items-center justify-between mt-auto pt-4 ${template === "brutal" ? "border-t-[3px] border-dashed border-gray-300" : template === "minimal" ? "border-t border-gray-100" : ""}`}>
            <span className={styles.readMore}>
              Lire
            </span>
            <div className="flex items-center gap-1">
              {template === "brutal" && (
                <div className="w-6 h-[3px] bg-black group-hover:w-10 transition-all" />
              )}
              <span className={`font-bold group-hover:translate-x-1 transition-transform ${template === "tech" ? "text-indigo-600" : ""}`}>&rarr;</span>
            </div>
          </div>
        </div>

        {/* Side accent on hover (brutal only) */}
        {template === "brutal" && (
          <div
            className="absolute left-0 top-0 w-1 h-0 group-hover:h-full transition-all duration-300"
            style={{ backgroundColor: primaryColor }}
          />
        )}
      </article>
    </Link>
  );
}
