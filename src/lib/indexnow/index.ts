"use server";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Soumet une ou plusieurs URLs à IndexNow pour indexation rapide
 * Fonctionne avec Bing, Yandex, Seznam, Naver
 */
export async function submitToIndexNow(
  urls: string[],
  host: string
): Promise<{ success: boolean; submitted: number; error?: string }> {
  const apiKey = process.env.INDEXNOW_API_KEY;

  if (!apiKey) {
    console.error("INDEXNOW_API_KEY not configured");
    return { success: false, submitted: 0, error: "Clé API IndexNow non configurée" };
  }

  if (urls.length === 0) {
    return { success: true, submitted: 0 };
  }

  try {
    // IndexNow accepte jusqu'à 10 000 URLs par requête
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host: host.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        key: apiKey,
        keyLocation: `https://${host.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${apiKey}.txt`,
        urlList: urls,
      }),
    });

    // IndexNow retourne 200, 202 ou 204 en cas de succès
    if (response.ok || response.status === 202) {
      console.log(`IndexNow: ${urls.length} URL(s) soumises avec succès pour ${host}`);
      return { success: true, submitted: urls.length };
    }

    // Gestion des erreurs
    const errorText = await response.text();
    console.error(`IndexNow error (${response.status}):`, errorText);

    let errorMessage = "Erreur IndexNow";
    switch (response.status) {
      case 400:
        errorMessage = "Requête invalide";
        break;
      case 403:
        errorMessage = "Clé API invalide ou fichier de vérification manquant";
        break;
      case 422:
        errorMessage = "URLs invalides";
        break;
      case 429:
        errorMessage = "Trop de requêtes, réessayez plus tard";
        break;
    }

    return { success: false, submitted: 0, error: errorMessage };
  } catch (error) {
    console.error("IndexNow submission error:", error);
    return { success: false, submitted: 0, error: "Erreur de connexion à IndexNow" };
  }
}

/**
 * Soumet un article publié à IndexNow
 */
export async function submitArticleToIndexNow(
  articleSlug: string,
  siteDomain: string
): Promise<{ success: boolean; error?: string }> {
  const url = `https://${siteDomain}/blog/${articleSlug}`;
  const result = await submitToIndexNow([url], siteDomain);
  return { success: result.success, error: result.error };
}

/**
 * Soumet plusieurs articles à IndexNow
 */
export async function submitArticlesToIndexNow(
  articles: Array<{ slug: string; domain: string }>
): Promise<{ success: boolean; submitted: number; errors: string[] }> {
  // Grouper par domaine
  const byDomain = articles.reduce((acc, article) => {
    if (!acc[article.domain]) {
      acc[article.domain] = [];
    }
    acc[article.domain].push(`https://${article.domain}/blog/${article.slug}`);
    return acc;
  }, {} as Record<string, string[]>);

  let totalSubmitted = 0;
  const errors: string[] = [];

  // Soumettre par domaine
  for (const [domain, urls] of Object.entries(byDomain)) {
    const result = await submitToIndexNow(urls, domain);
    if (result.success) {
      totalSubmitted += result.submitted;
    } else if (result.error) {
      errors.push(`${domain}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    submitted: totalSubmitted,
    errors,
  };
}

/**
 * Soumet le sitemap et la page d'accueil d'un site
 */
export async function submitSiteToIndexNow(
  siteDomain: string
): Promise<{ success: boolean; error?: string }> {
  const urls = [
    `https://${siteDomain}`,
    `https://${siteDomain}/blog`,
    `https://${siteDomain}/sitemap.xml`,
  ];
  const result = await submitToIndexNow(urls, siteDomain);
  return { success: result.success, error: result.error };
}
