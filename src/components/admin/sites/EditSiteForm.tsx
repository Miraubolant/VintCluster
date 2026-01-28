"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteForm } from "./SiteForm";
import { updateSite, type SiteFormData } from "@/lib/actions/sites";
import { toast } from "sonner";
import type { Site } from "@/types/database";

interface EditSiteFormProps {
  site: Site;
}

export function EditSiteForm({ site }: EditSiteFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: SiteFormData) {
    setLoading(true);
    const result = await updateSite(site.id, data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Site mis à jour avec succès");
    router.push("/admin/sites");
    router.refresh();
  }

  return (
    <SiteForm
      site={site}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/admin/sites")}
      loading={loading}
    />
  );
}
