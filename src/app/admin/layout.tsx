import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin | VintCluster",
    template: "%s | Admin VintCluster",
  },
  description: "Panneau d'administration VintCluster",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>",
  },
};

// Layout racine pour /admin - minimal, le vrai layout est dans (dashboard)
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
