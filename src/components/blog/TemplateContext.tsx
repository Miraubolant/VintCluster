"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteTemplate } from "@/types/database";

interface TemplateContextValue {
  template: SiteTemplate;
  primaryColor: string;
  secondaryColor: string;
}

const TemplateContext = createContext<TemplateContextValue>({
  template: "brutal",
  primaryColor: "#FFE500",
  secondaryColor: "#000000",
});

export function TemplateProvider({
  template,
  primaryColor,
  secondaryColor,
  children,
}: {
  template: SiteTemplate;
  primaryColor: string;
  secondaryColor: string;
  children: ReactNode;
}) {
  return (
    <TemplateContext.Provider value={{ template, primaryColor, secondaryColor }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  return useContext(TemplateContext);
}

// ============================================================================
// STYLES PAR TEMPLATE
// ============================================================================

// Determine if color is light or dark to choose text color
export function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// ============================================================================
// HEADER STYLES
// ============================================================================

export interface HeaderStyleConfig {
  container: string;
  topBar: (primary: string, secondary: string) => React.CSSProperties;
  wrapper: (scrolled: boolean, primary: string) => string;
  wrapperStyle: (primary: string) => React.CSSProperties;
  logoContainer: string;
  logoText: (scrolled: boolean, isLight: boolean) => string;
  navButton: string;
  navButtonStyle: (secondary: string) => React.CSSProperties;
  bottomBar: string;
}

export const HEADER_STYLES: Record<SiteTemplate, HeaderStyleConfig> = {
  // BRUTAL - Néo-brutaliste (actuel)
  brutal: {
    container: "relative",
    topBar: (primary, secondary) => ({
      background: `repeating-linear-gradient(90deg, ${primary} 0px, ${primary} 20px, ${secondary} 20px, ${secondary} 40px)`,
      height: "8px",
    }),
    wrapper: (scrolled) => `relative border-b-[5px] border-black transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`,
    wrapperStyle: (primary) => ({ backgroundColor: primary }),
    logoContainer: "w-12 h-12 border-[4px] border-black flex items-center justify-center rotate-0 group-hover:rotate-6 transition-transform",
    logoText: (scrolled, isLight) => `font-black uppercase tracking-tight transition-all ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} ${isLight ? "text-black" : "text-white"}`,
    navButton: "relative px-5 py-2 font-black uppercase text-sm tracking-wider bg-black text-white border-[4px] border-black transition-all hover:shadow-[4px_4px_0px_0px] hover:-translate-x-0.5 hover:-translate-y-0.5",
    navButtonStyle: (secondary) => ({ "--tw-shadow-color": secondary } as React.CSSProperties),
    bottomBar: "h-[3px] bg-black",
  },

  // MINIMAL - Ultra clean
  minimal: {
    container: "relative",
    topBar: () => ({ height: "0px", display: "none" }),
    wrapper: (scrolled) => `transition-all duration-300 ${scrolled ? "py-3" : "py-6"} border-b border-gray-100`,
    wrapperStyle: () => ({ backgroundColor: "white" }),
    logoContainer: "w-10 h-10 rounded-full flex items-center justify-center",
    logoText: (scrolled) => `font-light tracking-[0.2em] uppercase transition-all text-gray-900 ${scrolled ? "text-lg" : "text-xl"}`,
    navButton: "px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors",
    navButtonStyle: () => ({}),
    bottomBar: "",
  },

  // MAGAZINE - Style éditorial
  magazine: {
    container: "relative bg-white",
    topBar: (primary) => ({
      height: "4px",
      backgroundColor: primary,
    }),
    wrapper: (scrolled) => `transition-all duration-300 ${scrolled ? "py-3" : "py-6"} border-b-2 border-gray-900`,
    wrapperStyle: () => ({ backgroundColor: "white" }),
    logoContainer: "w-12 h-12 border-2 border-gray-900 flex items-center justify-center",
    logoText: (scrolled) => `font-serif font-bold tracking-tight text-gray-900 ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`,
    navButton: "px-4 py-2 text-sm font-medium uppercase tracking-widest text-gray-700 border-b-2 border-transparent hover:border-gray-900 transition-all",
    navButtonStyle: () => ({}),
    bottomBar: "",
  },

  // TECH - Moderne avec gradients
  tech: {
    container: "relative",
    topBar: (primary, secondary) => ({
      height: "2px",
      background: `linear-gradient(90deg, ${primary}, ${secondary})`,
    }),
    wrapper: (scrolled) => `transition-all duration-300 ${scrolled ? "py-3" : "py-5"} border-b border-gray-800`,
    wrapperStyle: () => ({ backgroundColor: "#0f172a" }),
    logoContainer: "w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center",
    logoText: (scrolled) => `font-mono font-bold tracking-tight text-white ${scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`,
    navButton: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-all",
    navButtonStyle: () => ({}),
    bottomBar: "",
  },

  // FRESH - Coloré et dynamique
  fresh: {
    container: "relative",
    topBar: (primary, secondary) => ({
      height: "6px",
      background: `linear-gradient(90deg, ${primary}, ${secondary}, ${primary})`,
      backgroundSize: "200% 100%",
      animation: "gradient 3s ease infinite",
    }),
    wrapper: (scrolled) => `transition-all duration-300 ${scrolled ? "py-3" : "py-5"} rounded-b-3xl shadow-lg`,
    wrapperStyle: (primary) => ({ backgroundColor: primary }),
    logoContainer: "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transform hover:scale-110 transition-transform",
    logoText: (scrolled, isLight) => `font-bold tracking-tight transition-all ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} ${isLight ? "text-gray-900" : "text-white"}`,
    navButton: "px-6 py-2.5 font-bold text-sm rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all",
    navButtonStyle: (secondary) => ({ backgroundColor: secondary, color: isLightColor(secondary) ? "#000" : "#FFF" }),
    bottomBar: "",
  },
};

// ============================================================================
// CARD STYLES
// ============================================================================

export interface CardStyleConfig {
  container: string;
  imageWrapper: string;
  imageStyle: string;
  contentWrapper: string;
  category: string;
  title: string;
  excerpt: string;
  meta: string;
  readMore: string;
}

export const CARD_STYLES: Record<SiteTemplate, CardStyleConfig> = {
  // BRUTAL - Néo-brutaliste
  brutal: {
    container: "group bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200",
    imageWrapper: "relative aspect-[16/10] border-b-[4px] border-black overflow-hidden",
    imageStyle: "object-cover group-hover:scale-105 transition-transform duration-300",
    contentWrapper: "p-5",
    category: "inline-block px-3 py-1 text-xs font-black uppercase tracking-wider bg-black text-white mb-3",
    title: "font-black text-xl md:text-2xl uppercase leading-tight mb-3 group-hover:underline decoration-4",
    excerpt: "text-gray-700 line-clamp-2 mb-4",
    meta: "flex items-center gap-4 text-xs font-bold uppercase text-gray-500",
    readMore: "font-black uppercase text-sm tracking-wider hover:underline",
  },

  // MINIMAL - Ultra clean
  minimal: {
    container: "group bg-white",
    imageWrapper: "relative aspect-[16/10] overflow-hidden mb-4",
    imageStyle: "object-cover rounded-sm",
    contentWrapper: "space-y-3",
    category: "text-xs font-medium uppercase tracking-widest text-gray-400",
    title: "font-light text-xl md:text-2xl text-gray-900 leading-snug group-hover:text-gray-600 transition-colors",
    excerpt: "text-gray-500 text-sm line-clamp-2",
    meta: "flex items-center gap-3 text-xs text-gray-400",
    readMore: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
  },

  // MAGAZINE - Style éditorial
  magazine: {
    container: "group bg-white border border-gray-200 hover:border-gray-400 transition-colors",
    imageWrapper: "relative aspect-[16/10] overflow-hidden",
    imageStyle: "object-cover group-hover:scale-102 transition-transform duration-500",
    contentWrapper: "p-6",
    category: "inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 mb-3",
    title: "font-serif text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-gray-700 transition-colors",
    excerpt: "text-gray-600 line-clamp-3 mb-4 leading-relaxed",
    meta: "flex items-center gap-4 text-sm text-gray-500",
    readMore: "font-semibold text-sm uppercase tracking-wider text-gray-900 hover:underline",
  },

  // TECH - Moderne avec gradients
  tech: {
    container: "group bg-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all",
    imageWrapper: "relative aspect-[16/10] overflow-hidden",
    imageStyle: "object-cover group-hover:scale-105 transition-transform duration-300",
    contentWrapper: "p-5",
    category: "inline-block px-2.5 py-1 text-xs font-mono font-medium bg-indigo-500/20 text-indigo-400 rounded-md mb-3",
    title: "font-mono font-bold text-lg md:text-xl text-white leading-tight mb-3",
    excerpt: "text-slate-400 text-sm line-clamp-2 mb-4",
    meta: "flex items-center gap-4 text-xs text-slate-500",
    readMore: "font-mono text-sm text-indigo-400 hover:text-indigo-300 transition-colors",
  },

  // FRESH - Coloré et dynamique
  fresh: {
    container: "group bg-white rounded-3xl shadow-lg hover:shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300",
    imageWrapper: "relative aspect-[16/10] overflow-hidden",
    imageStyle: "object-cover group-hover:scale-110 transition-transform duration-500",
    contentWrapper: "p-6",
    category: "inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white mb-3",
    title: "font-bold text-xl md:text-2xl text-gray-900 leading-tight mb-3",
    excerpt: "text-gray-600 line-clamp-2 mb-4",
    meta: "flex items-center gap-3 text-sm text-gray-500",
    readMore: "font-bold text-sm bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent",
  },
};

// ============================================================================
// FOOTER STYLES
// ============================================================================

export interface FooterStyleConfig {
  container: string;
  containerStyle: (primary: string, secondary: string) => React.CSSProperties;
  content: string;
  logo: string;
  logoStyle: (secondary: string) => React.CSSProperties;
  text: string;
  link: string;
  copyright: string;
}

export const FOOTER_STYLES: Record<SiteTemplate, FooterStyleConfig> = {
  // BRUTAL
  brutal: {
    container: "border-t-[5px] border-black",
    containerStyle: (primary) => ({ backgroundColor: primary }),
    content: "container mx-auto px-4 py-8",
    logo: "font-black text-2xl uppercase",
    logoStyle: () => ({}),
    text: "font-bold",
    link: "font-bold hover:underline decoration-2",
    copyright: "text-sm font-bold mt-6 pt-6 border-t-[3px] border-black/20",
  },

  // MINIMAL
  minimal: {
    container: "border-t border-gray-100 bg-white",
    containerStyle: () => ({}),
    content: "container mx-auto px-4 py-12",
    logo: "font-light text-xl tracking-[0.2em] uppercase text-gray-900",
    logoStyle: () => ({}),
    text: "text-gray-500 text-sm",
    link: "text-gray-500 hover:text-gray-900 text-sm transition-colors",
    copyright: "text-xs text-gray-400 mt-8 pt-8 border-t border-gray-100",
  },

  // MAGAZINE
  magazine: {
    container: "border-t-2 border-gray-900 bg-gray-50",
    containerStyle: () => ({}),
    content: "container mx-auto px-4 py-10",
    logo: "font-serif font-bold text-2xl text-gray-900",
    logoStyle: () => ({}),
    text: "text-gray-600",
    link: "text-gray-600 hover:text-gray-900 transition-colors",
    copyright: "text-sm text-gray-500 mt-8 pt-8 border-t border-gray-200",
  },

  // TECH
  tech: {
    container: "border-t border-slate-800 bg-slate-950",
    containerStyle: () => ({}),
    content: "container mx-auto px-4 py-10",
    logo: "font-mono font-bold text-xl text-white",
    logoStyle: () => ({}),
    text: "text-slate-400 text-sm",
    link: "text-slate-400 hover:text-indigo-400 text-sm transition-colors",
    copyright: "text-xs text-slate-600 mt-8 pt-8 border-t border-slate-800",
  },

  // FRESH
  fresh: {
    container: "bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl",
    containerStyle: () => ({}),
    content: "container mx-auto px-4 py-10",
    logo: "font-bold text-2xl text-white",
    logoStyle: () => ({}),
    text: "text-gray-400",
    link: "text-gray-400 hover:text-white transition-colors",
    copyright: "text-sm text-gray-500 mt-8 pt-8 border-t border-gray-700/50",
  },
};
