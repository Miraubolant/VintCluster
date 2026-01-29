"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Save, RotateCcw, Eye, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  getPromptConfigs,
  updatePromptConfig,
  type PromptConfig,
} from "@/lib/actions/prompts";

export function PromptSettings() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [previewPrompt, setPreviewPrompt] = useState<PromptConfig | null>(null);

  // Charger les prompts
  useEffect(() => {
    async function loadPrompts() {
      const result = await getPromptConfigs();
      if (result.data) {
        setPrompts(result.data);
        // Initialiser le contenu édité
        const content: Record<string, string> = {};
        result.data.forEach((p) => {
          content[p.id] = p.content;
        });
        setEditedContent(content);
      }
      setLoading(false);
    }
    loadPrompts();
  }, []);

  // Sauvegarder un prompt
  async function handleSave(prompt: PromptConfig) {
    setSaving(prompt.id);
    const result = await updatePromptConfig(prompt.id, {
      content: editedContent[prompt.id],
    });
    setSaving(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Prompt sauvegardé");
    // Mettre à jour localement
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id ? { ...p, content: editedContent[prompt.id] } : p
      )
    );
  }

  // Toggle actif/inactif
  async function handleToggleActive(prompt: PromptConfig) {
    const result = await updatePromptConfig(prompt.id, {
      is_active: !prompt.is_active,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(prompt.is_active ? "Prompt désactivé (défaut utilisé)" : "Prompt activé");
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id ? { ...p, is_active: !p.is_active } : p
      )
    );
  }

  // Réinitialiser à la valeur en base
  function handleReset(prompt: PromptConfig) {
    setEditedContent((prev) => ({
      ...prev,
      [prompt.id]: prompt.content,
    }));
    toast.info("Modifications annulées");
  }

  // Vérifier si modifié
  function isModified(prompt: PromptConfig): boolean {
    return editedContent[prompt.id] !== prompt.content;
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des prompts...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Sparkles className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Configuration des Prompts IA</h3>
          <p className="text-sm text-gray-500">
            Personnalisez les instructions données à l&apos;IA pour la génération d&apos;articles
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Ces prompts définissent le comportement de l&apos;IA lors de la génération.
          Désactiver un prompt utilise la version par défaut du code.
        </p>
      </div>

      {prompts.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Aucun prompt configuré. Exécutez la migration SQL pour initialiser les prompts.
        </p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {prompts.map((prompt) => (
            <AccordionItem
              key={prompt.id}
              value={prompt.id}
              className="border border-gray-200 rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 text-left">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      prompt.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <div>
                    <span className="font-medium text-gray-900">{prompt.name}</span>
                    {prompt.description && (
                      <p className="text-xs text-gray-500">{prompt.description}</p>
                    )}
                  </div>
                  {isModified(prompt) && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Modifié
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-4">
                  {/* Toggle actif */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`active-${prompt.id}`} className="text-sm">
                      Utiliser ce prompt personnalisé
                    </Label>
                    <Switch
                      id={`active-${prompt.id}`}
                      checked={prompt.is_active}
                      onCheckedChange={() => handleToggleActive(prompt)}
                    />
                  </div>

                  {/* Textarea pour le contenu */}
                  <div className="space-y-2">
                    <Label>Contenu du prompt</Label>
                    <Textarea
                      value={editedContent[prompt.id] || ""}
                      onChange={(e) =>
                        setEditedContent((prev) => ({
                          ...prev,
                          [prompt.id]: e.target.value,
                        }))
                      }
                      rows={12}
                      className="font-mono text-sm"
                      disabled={!prompt.is_active}
                    />
                    <p className="text-xs text-gray-500">
                      {editedContent[prompt.id]?.length || 0} caractères
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(prompt)}
                      disabled={!isModified(prompt) || saving === prompt.id}
                    >
                      {saving === prompt.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReset(prompt)}
                      disabled={!isModified(prompt)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewPrompt(prompt)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Dialog d'aperçu */}
      <Dialog open={!!previewPrompt} onOpenChange={() => setPreviewPrompt(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewPrompt?.name}</DialogTitle>
            <DialogDescription>{previewPrompt?.description}</DialogDescription>
          </DialogHeader>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {previewPrompt?.content}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
