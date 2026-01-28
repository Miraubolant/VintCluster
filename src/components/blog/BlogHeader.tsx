"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface BlogHeaderProps {
  siteName: string;
  primaryColor: string;
  secondaryColor?: string;
}

export function BlogHeader({ siteName, primaryColor, secondaryColor }: BlogHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const secondary = secondaryColor || "#000000";

  return (
    <header className="relative">
      {/* Geometric decorations - top bar */}
      <div
        className="h-3 w-full"
        style={{
          background: `repeating-linear-gradient(90deg, ${primaryColor} 0px, ${primaryColor} 20px, ${secondary} 20px, ${secondary} 40px, #000 40px, #000 60px)`
        }}
      />

      <div
        className={`
          relative border-b-[6px] border-black transition-all duration-300
          ${scrolled ? "py-4" : "py-8"}
        `}
        style={{ backgroundColor: primaryColor }}
      >
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Triangle top-right */}
          <div
            className="absolute -top-2 right-12 w-16 h-16 border-[6px] border-black rotate-45"
            style={{ backgroundColor: secondary }}
          />
          {/* Circle bottom-left */}
          <div
            className="absolute -bottom-4 left-8 w-12 h-12 rounded-full border-[6px] border-black bg-white"
          />
          {/* Small square */}
          <div
            className="absolute top-1/2 right-1/4 w-8 h-8 border-4 border-black bg-black rotate-12 hidden md:block"
          />
          {/* Zigzag line */}
          <svg
            className="absolute bottom-0 left-1/3 w-32 h-6 hidden lg:block"
            viewBox="0 0 100 20"
          >
            <path
              d="M0,10 L10,0 L20,10 L30,0 L40,10 L50,0 L60,10 L70,0 L80,10 L90,0 L100,10"
              stroke="black"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="group inline-block">
              <div className="relative">
                {/* Shadow layer */}
                <div
                  className="absolute top-2 left-2 bg-black px-4 py-2 -z-10 transition-all group-hover:top-3 group-hover:left-3"
                  aria-hidden="true"
                >
                  <span className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter opacity-0">
                    {siteName}
                  </span>
                </div>
                {/* Main text */}
                <div
                  className="relative bg-white border-[5px] border-black px-4 py-2 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1"
                >
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-black">
                    {siteName}
                  </h1>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                href="/blog"
                className="group relative px-5 py-2 font-black uppercase text-sm tracking-wider bg-black text-white border-4 border-black transition-all hover:bg-white hover:text-black"
              >
                <span className="relative z-10">Blog</span>
                {/* Hover decoration */}
                <div
                  className="absolute -bottom-1 -right-1 w-full h-full border-4 border-black opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                />
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom decorative dots */}
        <div className="absolute bottom-2 left-4 flex gap-2 opacity-50">
          <div className="w-2 h-2 bg-black rounded-full" />
          <div className="w-2 h-2 bg-black rounded-full" />
          <div className="w-2 h-2 bg-black rounded-full" />
        </div>
      </div>
    </header>
  );
}
