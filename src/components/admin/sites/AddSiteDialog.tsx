"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SiteForm } from "./SiteForm";
import { createSite, type SiteFormData } from "@/lib/actions/sites";
import { toast } from "sonner";

interface AddSiteDialogProps {
  children: React.ReactNode;
}

export function AddSiteDialog({ children }: AddSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: SiteFormData) {
    setLoading(true);
    const result = await createSite(data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Site créé avec succès");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un site</DialogTitle>
          <DialogDescription>
            Configurez un nouveau site pour y publier des articles
          </DialogDescription>
        </DialogHeader>
        <SiteForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
