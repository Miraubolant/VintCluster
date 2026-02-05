"use client";

import Link from "next/link";
import type { SiteTemplate } from "@/types/database";
import { isLightColor, colorWithOpacity } from "./TemplateContext";

interface TemplateLinkButtonProps {
  href: string;
  template: SiteTemplate;
  primaryColor: string;
  secondaryColor: string;
  variant?: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
  className?: string;
}

export function TemplateLinkButton({
  href,
  template,
  primaryColor,
  secondaryColor,
  variant = "primary",
  children,
  className = "",
}: TemplateLinkButtonProps) {
  const baseStyles = {
    brutal: {
      primary: "px-6 py-3 font-black uppercase text-sm tracking-wider border-[4px] border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
      secondary: "px-6 py-3 font-black uppercase text-sm tracking-wider bg-white border-[4px] border-black hover:bg-gray-100 transition-all",
      ghost: "px-4 py-2 font-black uppercase text-sm tracking-wider hover:underline decoration-4",
    },
    minimal: {
      primary: "px-6 py-3 text-sm font-normal tracking-wide transition-colors",
      secondary: "px-6 py-3 text-sm font-normal tracking-wide border border-gray-300 hover:border-gray-900 transition-colors",
      ghost: "px-4 py-2 text-sm font-normal tracking-wide text-gray-600 hover:text-gray-900 transition-colors",
    },
    magazine: {
      primary: "px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90",
      secondary: "px-6 py-3 text-sm font-bold uppercase tracking-wide border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all",
      ghost: "px-4 py-2 text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-gray-900 transition-colors",
    },
    tech: {
      primary: "px-6 py-3 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all",
      secondary: "px-6 py-3 text-sm font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-all",
      ghost: "px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors",
    },
    fresh: {
      primary: "px-6 py-3 text-sm font-bold rounded-full transition-all hover:scale-105",
      secondary: "px-6 py-3 text-sm font-bold rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all",
      ghost: "px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors",
    },
  };

  const getStyle = (): React.CSSProperties => {
    if (variant === "primary") {
      switch (template) {
        case "brutal":
          return { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" };
        case "minimal":
          return { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" };
        case "magazine":
          return { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" };
        case "tech":
          return { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" };
        case "fresh":
          return {
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: isLightColor(primaryColor) ? "#000" : "#FFF",
            boxShadow: `0 8px 30px ${colorWithOpacity(primaryColor, 0.4)}`,
          };
        default:
          return {};
      }
    }
    if (variant === "ghost" && template === "brutal") {
      return { textDecorationColor: primaryColor };
    }
    return {};
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 ${baseStyles[template][variant]} ${className}`}
      style={getStyle()}
    >
      {children}
    </Link>
  );
}

interface TemplatePaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  template: SiteTemplate;
  primaryColor: string;
  secondaryColor: string;
}

export function TemplatePagination({
  currentPage,
  totalPages,
  baseUrl,
  template,
  primaryColor,
  secondaryColor,
}: TemplatePaginationProps) {
  if (totalPages <= 1) return null;

  const getContainerClass = () => {
    switch (template) {
      case "brutal":
        return "relative";
      case "minimal":
        return "flex justify-center items-center gap-4";
      case "magazine":
        return "flex justify-center items-center gap-3";
      case "tech":
        return "flex justify-center items-center gap-2";
      case "fresh":
        return "flex justify-center items-center gap-3";
      default:
        return "";
    }
  };

  const getPageButtonClass = (isActive: boolean) => {
    switch (template) {
      case "brutal":
        return `w-12 h-12 flex items-center justify-center font-black text-lg border-[4px] border-black transition-all ${
          isActive ? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-white hover:bg-gray-100"
        }`;
      case "minimal":
        return `w-10 h-10 flex items-center justify-center text-sm font-normal transition-colors ${
          isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
        }`;
      case "magazine":
        return `w-10 h-10 flex items-center justify-center font-bold text-sm transition-all ${
          isActive ? "" : "text-gray-500 hover:text-gray-900"
        }`;
      case "tech":
        return `w-10 h-10 flex items-center justify-center font-medium text-sm rounded-lg transition-all ${
          isActive ? "shadow-md" : "text-gray-500 hover:bg-gray-100"
        }`;
      case "fresh":
        return `w-10 h-10 flex items-center justify-center font-bold text-sm rounded-full transition-all ${
          isActive ? "" : "text-gray-500 hover:text-white hover:bg-gray-800"
        }`;
      default:
        return "";
    }
  };

  const getNavButtonClass = (direction: "prev" | "next") => {
    switch (template) {
      case "brutal":
        return `group flex items-center gap-2 px-5 py-3 font-black uppercase text-sm border-[5px] border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px] hover:-translate-x-0.5 hover:-translate-y-0.5 ${
          direction === "next" ? "text-white" : "bg-white hover:bg-black hover:text-white"
        }`;
      case "minimal":
        return "text-sm font-normal text-gray-500 hover:text-gray-900 transition-colors";
      case "magazine":
        return `px-4 py-2 font-bold text-sm uppercase transition-all ${
          direction === "next" ? "text-white" : "border-2 border-gray-900 hover:bg-gray-900 hover:text-white"
        }`;
      case "tech":
        return `px-4 py-2 font-medium text-sm rounded-lg transition-all ${
          direction === "next" ? "text-white shadow-md hover:shadow-lg" : "border border-gray-300 hover:border-gray-400"
        }`;
      case "fresh":
        return `px-5 py-2 font-bold text-sm rounded-full transition-all hover:scale-105 ${
          direction === "next" ? "text-white" : "bg-gray-800 text-white hover:bg-gray-700"
        }`;
      default:
        return "";
    }
  };

  const getNavButtonStyle = (direction: "prev" | "next"): React.CSSProperties => {
    if (direction === "next") {
      switch (template) {
        case "brutal":
          return { backgroundColor: secondaryColor, "--tw-shadow-color": primaryColor } as React.CSSProperties;
        case "magazine":
          return { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" };
        case "tech":
          return { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? "#000" : "#FFF" };
        case "fresh":
          return {
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 8px 30px ${colorWithOpacity(primaryColor, 0.4)}`,
          };
        default:
          return {};
      }
    }
    if (template === "brutal") {
      return { "--tw-shadow-color": primaryColor } as React.CSSProperties;
    }
    return {};
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => {
    if (page === 1 || page === totalPages) return true;
    if (Math.abs(page - currentPage) <= 1) return true;
    return false;
  });

  return (
    <nav className={getContainerClass()}>
      {/* Decorative line for brutal */}
      {template === "brutal" && (
        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-black -translate-y-1/2 -z-10" />
      )}

      <div className={`flex justify-center items-center gap-${template === "brutal" ? "3" : "2"} flex-wrap`}>
        {/* Previous button */}
        {currentPage > 1 && (
          <Link
            href={`${baseUrl}?page=${currentPage - 1}`}
            className={getNavButtonClass("prev")}
            style={getNavButtonStyle("prev")}
          >
            <span className={`${template === "brutal" ? "text-lg" : ""} group-hover:-translate-x-1 transition-transform`}>
              ←
            </span>
            {template !== "minimal" && <span>Précédent</span>}
          </Link>
        )}

        {/* Page numbers */}
        <div className={`flex items-center gap-1 ${template === "brutal" ? "bg-white px-2 py-1" : ""}`}>
          {pages.map((page, index, array) => {
            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

            return (
              <span key={page} className="flex items-center">
                {showEllipsisBefore && (
                  <span className="px-2 text-gray-500 font-bold">•••</span>
                )}
                <Link
                  href={`${baseUrl}?page=${page}`}
                  className={getPageButtonClass(page === currentPage)}
                  style={
                    page === currentPage
                      ? {
                          backgroundColor: primaryColor,
                          color: isLightColor(primaryColor) ? "#000" : "#FFF",
                        }
                      : undefined
                  }
                >
                  {page}
                </Link>
              </span>
            );
          })}
        </div>

        {/* Next button */}
        {currentPage < totalPages && (
          <Link
            href={`${baseUrl}?page=${currentPage + 1}`}
            className={getNavButtonClass("next")}
            style={getNavButtonStyle("next")}
          >
            {template !== "minimal" && <span>Suivant</span>}
            <span className={`${template === "brutal" ? "text-lg" : ""} group-hover:translate-x-1 transition-transform`}>
              →
            </span>
          </Link>
        )}
      </div>

      {/* Page indicator */}
      {template === "brutal" && (
        <div className="text-center mt-6">
          <span className="inline-block px-4 py-2 bg-white border-[3px] border-black text-sm font-bold">
            Page {currentPage} sur {totalPages}
          </span>
        </div>
      )}
      {template === "minimal" && (
        <div className="text-center mt-4">
          <span className="text-xs text-gray-400">
            {currentPage} / {totalPages}
          </span>
        </div>
      )}
    </nav>
  );
}

interface TemplatePageHeaderProps {
  title: string;
  subtitle?: string;
  template: SiteTemplate;
  primaryColor: string;
  secondaryColor: string;
  badge?: {
    value: string | number;
    label: string;
    sublabel?: string;
  };
}

export function TemplatePageHeader({
  title,
  subtitle,
  template,
  primaryColor,
  secondaryColor,
  badge,
}: TemplatePageHeaderProps) {
  const getContainerClass = () => {
    switch (template) {
      case "brutal":
        return "relative py-12 md:py-16 overflow-hidden";
      case "minimal":
        return "py-16 md:py-24";
      case "magazine":
        return "py-12 md:py-16 border-b-4";
      case "tech":
        return "py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white";
      case "fresh":
        return "py-12 md:py-16 bg-gradient-to-b from-gray-950 to-gray-900";
      default:
        return "";
    }
  };

  const getTitleClass = () => {
    switch (template) {
      case "brutal":
        return "text-4xl md:text-6xl lg:text-7xl font-black uppercase text-black leading-[0.9] tracking-tighter";
      case "minimal":
        return "text-3xl md:text-4xl font-light text-gray-800 tracking-tight";
      case "magazine":
        return "text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight";
      case "tech":
        return "text-3xl md:text-4xl font-semibold text-gray-900";
      case "fresh":
        return "text-4xl md:text-5xl font-bold text-white";
      default:
        return "";
    }
  };

  const getBadgeClass = () => {
    switch (template) {
      case "brutal":
        return "inline-flex items-center gap-3 px-6 py-4 border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
      case "minimal":
        return "inline-flex items-center gap-2 text-sm text-gray-400";
      case "magazine":
        return "inline-flex items-center gap-3 px-4 py-2";
      case "tech":
        return "inline-flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200";
      case "fresh":
        return "inline-flex items-center gap-3 px-5 py-3 rounded-2xl";
      default:
        return "";
    }
  };

  return (
    <header
      className={getContainerClass()}
      style={template === "magazine" ? { borderColor: primaryColor } : {}}
    >
      {/* Decorative elements for brutal */}
      {template === "brutal" && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-4 right-10 w-20 h-20 border-[6px] border-black rotate-45 opacity-20"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute bottom-0 left-20 w-16 h-16 rounded-full border-[6px] border-black opacity-10"
            style={{ backgroundColor: secondaryColor }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[4px] bg-repeat-x"
            style={{
              backgroundImage: "radial-gradient(circle, black 2px, transparent 2px)",
              backgroundSize: "16px 4px",
            }}
          />
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            {/* Title decorations for brutal */}
            {template === "brutal" && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border-[4px] border-black" style={{ backgroundColor: primaryColor }} />
                <div className="w-4 h-4 border-[3px] border-black rotate-45" />
                <div className="w-3 h-3 rounded-full border-[3px] border-black" />
              </div>
            )}

            <h1 className={getTitleClass()}>
              {template === "brutal" ? (
                <>
                  {title.split(" ").slice(0, -1).join(" ")}
                  {title.split(" ").length > 1 && <br />}
                  <span className="relative inline-block">
                    {title.split(" ").slice(-1)[0]}
                    <div
                      className="absolute -bottom-2 left-0 h-3 w-full -z-10"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </span>
                </>
              ) : (
                title
              )}
            </h1>

            {subtitle && (
              <p className={`mt-4 ${template === "fresh" ? "text-gray-400" : "text-gray-600"}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Badge */}
          {badge && (
            <div
              className={getBadgeClass()}
              style={
                template === "brutal" || template === "magazine"
                  ? { backgroundColor: primaryColor }
                  : template === "fresh"
                  ? {
                      background: `linear-gradient(135deg, ${colorWithOpacity(primaryColor, 0.2)}, ${colorWithOpacity(secondaryColor, 0.2)})`,
                      border: `1px solid ${colorWithOpacity(primaryColor, 0.3)}`,
                    }
                  : {}
              }
            >
              <span
                className={`font-black ${template === "brutal" ? "text-4xl" : template === "fresh" ? "text-3xl text-white" : "text-2xl"}`}
              >
                {badge.value}
              </span>
              <div className="text-left">
                <p
                  className={`leading-tight ${
                    template === "brutal"
                      ? "text-sm font-black uppercase"
                      : template === "fresh"
                      ? "text-sm font-bold text-white"
                      : "text-sm font-medium"
                  }`}
                >
                  {badge.label}
                </p>
                {badge.sublabel && (
                  <p
                    className={`text-xs ${
                      template === "brutal" ? "uppercase text-gray-700" : template === "fresh" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {badge.sublabel}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface TemplateEmptyStateProps {
  message: string;
  template: SiteTemplate;
  primaryColor: string;
}

export function TemplateEmptyState({
  message,
  template,
  primaryColor,
}: TemplateEmptyStateProps) {
  const getContainerClass = () => {
    switch (template) {
      case "brutal":
        return "relative py-20";
      case "minimal":
        return "py-20 text-center";
      case "magazine":
        return "py-16 text-center";
      case "tech":
        return "py-16 text-center";
      case "fresh":
        return "py-16 text-center";
      default:
        return "";
    }
  };

  const getBoxClass = () => {
    switch (template) {
      case "brutal":
        return "inline-block p-10 border-[6px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]";
      case "minimal":
        return "inline-block p-8";
      case "magazine":
        return "inline-block p-8 border-l-4";
      case "tech":
        return "inline-block p-8 bg-gray-50 rounded-2xl";
      case "fresh":
        return "inline-block p-8 bg-gray-800 rounded-3xl";
      default:
        return "";
    }
  };

  return (
    <div className={getContainerClass()}>
      {template === "brutal" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-[4px] border-dashed border-gray-300 rounded-full" />
        </div>
      )}
      <div className="relative z-10 text-center">
        <div
          className={getBoxClass()}
          style={
            template === "brutal" || template === "magazine"
              ? { backgroundColor: primaryColor, borderColor: template === "magazine" ? primaryColor : undefined }
              : {}
          }
        >
          {template === "brutal" && (
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-black" />
              <div className="w-3 h-3 bg-black rotate-45" />
              <div className="w-3 h-3 bg-black" />
            </div>
          )}
          <p
            className={`${
              template === "brutal"
                ? "text-xl font-black uppercase"
                : template === "fresh"
                ? "text-lg font-bold text-white"
                : "text-lg text-gray-600"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
