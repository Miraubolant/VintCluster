"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RecalculateStatus {
  totalPublished: number;
  withoutSeoScore: number;
  withoutRelations: number;
  needsUpdate: boolean;
}

interface RecalculateResult {
  message: string;
  totalArticles: number;
  seoUpdated: number;
  relatedUpdated: number;
  errors?: Array<{ articleId: string; error: string }>;
}

export function RecalculateSEOButton() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<RecalculateStatus | null>(null);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/recalculate-seo", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la vérification");
      }

      const data = await res.json();
      setStatus(data);
    } catch (error) {
      toast.error("Impossible de vérifier le statut");
      console.error(error);
    } finally {
      setChecking(false);
    }
  }

  async function runRecalculation() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recalculate-seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ limit: 100 }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors du recalcul");
      }

      const data: RecalculateResult = await res.json();

      if (data.errors && data.errors.length > 0) {
        toast.warning(`Recalcul terminé avec ${data.errors.length} erreurs`, {
          description: `${data.seoUpdated} scores SEO, ${data.relatedUpdated} articles connexes`,
        });
      } else {
        toast.success("Recalcul terminé", {
          description: `${data.seoUpdated} scores SEO, ${data.relatedUpdated} articles connexes`,
        });
      }

      // Rafraîchir le statut
      await checkStatus();
    } catch (error) {
      toast.error("Erreur lors du recalcul SEO");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          disabled={checking || loading}
        >
          {checking ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Vérifier
        </Button>

        <Button
          onClick={runRecalculation}
          disabled={loading || checking}
          className="bg-indigo-500 hover:bg-indigo-600"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Recalculer SEO
        </Button>
      </div>

      {status && (
        <div className="text-sm space-y-1">
          {status.needsUpdate ? (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span>
                {status.withoutSeoScore} sans score, {status.withoutRelations} sans relations
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span>Tous les {status.totalPublished} articles sont à jour</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
