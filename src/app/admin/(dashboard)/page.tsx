import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, FileText, Tag, TrendingUp } from "lucide-react";

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

export default async function AdminDashboard() {
  const stats = await getStats();

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

      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/sites"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Ajouter un site</p>
                <p className="text-sm text-gray-500">Configurer un nouveau blog</p>
              </div>
            </a>
            <a
              href="/admin/keywords"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Tag className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Importer des mots-clés</p>
                <p className="text-sm text-gray-500">CSV de mots-clés</p>
              </div>
            </a>
            <a
              href="/admin/articles"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Voir les articles</p>
                <p className="text-sm text-gray-500">Gérer le contenu généré</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
