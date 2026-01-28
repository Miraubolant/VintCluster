import { getSitesWithStats } from "@/lib/actions/sites";
import { SitesTable } from "@/components/admin/sites/SitesTable";
import { AddSiteDialog } from "@/components/admin/sites/AddSiteDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function SitesPage() {
  const { data: sites, error } = await getSitesWithStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos sites et domaines ({sites.length} site{sites.length > 1 ? "s" : ""})
          </p>
        </div>
        <AddSiteDialog>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un site
          </Button>
        </AddSiteDialog>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Table */}
      {sites.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun site</h3>
          <p className="text-gray-500 mb-4">
            Commencez par ajouter votre premier site
          </p>
          <AddSiteDialog>
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un site
            </Button>
          </AddSiteDialog>
        </div>
      ) : (
        <SitesTable sites={sites} />
      )}
    </div>
  );
}
