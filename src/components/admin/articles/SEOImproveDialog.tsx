"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Sparkles, Loader2, Table2 } from "lucide-react";
import type { SEOModel, SEOImproveOptions } from "@/lib/actions/articles";

interface SEOImproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (options: SEOImproveOptions) => void;
  isLoading: boolean;
}

export function SEOImproveDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading,
}: SEOImproveDialogProps) {
  const [selectedModel, setSelectedModel] = useState<SEOModel>("gemini");
  const [includeTable, setIncludeTable] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            Amélioration SEO Expert
          </DialogTitle>
          <DialogDescription>
            Réécriture complète avec un prompt SEO ultra-optimisé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-semibold text-emerald-900 mb-2">Ce que fait l&apos;amélioration :</h4>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>✓ Réécriture complète (2x plus long)</li>
              <li>✓ Structure H2/H3 optimisée SEO</li>
              <li>✓ Mots-clés LSI et sémantique enrichie</li>
              <li>✓ CTA subtils vers VintDress, VintBoost, VintPower</li>
              <li>✓ FAQ améliorée (5 questions)</li>
              <li>✓ Anti-détection IA (style naturel)</li>
            </ul>
          </div>

          {/* Sélection du modèle */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Choisir le modèle IA</Label>
            <RadioGroup
              value={selectedModel}
              onValueChange={(v) => setSelectedModel(v as SEOModel)}
              className="space-y-3"
            >
              <label
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModel === "gemini"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem value="gemini" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Gemini 1.5 Pro</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      GRATUIT
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Google AI - 50 requêtes/jour gratuites. Excellent pour le SEO.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModel === "claude"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem value="claude" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Claude 3.5 Sonnet</span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Anthropic - Meilleure qualité rédactionnelle. ~$0.01/article.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Option tableau comparatif */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Options supplémentaires</Label>
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                includeTable
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Checkbox
                checked={includeTable}
                onCheckedChange={(checked) => setIncludeTable(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Inclure un tableau comparatif</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  L&apos;IA génèrera un tableau Markdown pertinent au milieu de l&apos;article
                  (ex: comparaison d&apos;outils, avant/après, avantages...)
                </p>
              </div>
            </label>
          </div>

          {/* Avertissement */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Note :</strong> L&apos;amélioration remplace le contenu existant.
            Les articles publiés seront automatiquement resoumis à IndexNow.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedCount} article{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              onClick={() => onConfirm({ model: selectedModel, includeTable })}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Amélioration...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Améliorer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
