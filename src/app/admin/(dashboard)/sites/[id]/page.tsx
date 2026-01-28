import { notFound } from "next/navigation";
import { getSiteById } from "@/lib/actions/sites";
import { EditSiteForm } from "@/components/admin/sites/EditSiteForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditSitePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSitePage({ params }: EditSitePageProps) {
  const { id } = await params;
  const { data: site, error } = await getSiteById(id);

  if (error || !site) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/sites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier le site</h1>
          <p className="text-gray-500 mt-1">{site.name} - {site.domain}</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Informations du site</CardTitle>
          <CardDescription>
            Modifiez les paramètres de votre site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditSiteForm site={site} />
        </CardContent>
      </Card>
    </div>
  );
}
