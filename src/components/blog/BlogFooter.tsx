"use client";

import Link from "next/link";
import { Camera, Video, Sparkles, ArrowUpRight } from "lucide-react";
import { useTemplate, FOOTER_STYLES, isLightColor } from "./TemplateContext";

interface BlogFooterProps {
  siteName: string;
  primaryColor: string;
  secondaryColor?: string;
}

const VINT_PRODUCTS = [
  {
    name: "VintDress",
    url: "https://vintdress.com",
    description: "Photos IA en 30s",
    icon: Camera,
  },
  {
    name: "VintBoost",
    url: "https://vintboost.com",
    description: "Vidéos pro en 30s",
    icon: Video,
  },
  {
    name: "VintPower",
    url: "https://vintpower.com",
    description: "Annonces optimisées",
    icon: Sparkles,
  },
];

export function BlogFooter({ siteName, primaryColor, secondaryColor }: BlogFooterProps) {
  const year = new Date().getFullYear();
  const secondary = secondaryColor || "#000000";
  const { template } = useTemplate();
  const styles = FOOTER_STYLES[template];
  const isLight = isLightColor(primaryColor);
  const textColor = isLight ? "#000000" : "#FFFFFF";
  const textMuted = isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";

  // Brutal template - full neobrutalist footer
  if (template === "brutal") {
    return (
      <footer className="relative mt-auto overflow-hidden">
        {/* Top border with geometric pattern */}
        <div
          className="h-2"
          style={{
            background: `repeating-linear-gradient(90deg, ${secondary} 0px, ${secondary} 20px, ${primaryColor} 20px, ${primaryColor} 40px)`
          }}
        />
        <div className="h-[6px] bg-black" />

        <div style={{ backgroundColor: primaryColor }}>
          <div className="container mx-auto px-4 py-12 relative">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute -right-10 top-10 w-40 h-40 rounded-full opacity-10"
                style={{ backgroundColor: secondary }}
              />
              <div
                className="absolute left-10 bottom-10 w-20 h-20 rotate-45 opacity-10 border-[6px]"
                style={{ borderColor: secondary }}
              />
            </div>

            {/* Products section */}
            <div className="mb-12 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-6 h-6 rotate-45 border-[3px]"
                  style={{ borderColor: textColor, backgroundColor: secondary }}
                />
                <h3
                  className="text-xs font-black uppercase tracking-[0.2em]"
                  style={{ color: textMuted }}
                >
                  Nos outils Vint
                </h3>
                <div className="flex-1 h-[3px]" style={{ backgroundColor: textMuted }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {VINT_PRODUCTS.map((product) => {
                  const Icon = product.icon;
                  return (
                    <a
                      key={product.name}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center gap-4 p-4 border-[4px] border-black bg-white text-black transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1"
                    >
                      <div
                        className="w-12 h-12 flex items-center justify-center border-[3px] border-black"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black uppercase tracking-tight group-hover:underline">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div
              className="border-t-[3px] border-dashed mb-8"
              style={{ borderColor: textMuted }}
            />

            {/* Bottom section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
              {/* Site name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border-[4px] border-black rotate-45 flex items-center justify-center"
                  style={{ backgroundColor: secondary }}
                >
                  <span
                    className="-rotate-45 font-black text-lg"
                    style={{ color: isLightColor(secondary) ? "#000" : "#FFF" }}
                  >
                    {siteName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span
                  className="text-xl font-black uppercase tracking-tight"
                  style={{ color: textColor }}
                >
                  {siteName}
                </span>
              </div>

              {/* Navigation and copyright */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Link
                  href="/blog"
                  className="font-bold uppercase tracking-wider px-3 py-1 border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
                >
                  Blog
                </Link>

                <span style={{ color: textMuted }}>&copy; {year}</span>

                <span className="text-xs" style={{ color: textMuted }}>
                  Propulsé par VintCluster
                </span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="h-3"
            style={{
              background: `repeating-linear-gradient(90deg, black 0px, black 10px, transparent 10px, transparent 20px)`
            }}
          />
        </div>
      </footer>
    );
  }

  // Other templates - simplified footer
  return (
    <footer className={`relative mt-auto ${styles.container}`} style={styles.containerStyle(primaryColor, secondary)}>
      <div className={styles.content}>
        {/* Products section */}
        <div className="mb-8">
          <h3 className={`text-xs uppercase tracking-widest mb-4 ${template === "tech" ? "text-slate-500" : "text-gray-400"}`}>
            Nos outils
          </h3>
          <div className={`flex flex-wrap gap-4 ${template === "tech" ? "gap-3" : ""}`}>
            {VINT_PRODUCTS.map((product) => {
              const Icon = product.icon;
              return (
                <a
                  key={product.name}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link + " flex items-center gap-2"}
                >
                  <Icon className="w-4 h-4" />
                  <span>{product.name}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Site name */}
          <span className={styles.logo} style={styles.logoStyle(secondary)}>
            {siteName}
          </span>

          {/* Navigation and copyright */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/blog" className={styles.link}>
              Blog
            </Link>
            <span className={styles.text}>&copy; {year}</span>
          </div>
        </div>

        {/* Copyright */}
        <div className={styles.copyright}>
          Propulsé par VintCluster
        </div>
      </div>
    </footer>
  );
}
