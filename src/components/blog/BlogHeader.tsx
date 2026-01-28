"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface BlogHeaderProps {
  siteName: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string | null;
}

// Determine if color is light or dark to choose text color
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const secondary = secondaryColor || "#000000";
  const isLight = isLightColor(primaryColor);
  const initials = getInitials(siteName);

  return (
    <header className="relative">
      {/* Top accent bar */}
      <div
        className="h-2"
        style={{
          background: `repeating-linear-gradient(90deg, ${primaryColor} 0px, ${primaryColor} 20px, ${secondary} 20px, ${secondary} 40px)`
        }}
      />

      <div
        className={`
          relative border-b-[5px] border-black transition-all duration-300
          ${scrolled ? "py-3" : "py-5"}
        `}
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo / Site Name */}
            <Link href="/" className="group flex items-center gap-4">
              {logoUrl ? (
                // If logo URL is provided, show the image
                <div className="relative w-12 h-12 border-[4px] border-black bg-white overflow-hidden">
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
                  className="w-12 h-12 border-[4px] border-black flex items-center justify-center rotate-0 group-hover:rotate-6 transition-transform"
                  style={{ backgroundColor: secondary }}
                >
                  <span
                    className="font-black text-lg tracking-tight"
                    style={{ color: isLightColor(secondary) ? "#000" : "#FFF" }}
                  >
                    {initials}
                  </span>
                </div>
              )}

              {/* Site name with shadow effect */}
              <div className="relative">
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
                <span
                  className={`font-black uppercase tracking-tight transition-all ${scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}
                  style={{ color: isLight ? "#000" : "#FFF" }}
                >
                  {siteName}
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav>
              <Link
                href="/blog"
                className="group relative px-5 py-2 font-black uppercase text-sm tracking-wider bg-black text-white border-[4px] border-black transition-all hover:shadow-[4px_4px_0px_0px] hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{ "--tw-shadow-color": secondary } as React.CSSProperties}
              >
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[3px] bg-black" />
    </header>
  );
}
