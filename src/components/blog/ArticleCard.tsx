import Link from "next/link";
import Image from "next/image";
import type { PublicArticle } from "@/lib/actions/blog";

interface ArticleCardProps {
  article: PublicArticle;
  primaryColor: string;
  featured?: boolean;
}

export function ArticleCard({
  article,
  primaryColor,
  featured = false,
}: ArticleCardProps) {
  const formattedDate = new Date(article.published_at).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <Link href={`/blog/${article.slug}`} className="group block">
      <article
        className={`
          bg-white border-4 border-black
          shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
          hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
          hover:-translate-x-1 hover:-translate-y-1
          transition-all duration-200
          overflow-hidden
          ${featured ? "md:flex" : ""}
        `}
      >
        {article.image_url && (
          <div
            className={`
              relative overflow-hidden border-b-4 border-black
              ${featured ? "md:w-1/2 md:border-b-0 md:border-r-4" : ""}
            `}
          >
            <div className={`aspect-video ${featured ? "md:aspect-auto md:h-full" : ""}`}>
              <Image
                src={article.image_url}
                alt={article.image_alt || article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        )}

        <div className={`p-6 ${featured ? "md:w-1/2 md:flex md:flex-col md:justify-center" : ""}`}>
          <div
            className="inline-block px-3 py-1 text-xs font-bold uppercase border-2 border-black mb-4"
            style={{ backgroundColor: primaryColor }}
          >
            {formattedDate}
          </div>

          <h2
            className={`
              font-black text-black uppercase leading-tight mb-3
              group-hover:underline decoration-4 underline-offset-4
              ${featured ? "text-2xl md:text-3xl" : "text-xl"}
            `}
          >
            {article.title}
          </h2>

          {article.summary && (
            <p className="text-gray-700 line-clamp-3">{article.summary}</p>
          )}

          <div
            className="mt-4 inline-flex items-center gap-2 font-bold text-black group-hover:gap-3 transition-all"
          >
            LIRE L&apos;ARTICLE
            <span className="text-xl">&rarr;</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
