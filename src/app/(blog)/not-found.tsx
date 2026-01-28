import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-block p-8 border-4 border-black bg-yellow-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-6xl font-black uppercase mb-4">404</h1>
          <h2 className="text-2xl font-bold uppercase mb-4">Page introuvable</h2>
          <p className="text-gray-700 mb-6">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white font-bold uppercase border-4 border-black hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
