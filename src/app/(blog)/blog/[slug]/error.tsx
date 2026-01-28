"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Article page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white border-[5px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-500 border-[4px] border-black flex items-center justify-center">
            <span className="text-2xl font-black text-white">!</span>
          </div>
          <h1 className="text-2xl font-black uppercase">Erreur</h1>
        </div>

        <p className="text-gray-700 mb-4">
          Une erreur est survenue lors du chargement de l&apos;article.
        </p>

        {/* Error details for debugging */}
        <div className="bg-gray-100 border-[3px] border-black p-4 mb-6 text-sm font-mono overflow-auto max-h-48">
          <p className="font-bold mb-2">Message:</p>
          <p className="text-red-600 break-words">{error.message}</p>
          {error.digest && (
            <>
              <p className="font-bold mt-4 mb-2">Digest:</p>
              <p className="text-gray-600">{error.digest}</p>
            </>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-yellow-400 border-[4px] border-black font-black uppercase text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            Réessayer
          </button>
          <Link
            href="/blog"
            className="flex-1 px-6 py-3 bg-white border-[4px] border-black font-black uppercase text-sm text-center hover:bg-gray-100 transition-colors"
          >
            Retour
          </Link>
        </div>
      </div>
    </div>
  );
}
