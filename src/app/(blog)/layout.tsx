import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSiteByDomain } from "@/lib/actions/blog";
import { BlogHeader, BlogFooter } from "@/components/blog";

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Subtle grid pattern background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-0"
        style={{
          backgroundImage: `
            linear-gradient(${primaryColor} 1px, transparent 1px),
            linear-gradient(90deg, ${primaryColor} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <BlogHeader
        siteName={siteName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
      <main className="flex-1 relative z-10">{children}</main>
      <BlogFooter
        siteName={siteName}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </div>
  );
}
