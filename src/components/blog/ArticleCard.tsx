import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import type { PublicArticle } from "@/lib/actions/blog";

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
  const readingTime = calculateReadingTime(article.content || "");

  const formattedDate = new Date(article.published_at).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  // Featured variant - large hero card
  if (featured) {
    return (
      <Link href={`/blog/${article.slug}`} className="group block">
        <article className="relative bg-white border-[6px] border-black overflow-hidden">
          {/* Geometric corner decoration */}
          <div
            className="absolute top-0 left-0 w-24 h-24 z-20"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 50%, transparent 50%)`
            }}
          />
          <div
            className="absolute top-2 left-2 w-6 h-6 border-[3px] border-black bg-white z-30 rotate-45"
          />

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />
                </div>
                {/* Diagonal separator for desktop */}
                <div
                  className="hidden md:block absolute top-0 right-0 w-16 h-full"
                  style={{
                    background: `linear-gradient(100deg, transparent 0%, white 50%)`
                  }}
                />
              </div>
            )}

            {/* Content section */}
            <div className={`relative p-8 md:p-10 ${article.image_url ? "md:w-2/5" : "w-full"}`}>
              {/* Floating shapes */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-30">
                <div className="w-3 h-3 bg-black" />
                <div className="w-3 h-3 bg-black rotate-45" />
                <div className="w-3 h-3 rounded-full bg-black" />
              </div>

              {/* Date badge + reading time */}
              <div className="inline-flex items-center gap-2 mb-6 flex-wrap">
                <div
                  className="px-4 py-2 border-[4px] border-black font-black text-sm uppercase tracking-wider"
                  style={{ backgroundColor: primaryColor }}
                >
                  {formattedDate}
                </div>
                <div className="px-3 py-2 border-[3px] border-black bg-white flex items-center gap-1.5 text-sm font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {readingTime} min
                </div>
                <div
                  className="w-8 h-[4px] bg-black hidden sm:block"
                />
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-black text-black uppercase leading-[1.1] mb-4 group-hover:underline decoration-[6px] underline-offset-8" style={{ textDecorationColor: primaryColor }}>
                {article.title}
              </h2>

              {/* Summary */}
              {article.summary && (
                <p className="text-gray-700 text-lg leading-relaxed mb-6 line-clamp-3">
                  {article.summary}
                </p>
              )}

              {/* CTA */}
              <div className="inline-flex items-center gap-3">
                <span
                  className="relative px-6 py-3 font-black uppercase text-sm tracking-wider bg-black text-white border-[4px] border-black transition-all group-hover:bg-white group-hover:text-black"
                >
                  Lire l&apos;article
                </span>
                <div
                  className="w-12 h-12 flex items-center justify-center border-[4px] border-black transition-all group-hover:translate-x-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-2xl font-black">&rarr;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div
            className="h-2 w-0 group-hover:w-full transition-all duration-500"
            style={{ backgroundColor: secondary }}
          />
        </article>
      </Link>
    );
  }

  // Horizontal compact variant
  if (variant === "horizontal") {
    return (
      <Link href={`/blog/${article.slug}`} className="group block">
        <article className="flex bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 overflow-hidden">
          {article.image_url && (
            <div className="relative w-1/3 min-w-[120px] border-r-[4px] border-black overflow-hidden">
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
              className="inline-block px-2 py-1 text-[10px] font-bold uppercase border-2 border-black mb-2"
              style={{ backgroundColor: primaryColor }}
            >
              {formattedDate}
            </div>
            <h3 className="font-black text-sm uppercase leading-tight text-black group-hover:underline decoration-2">
              {article.title}
            </h3>
          </div>
        </article>
      </Link>
    );
  }

  // Default card variant
  return (
    <Link href={`/blog/${article.slug}`} className="group block h-full">
      <article className="relative h-full bg-white border-[5px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px] hover:-translate-x-1.5 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden flex flex-col" style={{ "--tw-shadow-color": primaryColor } as React.CSSProperties}>
        {/* Corner decoration */}
        <div
          className="absolute top-0 right-0 w-12 h-12 z-10"
          style={{
            background: `linear-gradient(225deg, ${secondary} 50%, transparent 50%)`
          }}
        />

        {/* Image */}
        {article.image_url && (
          <div className="relative aspect-[4/3] overflow-hidden border-b-[5px] border-black">
            <Image
              src={article.image_url}
              alt={article.image_alt || article.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Gradient overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Date + reading time with geometric accent */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div
              className="w-3 h-3 rotate-45"
              style={{ backgroundColor: primaryColor }}
            />
            <span
              className="px-3 py-1 text-xs font-black uppercase tracking-wider border-[3px] border-black"
              style={{ backgroundColor: primaryColor }}
            >
              {formattedDate}
            </span>
            <span className="px-2 py-1 text-xs font-bold border-[2px] border-black bg-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTime} min
            </span>
          </div>

          {/* Title */}
          <h2 className="font-black text-lg uppercase leading-tight text-black mb-3 group-hover:underline decoration-4 underline-offset-4 flex-grow" style={{ textDecorationColor: primaryColor }}>
            {article.title}
          </h2>

          {/* Summary */}
          {article.summary && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
              {article.summary}
            </p>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t-[3px] border-dashed border-gray-300">
            <span className="font-black text-xs uppercase tracking-wider text-black">
              Lire
            </span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-[3px] bg-black group-hover:w-10 transition-all" />
              <span className="text-lg font-black group-hover:translate-x-1 transition-transform">&rarr;</span>
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
}
