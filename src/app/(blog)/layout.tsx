import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSiteByDomain } from "@/lib/actions/blog";
import { BlogHeader, BlogFooter } from "@/components/blog";
import { TemplateProvider } from "@/components/blog/TemplateContext";
import type { SiteTemplate } from "@/types/database";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || "";

  // Extraire le domaine (sans port pour localhost)
  const domain = host.split(":")[0];

  // Sur localhost, afficher une page d'accueil par défaut si pas de site
  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";

  // Récupérer le site par domaine
  const site = await getSiteByDomain(domain);

  // Si pas de site trouvé et pas localhost admin, 404
  if (!site && !isLocalhost) {
    notFound();
  }

  // Valeurs par défaut pour localhost sans site
  const siteName = site?.name || "VintCluster Blog";
  const primaryColor = site?.primary_color || "#FFE500";
  const secondaryColor = site?.secondary_color || "#000000";
  const logoUrl = site?.logo_url || null;
  const template = (site?.template as SiteTemplate) || "brutal";

  // Background styles per template
  const getBackgroundStyles = () => {
    switch (template) {
      case "minimal":
        return {
          className: "min-h-screen flex flex-col bg-white",
          pattern: null,
        };
      case "magazine":
        return {
          className: "min-h-screen flex flex-col bg-gray-50",
          pattern: null,
        };
      case "tech":
        return {
          className: "min-h-screen flex flex-col bg-white",
          pattern: {
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99,102,241,0.06) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          },
        };
      case "fresh":
        return {
          className: "min-h-screen flex flex-col bg-black",
          pattern: null,
        };
      case "brutal":
      default:
        return {
          className: "min-h-screen flex flex-col bg-gray-100",
          pattern: {
            backgroundImage: `
              linear-gradient(${primaryColor} 1px, transparent 1px),
              linear-gradient(90deg, ${primaryColor} 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          },
        };
    }
  };

  const bgStyles = getBackgroundStyles();

  return (
    <TemplateProvider
      template={template}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
    >
      <div className={bgStyles.className}>
        {/* Background pattern */}
        {bgStyles.pattern && (
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.02] z-0"
            style={bgStyles.pattern}
          />
        )}

        <BlogHeader
          siteName={siteName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          logoUrl={logoUrl}
        />
        <main className="flex-1 relative z-10">{children}</main>
        <BlogFooter
          siteName={siteName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    </TemplateProvider>
  );
}
