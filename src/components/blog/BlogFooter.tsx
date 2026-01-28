import Link from "next/link";
import { Camera, Video, Sparkles } from "lucide-react";

interface BlogFooterProps {
  siteName: string;
  primaryColor: string;
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

export function BlogFooter({ siteName, primaryColor }: BlogFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-black bg-black text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Section produits */}
        <div className="mb-8">
          <p className="text-center text-gray-400 mb-6 text-sm uppercase tracking-wider">
            Nos outils pour vendre plus sur Vinted
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VINT_PRODUCTS.map((product) => {
              const Icon = product.icon;
              return (
                <a
                  key={product.name}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 border-2 border-gray-700 rounded-lg hover:border-white transition-colors"
                  style={{
                    "--hover-bg": primaryColor
                  } as React.CSSProperties}
                >
                  <div
                    className="p-2 rounded-lg transition-colors group-hover:bg-white/10"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:underline">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {product.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-bold text-lg">{siteName}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <span>•</span>
              <p>&copy; {year} Tous droits réservés</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
