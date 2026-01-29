"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
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
  const { template } = useTemplate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

            {/* Navigation */}
            <nav>
              <Link
                href="/blog"
                className={styles.navButton}
                style={styles.navButtonStyle(secondary)}
              >
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      {styles.bottomBar && <div className={styles.bottomBar} />}
    </header>
  );
}
