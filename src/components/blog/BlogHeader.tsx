"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTemplate, HEADER_STYLES, isLightColor } from "./TemplateContext";

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

  return (
    <header className={styles.container}>
      {/* Top accent bar */}
      <div style={styles.topBar(primaryColor, secondary)} />

      <div
        className={styles.wrapper(scrolled, primaryColor)}
        style={styles.wrapperStyle(primaryColor)}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo / Site Name */}
            <Link href="/" className="group flex items-center gap-4">
              {logoUrl ? (
                // If logo URL is provided, show the image
                <div className={`relative w-12 h-12 overflow-hidden ${template === "brutal" ? "border-[4px] border-black bg-white" : template === "minimal" ? "rounded-full" : template === "tech" ? "rounded-lg" : template === "fresh" ? "rounded-2xl shadow-md" : "border-2 border-gray-900"}`}>
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
                  style={{ backgroundColor: secondary }}
                >
                  <span
                    className={`font-bold ${template === "brutal" ? "font-black text-lg tracking-tight" : template === "tech" ? "font-mono text-sm" : "text-sm"}`}
                    style={{ color: isLightColor(secondary) ? "#000" : "#FFF" }}
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
                    className="absolute top-1 left-1 -z-10"
                    aria-hidden="true"
                  >
                    <span
                      className={`font-black uppercase tracking-tight ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}
                      style={{ color: secondary, opacity: 0.3 }}
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
            <nav className="hidden md:block">
              <Link
                href="/blog"
                className={styles.navButton}
                style={styles.navButtonStyle(secondary)}
              >
                Blog
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? (
                <X
                  className="w-6 h-6"
                  style={{ color: isLight ? "#000" : "#FFF" }}
                />
              ) : (
                <Menu
                  className="w-6 h-6"
                  style={{ color: isLight ? "#000" : "#FFF" }}
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
          style={{ top: template === "brutal" ? "calc(8px + 60px)" : "60px" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <nav
            className={`relative mx-4 mt-2 p-6 ${
              template === "brutal"
                ? "bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                : template === "minimal"
                ? "bg-white rounded-lg shadow-lg"
                : template === "magazine"
                ? "bg-white border-2 border-gray-900"
                : template === "tech"
                ? "bg-white rounded-xl shadow-xl border border-gray-200"
                : "bg-white rounded-2xl shadow-xl"
            }`}
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 text-lg font-bold ${
                template === "brutal"
                  ? "uppercase border-b-[3px] border-black"
                  : template === "minimal"
                  ? "text-gray-900 border-b border-gray-100"
                  : template === "tech"
                  ? "font-mono text-gray-900 border-b border-gray-200"
                  : "text-gray-900 border-b border-gray-200"
              }`}
            >
              Accueil
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 text-lg font-bold ${
                template === "brutal"
                  ? "uppercase"
                  : template === "minimal"
                  ? "text-gray-900"
                  : template === "tech"
                  ? "font-mono text-gray-900"
                  : "text-gray-900"
              }`}
            >
              Blog
            </Link>
          </nav>
        </div>
      )}

      {/* Bottom accent line */}
      {styles.bottomBar && <div className={styles.bottomBar} />}
    </header>
  );
}
