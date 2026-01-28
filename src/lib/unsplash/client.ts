interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * Recherche une image sur Unsplash basée sur un mot-clé
 */
export async function searchUnsplashImage(
  query: string
): Promise<{ url: string; alt: string } | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY not defined, skipping image search");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return null;
    }

    const data: UnsplashSearchResponse = await response.json();

    if (data.results.length === 0) {
      return null;
    }

    const photo = data.results[0];

    return {
      url: photo.urls.regular,
      alt: photo.alt_description || photo.description || query,
    };
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
}
