import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, FileText, Tag, TrendingUp, BarChart3, AlertTriangle, MousePointerClick, Target } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const supabase = await createClient();

  const [
    { count: sitesCount },
    { count: keywordsCount },
    { count: articlesCount },
    { count: publishedCount },
  ] = await Promise.all([
    supabase.from("sites").select("*", { count: "exact", head: true }),
    supabase.from("keywords").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);

  return {
    sites: sitesCount || 0,
    keywords: keywordsCount || 0,
    articles: articlesCount || 0,
    published: publishedCount || 0,
  };
}

async function getSEOStats() {
  const supabase = await createClient();

  // Score SEO moyen des articles publiés
  const { data: articlesWithScore } = await supabase
    .from("articles")
    .select("seo_score")
    .eq("status", "published")
    .not("seo_score", "is", null);

  const avgSeoScore = articlesWithScore && articlesWithScore.length > 0
    ? Math.round(articlesWithScore.reduce((sum, a) => sum + (a.seo_score || 0), 0) / articlesWithScore.length)
    : 0;

  // Articles avec score SEO < 50 (à optimiser)
  const { count: lowScoreCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .lt("seo_score", 50);

  // Top 5 articles par clics (depuis seo_tracking)
  const { data: topArticles } = await supabase
    .from("seo_tracking")
    .select(`
      clicks,
      impressions,
      position,
      article:article_id(
        id,
        title,
        slug,
        site:site_id(domain)
      )
    `)
    .not("article_id", "is", null)
    .order("clicks", { ascending: false })
    .limit(5);

  // Tendance des 7 derniers jours (métriques globales)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentMetrics } = await supabase
    .from("seo_tracking")
    .select("date, clicks, impressions")
    .is("article_id", null)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Calculer les totaux des 7 derniers jours
  const totalClicks = recentMetrics?.reduce((sum, m) => sum + (m.clicks || 0), 0) || 0;
  const totalImpressions = recentMetrics?.reduce((sum, m) => sum + (m.impressions || 0), 0) || 0;

  return {
    avgSeoScore,
    lowScoreCount: lowScoreCount || 0,
    topArticles: topArticles || [],
    totalClicks,
    totalImpressions,
    recentMetrics: recentMetrics || [],
  };
}

export default async function AdminDashboard() {
  const [stats, seoStats] = await Promise.all([getStats(), getSEOStats()]);

  const cards = [
    {
      title: "Sites",
      value: stats.sites,
      icon: Globe,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Mots-clés",
      value: stats.keywords,
      icon: Tag,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Articles",
      value: stats.articles,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Publiés",
      value: stats.published,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  const seoCards = [
    {
      title: "Score SEO moyen",
      value: seoStats.avgSeoScore,
      suffix: "/100",
      icon: Target,
      color: seoStats.avgSeoScore >= 70 ? "text-green-600" : seoStats.avgSeoScore >= 50 ? "text-yellow-600" : "text-red-600",
      bg: seoStats.avgSeoScore >= 70 ? "bg-green-50" : seoStats.avgSeoScore >= 50 ? "bg-yellow-50" : "bg-red-50",
    },
    {
      title: "Clics (7j)",
      value: seoStats.totalClicks,
      icon: MousePointerClick,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Impressions (7j)",
      value: seoStats.totalImpressions,
      icon: BarChart3,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      title: "À optimiser",
      value: seoStats.lowScoreCount,
      icon: AlertTriangle,
      color: seoStats.lowScoreCount > 0 ? "text-orange-600" : "text-green-600",
      bg: seoStats.lowScoreCount > 0 ? "bg-orange-50" : "bg-green-50",
      href: "/admin/articles?filter=low-seo",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Vue d&apos;ensemble de votre plateforme de génération de blogs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SEO Stats Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance SEO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {seoCards.map((card) => {
            const CardWrapper = card.href ? Link : "div";
            return (
              <CardWrapper
                key={card.title}
                href={card.href || "#"}
                className={card.href ? "block" : ""}
              >
                <Card className={`border-gray-200 shadow-sm ${card.href ? "hover:border-indigo-300 transition-colors cursor-pointer" : ""}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {card.value}
                      {card.suffix && <span className="text-lg text-gray-500">{card.suffix}</span>}
                    </div>
                  </CardContent>
                </Card>
              </CardWrapper>
            );
          })}
        </div>
      </div>

      {/* Top Articles by Clicks */}
      {seoStats.topArticles.length > 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Top 5 articles par clics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seoStats.topArticles.map((item, index) => {
                const article = item.article as unknown as { id: string; title: string; slug: string; site: { domain: string } } | null;
                if (!article) return null;

                return (
                  <div key={article.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 truncate block"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{article.site?.domain}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-gray-900">{item.clicks} clics</p>
                      <p className="text-xs text-gray-500">{item.impressions} imp.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/sites"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Ajouter un site</p>
                <p className="text-sm text-gray-500">Configurer un nouveau blog</p>
              </div>
            </Link>
            <Link
              href="/admin/keywords"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Tag className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Importer des mots-clés</p>
                <p className="text-sm text-gray-500">CSV de mots-clés</p>
              </div>
            </Link>
            <Link
              href="/admin/articles"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Voir les articles</p>
                <p className="text-sm text-gray-500">Gérer le contenu généré</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
