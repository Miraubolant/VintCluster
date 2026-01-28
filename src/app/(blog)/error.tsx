"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Blog error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-block p-8 border-4 border-black bg-red-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black uppercase mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">
            Une erreur est survenue lors du chargement de la page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-black text-white font-bold uppercase border-4 border-black hover:bg-gray-800 transition-colors"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white text-black font-bold uppercase border-4 border-black hover:bg-gray-100 transition-colors"
            >
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
