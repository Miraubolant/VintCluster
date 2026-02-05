"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { useTemplate, HEADER_STYLES, isLightColor, colorWithOpacity } from "./TemplateContext";

interface BlogHeaderProps {
  siteName: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string | null;
}

// Get initials from site name (max 2 characters)
function getInitials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function BlogHeader({ siteName, primaryColor, secondaryColor, logoUrl }: BlogHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { template } = useTemplate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside or navigating
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const secondary = secondaryColor || "#000000";
  const isLight = isLightColor(primaryColor);
  const initials = getInitials(siteName);
  const styles = HEADER_STYLES[template];

  // Get logo container class based on template
  const getLogoImageClass = () => {
    switch (template) {
      case "brutal":
        return "border-[5px] border-black bg-white";
      case "minimal":
        return "rounded-full border border-gray-100";
      case "magazine":
        return "border-2";
      case "tech":
        return "rounded-xl shadow-md";
      case "fresh":
        return "rounded-2xl";
      default:
        return "";
    }
  };

  // Get mobile menu icon color
  const getMobileIconColor = () => {
    if (template === "fresh") return "#FFF";
    if (template === "minimal") return "#374151";
    if (template === "tech") return "#374151";
    return isLight ? "#000" : "#FFF";
  };

  // Calculate mobile menu offset
  const getMobileMenuOffset = () => {
    switch (template) {
      case "brutal":
        return scrolled ? "calc(10px + 56px)" : "calc(10px + 76px)";
      case "minimal":
        return scrolled ? "56px" : "88px";
      case "magazine":
        return scrolled ? "calc(6px + 54px)" : "calc(6px + 76px)";
      case "tech":
        return scrolled ? "calc(3px + 52px)" : "calc(3px + 68px)";
      case "fresh":
        return scrolled ? "calc(3px + 56px)" : "calc(3px + 78px)";
      default:
        return "60px";
    }
  };

  return (
    <>
      {/* CSS Animation for Fresh template gradient */}
      {template === "fresh" && (
        <style jsx global>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      )}

      <header className={`${styles.container} ${template === "minimal" || template === "tech" ? "sticky top-0 z-40" : ""}`}>
        {/* Top accent bar */}
        <div style={styles.topBar(primaryColor, secondary)} />

        <div
          className={styles.wrapper(scrolled, primaryColor)}
          style={styles.wrapperStyle(primaryColor, secondary)}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo / Site Name */}
              <Link href="/" className="group flex items-center gap-4">
                {logoUrl ? (
                  // If logo URL is provided, show the image
                  <div
                    className={`relative overflow-hidden transition-all duration-300 ${getLogoImageClass()} ${scrolled ? "w-10 h-10" : "w-12 h-12"}`}
                    style={template === "magazine" ? { borderColor: primaryColor } : template === "fresh" ? { boxShadow: `0 8px 30px ${colorWithOpacity(primaryColor, 0.4)}` } : {}}
                  >
                    <Image
                      src={logoUrl}
                      alt={siteName}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  // Geometric initials badge
                  <div
                    className={styles.logoContainer}
                    style={styles.logoContainerStyle(primaryColor, secondary)}
                  >
                    <span
                      className={`font-bold ${template === "brutal" ? "font-black text-lg tracking-tight" : template === "tech" ? "font-mono text-sm" : template === "minimal" ? "text-xs tracking-widest" : "text-sm"}`}
                      style={{ color: template === "minimal" ? primaryColor : isLightColor(template === "brutal" || template === "magazine" ? secondary : primaryColor) ? "#000" : "#FFF" }}
                    >
                      {initials}
                    </span>
                  </div>
                )}

                {/* Site name */}
                <div className="relative">
                  {/* Shadow effect for brutal template */}
                  {template === "brutal" && (
                    <div
                      className="absolute top-1.5 left-1.5 -z-10"
                      aria-hidden="true"
                    >
                      <span
                        className={`font-black uppercase tracking-tight transition-all ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"}`}
                        style={{ color: secondary, opacity: 0.25 }}
                      >
                        {siteName}
                      </span>
                    </div>
                  )}
                  <span className={styles.logoText(scrolled, isLight)}>
                    {siteName}
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-4">
                {/* Navigation links for some templates */}
                {(template === "minimal" || template === "magazine") && (
                  <Link
                    href="/"
                    className={template === "minimal"
                      ? "text-[13px] font-light tracking-[0.15em] uppercase text-gray-400 hover:text-gray-900 transition-all duration-300"
                      : "text-sm font-bold uppercase tracking-wide text-gray-600 hover:text-gray-900 transition-colors"
                    }
                  >
                    Accueil
                  </Link>
                )}
                <Link
                  href="/blog"
                  className={styles.navButton}
                  style={styles.navButtonStyle(primaryColor, secondary)}
                >
                  {template === "brutal" && <span>→</span>}
                  Blog
                  {template === "fresh" && <ArrowRight className="w-4 h-4 ml-1 inline" />}
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className={`md:hidden p-2.5 -mr-2 transition-all duration-200 ${
                  template === "brutal"
                    ? "border-[3px] border-black bg-white hover:bg-black hover:text-white"
                    : template === "fresh"
                    ? "rounded-xl bg-white/10 hover:bg-white/20"
                    : template === "tech"
                    ? "rounded-xl hover:bg-gray-100"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                {mobileMenuOpen ? (
                  <X
                    className="w-6 h-6 transition-transform duration-200"
                    style={{ color: getMobileIconColor() }}
                  />
                ) : (
                  <Menu
                    className="w-6 h-6 transition-transform duration-200"
                    style={{ color: getMobileIconColor() }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50"
            style={{ top: getMobileMenuOffset() }}
          >
            {/* Backdrop */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${template === "fresh" ? "bg-black/70 backdrop-blur-sm" : "bg-black/50"}`}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <nav
              className={`relative mx-4 mt-2 p-6 ${styles.mobileMenuClass} animate-in slide-in-from-top-4 duration-200`}
              style={styles.mobileMenuStyle(primaryColor, secondary)}
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-4 text-lg ${styles.mobileLinkClass}`}
              >
                Accueil
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-4 text-lg ${styles.mobileLinkClass} border-b-0`}
              >
                Blog
              </Link>

              {/* Extra CTA for some templates */}
              {(template === "fresh" || template === "brutal") && (
                <div
                  className={`mt-4 pt-4 ${template === "brutal" ? "border-t-[3px] border-black" : "border-t border-white/10"}`}
                >
                  <Link
                    href="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-2 py-3 ${
                      template === "brutal"
                        ? "font-black uppercase text-sm bg-black text-white border-[3px] border-black"
                        : "font-bold text-sm rounded-xl"
                    }`}
                    style={template === "fresh" ? {
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondary})`,
                      color: isLightColor(primaryColor) ? "#000" : "#FFF",
                    } : {}}
                  >
                    Découvrir le blog
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}

        {/* Bottom accent line */}
        {styles.bottomBar && <div className={styles.bottomBar} />}
      </header>
    </>
  );
}
