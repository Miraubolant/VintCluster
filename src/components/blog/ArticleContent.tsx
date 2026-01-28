import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { ChevronDown, Clock, List } from "lucide-react";
import type { PublicArticle } from "@/lib/actions/blog";

interface ArticleContentProps {
  article: PublicArticle;
  primaryColor: string;
  secondaryColor?: string;
}

// Calculate reading time from content
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Extract headings for table of contents
interface HeadingItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function extractHeadings(content: string): HeadingItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    headings.push({ id, text, level });
  }

  return headings;
}

// Generate ID from heading text
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ArticleContent({ article, primaryColor, secondaryColor }: ArticleContentProps) {
  const secondary = secondaryColor || "#000000";
  const readingTime = calculateReadingTime(article.content);
  const headings = extractHeadings(article.content);
  const showTOC = headings.length >= 3;

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

        {/* Date + Reading time badges */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
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
          <div className="px-4 py-2 text-sm font-bold border-[3px] border-black bg-white flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {readingTime} min de lecture
          </div>
          <div className="flex-1 h-[4px] bg-black hidden sm:block" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black uppercase leading-[0.95] tracking-tighter mb-8">
          {article.title}
        </h1>

        {/* Summary as featured snippet box */}
        {article.summary && (
          <div className="relative">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-10 h-10 flex items-center justify-center border-[3px] border-black text-lg font-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  💡
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
                    En bref
                  </span>
                  <p className="text-lg md:text-xl text-gray-800 leading-relaxed font-medium">
                    {article.summary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Table of Contents */}
      {showTOC && (
        <nav className="mb-12 bg-gray-50 border-[4px] border-black p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 flex items-center justify-center border-[3px] border-black"
              style={{ backgroundColor: primaryColor }}
            >
              <List className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight">Sommaire</h2>
          </div>
          <ol className="space-y-2">
            {headings.map((heading, index) => (
              <li
                key={heading.id}
                className={heading.level === 3 ? "ml-6" : ""}
              >
                <a
                  href={`#${heading.id}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors group"
                >
                  <span
                    className={`${heading.level === 2 ? "font-bold" : "text-sm text-gray-500"}`}
                  >
                    {heading.level === 2 ? `${headings.filter((h, i) => h.level === 2 && i <= index).length}.` : "•"}
                  </span>
                  <span className="group-hover:underline decoration-2" style={{ textDecorationColor: primaryColor }}>
                    {heading.text}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

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
        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:relative prose-h2:pl-6 prose-h2:scroll-mt-24
        prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4 prose-h3:scroll-mt-24
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
            // Custom heading with accent bar and ID
            h2: ({ children }) => {
              const text = children?.toString() || "";
              const id = generateHeadingId(text);
              return (
                <h2 id={id} className="relative pl-6">
                  <span
                    className="absolute left-0 top-1 bottom-1 w-2"
                    style={{ backgroundColor: primaryColor }}
                  />
                  {children}
                </h2>
              );
            },
            // h3 with ID for TOC linking
            h3: ({ children }) => {
              const text = children?.toString() || "";
              const id = generateHeadingId(text);
              return (
                <h3 id={id}>
                  {children}
                </h3>
              );
            },
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

          {/* Section header with count */}
          <div className="flex items-center gap-4 mb-10">
            <div
              className="w-14 h-14 flex items-center justify-center border-[5px] border-black"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-2xl font-black">?</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl md:text-4xl font-black uppercase text-black tracking-tight">
                  Questions Fréquentes
                </h2>
                <span className="px-3 py-1 text-sm font-bold border-[3px] border-black bg-white">
                  {article.faq.length} question{article.faq.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-[5px] bg-black mt-2 w-48" />
            </div>
          </div>

          {/* FAQ items - first one open by default */}
          <div className="space-y-4">
            {article.faq.map((item, index) => (
              <details
                key={index}
                className="group bg-white border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                open={index === 0}
              >
                <summary
                  className="flex items-center justify-between p-5 cursor-pointer font-black text-black tracking-tight hover:bg-gray-50 transition-colors"
                  style={{ listStyle: "none" }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="w-10 h-10 flex items-center justify-center border-[3px] border-black text-base font-black shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-left text-base md:text-lg">{item.question}</span>
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
                    <p className="text-gray-800 leading-relaxed text-base">{item.answer}</p>
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
