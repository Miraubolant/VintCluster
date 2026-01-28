import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  // Vérifier le secret
  const authHeader = request.headers.get("authorization");
  const secret = process.env.REVALIDATION_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { path, domain } = body as {
      path?: string;
      domain?: string;
    };

    const revalidated: string[] = [];

    if (path) {
      revalidatePath(path);
      revalidated.push(path);
    }

    // Si un domaine est spécifié, revalider toutes les pages du blog
    if (domain) {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
      revalidated.push("/", "/blog", "/blog/[slug]");
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
