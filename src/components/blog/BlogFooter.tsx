import Link from "next/link";
import { Camera, Video, Sparkles, ArrowUpRight } from "lucide-react";

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
    accent: "#E91E63",
  },
  {
    name: "VintBoost",
    url: "https://vintboost.com",
    description: "Vidéos pro en 30s",
    icon: Video,
    accent: "#9C27B0",
  },
  {
    name: "VintPower",
    url: "https://vintpower.com",
    description: "Annonces optimisées",
    icon: Sparkles,
    accent: "#FF9800",
  },
];

export function BlogFooter({ siteName, primaryColor, secondaryColor }: BlogFooterProps) {
  const year = new Date().getFullYear();
  const secondary = secondaryColor || "#1a1a1a";

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Top zigzag border */}
      <div className="relative h-8 bg-black">
        <svg className="absolute bottom-0 w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path
            d="M0,20 L5,10 L10,20 L15,10 L20,20 L25,10 L30,20 L35,10 L40,20 L45,10 L50,20 L55,10 L60,20 L65,10 L70,20 L75,10 L80,20 L85,10 L90,20 L95,10 L100,20 L100,0 L0,0 Z"
            fill="black"
          />
        </svg>
        <svg className="absolute bottom-0 w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path
            d="M0,20 L5,10 L10,20 L15,10 L20,20 L25,10 L30,20 L35,10 L40,20 L45,10 L50,20 L55,10 L60,20 L65,10 L70,20 L75,10 L80,20 L85,10 L90,20 L95,10 L100,20"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="bg-black text-white relative">
        {/* Geometric decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large circle */}
          <div
            className="absolute -right-20 top-10 w-64 h-64 rounded-full opacity-10"
            style={{ backgroundColor: primaryColor }}
          />
          {/* Grid pattern */}
          <div className="absolute left-0 bottom-0 w-32 h-32 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: `linear-gradient(${primaryColor} 2px, transparent 2px), linear-gradient(90deg, ${primaryColor} 2px, transparent 2px)`,
              backgroundSize: '16px 16px'
            }} />
          </div>
          {/* Floating squares */}
          <div
            className="absolute left-1/4 top-8 w-6 h-6 rotate-45 border-2 opacity-30"
            style={{ borderColor: primaryColor }}
          />
          <div
            className="absolute right-1/3 bottom-20 w-4 h-4 rotate-12 opacity-40"
            style={{ backgroundColor: secondary }}
          />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Products section */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-[3px] bg-gradient-to-r from-transparent via-gray-700 to-gray-700" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
                Nos outils Vint
              </h3>
              <div className="flex-1 h-[3px] bg-gradient-to-l from-transparent via-gray-700 to-gray-700" />
            </div>

            {/* Asymmetric grid for products */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {VINT_PRODUCTS.map((product, index) => {
                const Icon = product.icon;
                const isFirst = index === 0;
                const colSpan = isFirst ? "md:col-span-6" : "md:col-span-3";

                return (
                  <a
                    key={product.name}
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      group relative overflow-hidden
                      ${colSpan}
                      border-[4px] border-white/20 hover:border-white
                      bg-gradient-to-br from-gray-900 to-black
                      transition-all duration-300
                      hover:shadow-[8px_8px_0px_0px] hover:-translate-x-1 hover:-translate-y-1
                    `}
                    style={{ "--tw-shadow-color": product.accent } as React.CSSProperties}
                  >
                    {/* Accent corner */}
                    <div
                      className="absolute top-0 right-0 w-12 h-12"
                      style={{
                        background: `linear-gradient(135deg, transparent 50%, ${product.accent} 50%)`
                      }}
                    />

                    <div className={`p-6 ${isFirst ? "md:p-8" : ""}`}>
                      {/* Icon with background */}
                      <div
                        className={`
                          inline-flex items-center justify-center mb-4
                          border-[3px] border-white/30
                          ${isFirst ? "w-16 h-16" : "w-12 h-12"}
                        `}
                        style={{ backgroundColor: product.accent + "30" }}
                      >
                        <Icon
                          className={isFirst ? "w-8 h-8" : "w-5 h-5"}
                          style={{ color: product.accent }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`font-black uppercase tracking-tight text-white group-hover:underline decoration-4 underline-offset-4 ${isFirst ? "text-2xl" : "text-lg"}`}>
                            {product.name}
                          </h4>
                          <p className={`text-gray-400 mt-1 ${isFirst ? "text-base" : "text-sm"}`}>
                            {product.description}
                          </p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div
                      className="h-1 w-0 group-hover:w-full transition-all duration-300"
                      style={{ backgroundColor: product.accent }}
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Separator with shapes */}
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-[3px] border-dashed border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <div
                className="px-4 bg-black flex items-center gap-3"
              >
                <div className="w-3 h-3 rotate-45 border-2 border-gray-700" />
                <div className="w-4 h-4 rounded-full border-2 border-gray-700" />
                <div className="w-3 h-3 rotate-45 border-2 border-gray-700" />
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Site name with geometric accent */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 border-[3px] border-white rotate-45"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xl font-black uppercase tracking-tight">
                {siteName}
              </span>
            </div>

            {/* Navigation and copyright */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                href="/blog"
                className="font-bold uppercase tracking-wider text-gray-400 hover:text-white border-b-2 border-transparent hover:border-white transition-all px-2 py-1"
              >
                Blog
              </Link>

              <div className="w-1 h-1 bg-gray-600 rounded-full" />

              <span className="text-gray-500">
                &copy; {year}
              </span>

              <div className="w-1 h-1 bg-gray-600 rounded-full" />

              <span className="text-gray-600 text-xs">
                Propulsé par VintCluster
              </span>
            </div>
          </div>
        </div>

        {/* Bottom geometric bar */}
        <div
          className="h-2"
          style={{
            background: `repeating-linear-gradient(90deg, ${primaryColor} 0px, ${primaryColor} 30px, transparent 30px, transparent 60px)`
          }}
        />
      </div>
    </footer>
  );
}
