import { NextRequest, NextResponse } from "next/server";

/**
 * Route dynamique pour servir le fichier de vérification IndexNow
 * Accessible à /{INDEXNOW_API_KEY}.txt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const apiKey = process.env.INDEXNOW_API_KEY;

  // Vérifier si c'est une requête pour le fichier de vérification IndexNow
  if (key === `${apiKey}.txt` && apiKey) {
    return new NextResponse(apiKey, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400", // Cache 24h
      },
    });
  }

  // Sinon, 404
  return new NextResponse("Not Found", { status: 404 });
}
