import Link from "next/link";

interface BlogHeaderProps {
  siteName: string;
  primaryColor: string;
}

export function BlogHeader({ siteName, primaryColor }: BlogHeaderProps) {
  return (
    <header
      className="border-b-4 border-black"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="container mx-auto px-4 py-6">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight hover:translate-x-1 transition-transform">
            {siteName}
          </h1>
        </Link>
      </div>
    </header>
  );
}
