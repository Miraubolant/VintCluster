"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteTemplate } from "@/types/database";

// Re-export color utilities from shared module
export {
  isLightColor,
  lightenColor,
  darkenColor,
  colorWithOpacity,
} from "@/lib/utils/colors";

// Import for local use
import { isLightColor, lightenColor, darkenColor, colorWithOpacity } from "@/lib/utils/colors";

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
// HEADER STYLES
// ============================================================================

export interface HeaderStyleConfig {
  // Container global
  container: string;
  // Barre d'accent en haut
  topBar: (primary: string, secondary: string) => React.CSSProperties;
  // Wrapper principal
  wrapper: (scrolled: boolean, primary: string) => string;
  wrapperStyle: (primary: string, secondary: string) => React.CSSProperties;
  // Container du logo
  logoContainer: string;
  logoContainerStyle: (primary: string, secondary: string) => React.CSSProperties;
  // Texte du logo
  logoText: (scrolled: boolean, isLight: boolean) => string;
  logoTextStyle: (primary: string, secondary: string) => React.CSSProperties;
  // Bouton navigation
  navButton: string;
  navButtonStyle: (primary: string, secondary: string) => React.CSSProperties;
  // Barre en bas
  bottomBar: string;
  bottomBarStyle: (primary: string, secondary: string) => React.CSSProperties;
  // Mobile menu
  mobileMenuClass: string;
  mobileMenuStyle: (primary: string, secondary: string) => React.CSSProperties;
  mobileLinkClass: string;
}

export const HEADER_STYLES: Record<SiteTemplate, HeaderStyleConfig> = {
  // ============================================================================
  // BRUTAL - Néo-brutaliste hardcore
  // Bordures épaisses 4px+, ombres décalées, couleurs vives, uppercase
  // ============================================================================
  brutal: {
    container: "relative",
    topBar: (primary, secondary) => ({
      background: `repeating-linear-gradient(90deg, ${primary} 0px, ${primary} 20px, ${secondary} 20px, ${secondary} 40px)`,
      height: "10px",
    }),
    wrapper: (scrolled) => `relative border-b-[6px] border-black transition-all duration-200 ${scrolled ? "py-3" : "py-6"}`,
    wrapperStyle: (primary) => ({ backgroundColor: primary }),
    logoContainer: "w-14 h-14 border-[5px] border-black flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-200",
    logoContainerStyle: (_, secondary) => ({ backgroundColor: secondary }),
    logoText: (scrolled, isLight) => `font-black uppercase tracking-tight transition-all ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"} ${isLight ? "text-black" : "text-white"}`,
    logoTextStyle: () => ({}),
    navButton: "px-6 py-2.5 font-black uppercase text-sm tracking-wider border-[5px] border-black transition-all hover:shadow-[6px_6px_0px_0px] hover:-translate-x-1 hover:-translate-y-1",
    navButtonStyle: (_, secondary) => ({
      backgroundColor: secondary,
      color: isLightColor(secondary) ? "#000" : "#FFF",
    }),
    bottomBar: "h-[4px] bg-black",
    bottomBarStyle: () => ({}),
    mobileMenuClass: "bg-white border-[5px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]",
    mobileMenuStyle: () => ({}),
    mobileLinkClass: "uppercase font-black border-b-[4px] border-black hover:pl-4 transition-all",
  },

  // ============================================================================
  // MINIMAL - Apple/Swiss Design
  // Ultra épuré, typographie fine Helvetica-like, beaucoup de blanc
  // Accents de couleur très subtils, tracking large
  // ============================================================================
  minimal: {
    container: "relative",
    topBar: () => ({ height: "0px", display: "none" }),
    wrapper: (scrolled) => `transition-all duration-700 ease-out ${scrolled ? "py-4 backdrop-blur-lg bg-white/90" : "py-10 bg-white"}`,
    wrapperStyle: () => ({}),
    logoContainer: "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105",
    logoContainerStyle: (primary) => ({
      backgroundColor: colorWithOpacity(primary, 0.06),
      border: `1px solid ${colorWithOpacity(primary, 0.12)}`,
    }),
    logoText: (scrolled) => `font-extralight tracking-[0.4em] uppercase transition-all duration-500 ${scrolled ? "text-xs" : "text-sm"} text-gray-700`,
    logoTextStyle: () => ({}),
    navButton: "px-1 py-2 text-[13px] font-light tracking-[0.15em] uppercase text-gray-400 hover:text-gray-900 transition-all duration-300 relative after:absolute after:bottom-1 after:left-0 after:w-0 after:h-px after:bg-gray-900 hover:after:w-full after:transition-all after:duration-300",
    navButtonStyle: () => ({}),
    bottomBar: "",
    bottomBarStyle: () => ({}),
    mobileMenuClass: "bg-white/95 backdrop-blur-xl shadow-2xl",
    mobileMenuStyle: () => ({}),
    mobileLinkClass: "font-extralight tracking-[0.15em] uppercase text-gray-600 border-b border-gray-100 hover:text-gray-900 hover:tracking-[0.2em] transition-all duration-300",
  },

  // ============================================================================
  // MAGAZINE - The Verge/Modern Editorial
  // Layout dynamique, couleurs vives utilisées fortement, typographie bold
  // Grandes images, titres accrocheurs
  // ============================================================================
  magazine: {
    container: "relative bg-white",
    topBar: (primary) => ({
      height: "6px",
      backgroundColor: primary,
    }),
    wrapper: (scrolled) => `transition-all duration-300 ${scrolled ? "py-3 shadow-md" : "py-6"}`,
    wrapperStyle: (primary) => ({
      backgroundColor: "#ffffff",
      borderBottom: `4px solid ${primary}`,
    }),
    logoContainer: "w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
    logoContainerStyle: (primary) => ({
      backgroundColor: primary,
    }),
    logoText: (scrolled) => `font-black tracking-tight transition-all ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"} text-gray-900`,
    logoTextStyle: () => ({}),
    navButton: "px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-all hover:opacity-80 hover:-translate-y-0.5",
    navButtonStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
    }),
    bottomBar: "",
    bottomBarStyle: () => ({}),
    mobileMenuClass: "bg-white border-t-[6px] shadow-xl",
    mobileMenuStyle: (primary) => ({ borderColor: primary }),
    mobileLinkClass: "font-extrabold text-gray-900 border-b-2 border-gray-100 hover:pl-2 transition-all",
  },

  // ============================================================================
  // TECH - Stripe/Notion Style
  // Propre et professionnel, palette colorée du site, coins arrondis
  // Ombres subtiles, police claire, transitions fluides
  // ============================================================================
  tech: {
    container: "relative",
    topBar: (primary, secondary) => ({
      height: "3px",
      background: `linear-gradient(90deg, ${primary}, ${lightenColor(primary, 30)}, ${secondary})`,
    }),
    wrapper: (scrolled) => `transition-all duration-500 ${scrolled ? "py-3 backdrop-blur-md bg-white/95 shadow-lg" : "py-5 bg-white/80"}`,
    wrapperStyle: () => ({
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    }),
    logoContainer: "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-xl group-hover:scale-105",
    logoContainerStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      boxShadow: `0 4px 20px ${colorWithOpacity(primary, 0.25)}`,
    }),
    logoText: (scrolled) => `font-semibold tracking-tight transition-all duration-300 ${scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"} text-gray-900`,
    logoTextStyle: () => ({}),
    navButton: "px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
    navButtonStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
      boxShadow: `0 2px 10px ${colorWithOpacity(primary, 0.3)}`,
    }),
    bottomBar: "",
    bottomBarStyle: () => ({}),
    mobileMenuClass: "bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100",
    mobileMenuStyle: () => ({}),
    mobileLinkClass: "font-medium text-gray-700 border-b border-gray-100 hover:text-gray-900 hover:pl-2 transition-all duration-200",
  },

  // ============================================================================
  // FRESH - TikTok/Instagram Gen-Z Style
  // FOND SOMBRE, néons, effets glass, gradients audacieux
  // Très arrondi, ombres colorées, animations
  // ============================================================================
  fresh: {
    container: "relative",
    topBar: (primary, secondary) => ({
      height: "3px",
      background: `linear-gradient(90deg, ${primary}, ${secondary}, ${lightenColor(primary, 50)}, ${primary})`,
      backgroundSize: "300% 100%",
      animation: "gradient-shift 4s ease infinite",
    }),
    wrapper: (scrolled) => `transition-all duration-500 ${scrolled ? "py-3 backdrop-blur-xl bg-black/80" : "py-6 bg-black/60"}`,
    wrapperStyle: (primary) => ({
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${colorWithOpacity(primary, 0.15)}`,
    }),
    logoContainer: "w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
    logoContainerStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      boxShadow: `0 8px 40px ${colorWithOpacity(primary, 0.5)}, 0 0 60px ${colorWithOpacity(primary, 0.2)}`,
    }),
    logoText: (scrolled) => `font-bold tracking-tight transition-all duration-300 ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} text-white`,
    logoTextStyle: () => ({}),
    navButton: "px-7 py-3 text-sm font-bold rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
    navButtonStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      color: isLightColor(primary) ? "#000" : "#FFF",
      boxShadow: `0 8px 30px ${colorWithOpacity(primary, 0.5)}, 0 0 40px ${colorWithOpacity(primary, 0.25)}`,
    }),
    bottomBar: "",
    bottomBarStyle: () => ({}),
    mobileMenuClass: "bg-gray-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl",
    mobileMenuStyle: (primary) => ({
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${colorWithOpacity(primary, 0.15)}`,
    }),
    mobileLinkClass: "font-bold text-white border-b border-white/10 hover:pl-4 hover:text-opacity-80 transition-all duration-200",
  },
};

// ============================================================================
// CARD STYLES
// ============================================================================

export interface CardStyleConfig {
  container: string;
  containerStyle: (primary: string, secondary: string) => React.CSSProperties;
  imageWrapper: string;
  imageStyle: string;
  contentWrapper: string;
  category: string;
  categoryStyle: (primary: string, secondary: string) => React.CSSProperties;
  title: string;
  titleStyle: (primary: string, secondary: string) => React.CSSProperties;
  excerpt: string;
  meta: string;
  readMore: string;
  readMoreStyle: (primary: string, secondary: string) => React.CSSProperties;
}

export const CARD_STYLES: Record<SiteTemplate, CardStyleConfig> = {
  // BRUTAL - Bordures épaisses, ombres décalées
  brutal: {
    container: "group bg-white border-[4px] border-black shadow-[8px_8px_0px_0px] hover:shadow-[12px_12px_0px_0px] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200",
    containerStyle: (primary) => ({ "--tw-shadow-color": primary } as React.CSSProperties),
    imageWrapper: "relative aspect-[16/10] border-b-[4px] border-black overflow-hidden",
    imageStyle: "object-cover group-hover:scale-105 transition-transform duration-300",
    contentWrapper: "p-5",
    category: "inline-block px-3 py-1 text-xs font-black uppercase tracking-wider mb-3",
    categoryStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF"
    }),
    title: "font-black text-xl md:text-2xl uppercase leading-tight mb-3 group-hover:underline decoration-4",
    titleStyle: (primary) => ({ textDecorationColor: primary }),
    excerpt: "text-gray-700 line-clamp-2 mb-4",
    meta: "flex items-center gap-4 text-xs font-bold uppercase text-gray-500",
    readMore: "font-black uppercase text-sm tracking-wider",
    readMoreStyle: (primary) => ({ color: darkenColor(primary, 20) }),
  },

  // MINIMAL - Apple/Swiss clean
  minimal: {
    container: "group bg-white transition-all duration-500",
    containerStyle: () => ({}),
    imageWrapper: "relative aspect-[16/10] overflow-hidden mb-6",
    imageStyle: "object-cover transition-transform duration-700 group-hover:scale-102",
    contentWrapper: "space-y-4",
    category: "text-[11px] font-medium uppercase tracking-[0.2em]",
    categoryStyle: (primary) => ({ color: primary }),
    title: "font-light text-xl md:text-2xl leading-snug text-gray-800 group-hover:text-gray-600 transition-colors",
    titleStyle: () => ({}),
    excerpt: "text-gray-400 text-sm leading-relaxed line-clamp-2",
    meta: "flex items-center gap-3 text-[11px] text-gray-400 tracking-wide",
    readMore: "text-sm font-normal tracking-wide transition-colors",
    readMoreStyle: (primary) => ({ color: primary }),
  },

  // MAGAZINE - The Verge modern editorial
  magazine: {
    container: "group bg-white overflow-hidden hover:shadow-xl transition-all duration-300",
    containerStyle: (primary) => ({
      borderLeft: `4px solid ${primary}`,
    }),
    imageWrapper: "relative aspect-[16/10] overflow-hidden",
    imageStyle: "object-cover group-hover:scale-105 transition-transform duration-500",
    contentWrapper: "p-5",
    category: "inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wide mb-3",
    categoryStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
    }),
    title: "font-extrabold text-xl md:text-2xl leading-tight mb-3 text-gray-900",
    titleStyle: () => ({}),
    excerpt: "text-gray-600 line-clamp-2 mb-4",
    meta: "flex items-center gap-4 text-sm text-gray-500 font-medium",
    readMore: "font-bold text-sm uppercase tracking-wide",
    readMoreStyle: (primary) => ({ color: primary }),
  },

  // TECH - Stripe/Notion clean
  tech: {
    container: "group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300",
    containerStyle: () => ({}),
    imageWrapper: "relative aspect-[16/10] overflow-hidden",
    imageStyle: "object-cover group-hover:scale-105 transition-transform duration-300",
    contentWrapper: "p-5",
    category: "inline-block px-3 py-1.5 text-xs font-medium rounded-lg mb-3",
    categoryStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${colorWithOpacity(primary, 0.15)}, ${colorWithOpacity(secondary, 0.15)})`,
      color: darkenColor(primary, 40),
    }),
    title: "font-semibold text-lg md:text-xl leading-tight mb-3 text-gray-900",
    titleStyle: () => ({}),
    excerpt: "text-gray-600 text-sm line-clamp-2 mb-4",
    meta: "flex items-center gap-4 text-xs text-gray-500",
    readMore: "text-sm font-medium transition-colors",
    readMoreStyle: (primary) => ({ color: primary }),
  },

  // FRESH - TikTok/Instagram dark mode
  fresh: {
    container: "group bg-gray-900 rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300",
    containerStyle: (primary) => ({
      boxShadow: `0 20px 60px ${colorWithOpacity(primary, 0.2)}`,
    }),
    imageWrapper: "relative aspect-[16/10] overflow-hidden",
    imageStyle: "object-cover group-hover:scale-110 transition-transform duration-500",
    contentWrapper: "p-6",
    category: "inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full mb-4",
    categoryStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      color: isLightColor(primary) ? "#000" : "#FFF",
      boxShadow: `0 4px 15px ${colorWithOpacity(primary, 0.4)}`,
    }),
    title: "font-bold text-xl md:text-2xl leading-tight mb-3 text-white",
    titleStyle: () => ({}),
    excerpt: "text-gray-400 line-clamp-2 mb-4",
    meta: "flex items-center gap-3 text-sm text-gray-500",
    readMore: "font-bold text-sm",
    readMoreStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    } as React.CSSProperties),
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
  logoStyle: (primary: string, secondary: string) => React.CSSProperties;
  text: string;
  textStyle: (primary: string, secondary: string) => React.CSSProperties;
  link: string;
  linkStyle: (primary: string, secondary: string) => React.CSSProperties;
  copyright: string;
  copyrightStyle: (primary: string, secondary: string) => React.CSSProperties;
}

export const FOOTER_STYLES: Record<SiteTemplate, FooterStyleConfig> = {
  // BRUTAL
  brutal: {
    container: "border-t-[5px] border-black",
    containerStyle: (primary) => ({ backgroundColor: primary }),
    content: "container mx-auto px-4 py-8",
    logo: "font-black text-2xl uppercase",
    logoStyle: (_, secondary) => ({ color: secondary }),
    text: "font-bold",
    textStyle: (primary) => ({ color: isLightColor(primary) ? "#000" : "#FFF" }),
    link: "font-bold hover:underline decoration-2",
    linkStyle: (_, secondary) => ({ color: secondary }),
    copyright: "text-sm font-bold mt-6 pt-6 border-t-[3px]",
    copyrightStyle: (_, secondary) => ({ borderColor: colorWithOpacity(secondary, 0.3) }),
  },

  // MINIMAL - Apple/Swiss
  minimal: {
    container: "bg-white",
    containerStyle: () => ({ borderTop: "1px solid #f3f4f6" }),
    content: "container mx-auto px-4 py-16",
    logo: "font-light text-lg tracking-[0.35em] uppercase text-gray-800",
    logoStyle: () => ({}),
    text: "text-sm text-gray-400",
    textStyle: () => ({}),
    link: "text-sm text-gray-500 hover:text-gray-900 transition-colors",
    linkStyle: () => ({}),
    copyright: "text-xs text-gray-400 mt-12 pt-8 border-t border-gray-100",
    copyrightStyle: () => ({}),
  },

  // MAGAZINE - The Verge
  magazine: {
    container: "",
    containerStyle: (primary) => ({
      backgroundColor: primary,
    }),
    content: "container mx-auto px-4 py-10",
    logo: "font-extrabold text-2xl",
    logoStyle: (primary) => ({ color: isLightColor(primary) ? "#000" : "#FFF" }),
    text: "",
    textStyle: (primary) => ({ color: isLightColor(primary) ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)" }),
    link: "transition-colors hover:underline",
    linkStyle: (primary) => ({ color: isLightColor(primary) ? "#000" : "#FFF" }),
    copyright: "text-sm mt-8 pt-8 border-t",
    copyrightStyle: (primary) => ({
      color: isLightColor(primary) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
      borderColor: isLightColor(primary) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
    }),
  },

  // TECH - Stripe/Notion
  tech: {
    container: "bg-gray-50",
    containerStyle: () => ({ borderTop: "1px solid #e5e7eb" }),
    content: "container mx-auto px-4 py-12",
    logo: "font-semibold text-xl text-gray-900",
    logoStyle: () => ({}),
    text: "text-sm text-gray-600",
    textStyle: () => ({}),
    link: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
    linkStyle: () => ({}),
    copyright: "text-xs text-gray-500 mt-10 pt-8 border-t border-gray-200",
    copyrightStyle: () => ({}),
  },

  // FRESH - TikTok/Instagram dark
  fresh: {
    container: "bg-black",
    containerStyle: () => ({}),
    content: "container mx-auto px-4 py-12",
    logo: "font-bold text-2xl text-white",
    logoStyle: () => ({}),
    text: "text-gray-500",
    textStyle: () => ({}),
    link: "text-gray-500 hover:text-white transition-colors",
    linkStyle: () => ({}),
    copyright: "text-sm text-gray-600 mt-10 pt-8 border-t border-gray-800",
    copyrightStyle: () => ({}),
  },
};

// ============================================================================
// PAGE BACKGROUND STYLES (pour cohérence globale)
// ============================================================================

export interface PageStyleConfig {
  body: string;
  bodyStyle: (primary: string, secondary: string) => React.CSSProperties;
  mainContent: string;
  mainContentStyle: (primary: string, secondary: string) => React.CSSProperties;
}

export const PAGE_STYLES: Record<SiteTemplate, PageStyleConfig> = {
  brutal: {
    body: "bg-white",
    bodyStyle: () => ({}),
    mainContent: "bg-white",
    mainContentStyle: () => ({}),
  },
  minimal: {
    body: "bg-white",
    bodyStyle: () => ({}),
    mainContent: "bg-white",
    mainContentStyle: () => ({}),
  },
  magazine: {
    body: "bg-gray-50",
    bodyStyle: () => ({}),
    mainContent: "bg-white",
    mainContentStyle: () => ({}),
  },
  tech: {
    body: "bg-white",
    bodyStyle: () => ({}),
    mainContent: "bg-white",
    mainContentStyle: () => ({}),
  },
  fresh: {
    body: "bg-black",
    bodyStyle: () => ({}),
    mainContent: "bg-gray-950",
    mainContentStyle: () => ({}),
  },
};

// ============================================================================
// BUTTON STYLES (pour cohérence des CTAs)
// ============================================================================

export interface ButtonStyleConfig {
  primary: string;
  primaryStyle: (primary: string, secondary: string) => React.CSSProperties;
  secondary: string;
  secondaryStyle: (primary: string, secondary: string) => React.CSSProperties;
  ghost: string;
  ghostStyle: (primary: string, secondary: string) => React.CSSProperties;
}

export const BUTTON_STYLES: Record<SiteTemplate, ButtonStyleConfig> = {
  brutal: {
    primary: "px-6 py-3 font-black uppercase text-sm tracking-wider border-[4px] border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
    primaryStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
    }),
    secondary: "px-6 py-3 font-black uppercase text-sm tracking-wider bg-white border-[4px] border-black hover:bg-gray-100 transition-all",
    secondaryStyle: () => ({}),
    ghost: "px-4 py-2 font-black uppercase text-sm tracking-wider hover:underline decoration-4",
    ghostStyle: (primary) => ({ textDecorationColor: primary }),
  },
  minimal: {
    primary: "px-6 py-3 text-sm font-normal tracking-wide transition-colors",
    primaryStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
    }),
    secondary: "px-6 py-3 text-sm font-normal tracking-wide border border-gray-300 hover:border-gray-900 transition-colors",
    secondaryStyle: () => ({}),
    ghost: "px-4 py-2 text-sm font-normal tracking-wide text-gray-600 hover:text-gray-900 transition-colors",
    ghostStyle: () => ({}),
  },
  magazine: {
    primary: "px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90",
    primaryStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
    }),
    secondary: "px-6 py-3 text-sm font-bold uppercase tracking-wide border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all",
    secondaryStyle: () => ({}),
    ghost: "px-4 py-2 text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-gray-900 transition-colors",
    ghostStyle: () => ({}),
  },
  tech: {
    primary: "px-6 py-3 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all",
    primaryStyle: (primary) => ({
      backgroundColor: primary,
      color: isLightColor(primary) ? "#000" : "#FFF",
    }),
    secondary: "px-6 py-3 text-sm font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-all",
    secondaryStyle: () => ({}),
    ghost: "px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors",
    ghostStyle: () => ({}),
  },
  fresh: {
    primary: "px-6 py-3 text-sm font-bold rounded-full transition-all hover:scale-105",
    primaryStyle: (primary, secondary) => ({
      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      color: isLightColor(primary) ? "#000" : "#FFF",
      boxShadow: `0 8px 30px ${colorWithOpacity(primary, 0.4)}`,
    }),
    secondary: "px-6 py-3 text-sm font-bold rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all",
    secondaryStyle: () => ({}),
    ghost: "px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors",
    ghostStyle: () => ({}),
  },
};
