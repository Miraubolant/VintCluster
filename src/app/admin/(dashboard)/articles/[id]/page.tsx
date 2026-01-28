import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/actions/articles";
import { EditArticleForm } from "@/components/admin/articles/EditArticleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, FileText } from "lucide-react";
import Link from "next/link";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  ready: { label: "Prêt", variant: "outline" },
  published: { label: "Publié", variant: "default" },
  unpublished: { label: "Dépublié", variant: "destructive" },
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const { data: article, error } = await getArticleById(id);

  if (error || !article) {
    notFound();
  }

  const statusInfo = statusLabels[article.status || "draft"] || statusLabels.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/articles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;article</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {article.site && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {article.site.name}
                </span>
              )}
              {article.keyword && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {article.keyword.keyword}
                </span>
              )}
            </div>
          </div>
        </div>

        {article.status === "published" && article.site && (
          <a
            href={`https://${article.site.domain}/blog/${article.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              Voir l&apos;article
            </Button>
          </a>
        )}
      </div>

      {/* Form Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Contenu de l&apos;article</CardTitle>
          <CardDescription>
            Modifiez le titre, le résumé, le contenu et la FAQ de votre article
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditArticleForm article={article} />
        </CardContent>
      </Card>
    </div>
  );
}
