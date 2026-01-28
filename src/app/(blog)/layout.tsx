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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <BlogHeader siteName={siteName} primaryColor={primaryColor} />
      <main className="flex-1">{children}</main>
      <BlogFooter siteName={siteName} primaryColor={primaryColor} />
    </div>
  );
}
