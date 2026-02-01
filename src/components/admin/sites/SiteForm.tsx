"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, ImageIcon, Webhook } from "lucide-react";
import { toast } from "sonner";
import type { Site, SiteTemplate } from "@/types/database";
import { TEMPLATES } from "@/types/database";
import type { SiteFormData } from "@/lib/actions/sites";
import { generateSiteSEO, generateFavicon } from "@/lib/actions/sites";

interface SiteFormProps {
  site?: Site | null;
  onSubmit: (data: SiteFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function SiteForm({ site, onSubmit, onCancel, loading }: SiteFormProps) {
  const [formData, setFormData] = useState<SiteFormData>({
    domain: site?.domain || "",
    name: site?.name || "",
    logo_url: site?.logo_url || "",
    favicon_url: site?.favicon_url || "",
    primary_color: site?.primary_color || "#000000",
    secondary_color: site?.secondary_color || "#FFFFFF",
    meta_title: site?.meta_title || "",
    meta_description: site?.meta_description || "",
    template: (site?.template as SiteTemplate) || "brutal",
    webhook_url: site?.webhook_url || "",
    webhook_enabled: site?.webhook_enabled || false,
  });

  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [generatingFavicon, setGeneratingFavicon] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(formData);
  }

  async function handleGenerateSEO() {
    if (!formData.name) {
      toast.error("Veuillez d'abord saisir le nom du site");
      return;
    }

    setGeneratingSEO(true);
    const result = await generateSiteSEO(formData.name, site?.id);
    setGeneratingSEO(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setFormData({
      ...formData,
      meta_title: result.meta_title,
      meta_description: result.meta_description,
    });

    toast.success("SEO généré avec succès");
  }

  async function handleGenerateFavicon() {
    if (!formData.name) {
      toast.error("Veuillez d'abord saisir le nom du site");
      return;
    }

    setGeneratingFavicon(true);
    const result = await generateFavicon(
      formData.name,
      formData.primary_color,
      formData.secondary_color,
      site?.id
    );
    setGeneratingFavicon(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setFormData({
      ...formData,
      favicon_url: result.url,
    });

    toast.success("Favicon généré avec succès");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du site *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mon Blog Cuisine"
            required
          />
        </div>

        {/* Domaine */}
        <div className="space-y-2">
          <Label htmlFor="domain">Domaine *</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="blog-cuisine.com"
            required
          />
        </div>
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logo_url">URL du logo</Label>
        <Input
          id="logo_url"
          type="url"
          value={formData.logo_url}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          placeholder="https://example.com/logo.png"
        />
        <p className="text-xs text-gray-500">
          Laissez vide pour afficher les initiales du site en badge géométrique
        </p>
      </div>

      {/* Favicon URL */}
      <div className="space-y-2">
        <Label htmlFor="favicon_url">URL du favicon</Label>
        <div className="flex gap-2">
          <Input
            id="favicon_url"
            type="url"
            value={formData.favicon_url}
            onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
            placeholder="https://example.com/favicon.ico"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateFavicon}
            disabled={generatingFavicon || !formData.name}
            className="text-purple-600 border-purple-200 hover:bg-purple-50 shrink-0"
          >
            {generatingFavicon ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-1" />
                Générer
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {formData.favicon_url && (
            <img
              src={formData.favicon_url}
              alt="Favicon preview"
              className="w-6 h-6 border border-gray-200 rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <p className="text-xs text-gray-500">
            Générez automatiquement avec les initiales ou entrez une URL
          </p>
        </div>
      </div>

      {/* Couleurs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_color">Couleur primaire</Label>
          <div className="flex gap-2">
            <Input
              id="primary_color"
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondary_color">Couleur secondaire</Label>
          <div className="flex gap-2">
            <Input
              id="secondary_color"
              type="color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              placeholder="#FFFFFF"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template">Template du blog</Label>
        <Select
          value={formData.template || "brutal"}
          onValueChange={(value) => setFormData({ ...formData, template: value as SiteTemplate })}
        >
          <SelectTrigger id="template" className="w-full">
            <SelectValue placeholder="Sélectionner un template" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs text-gray-500">{template.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Affecte le style visuel du blog public et le ton des articles générés
        </p>
      </div>

      {/* SEO Section with AI button */}
      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700">Optimisation SEO</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateSEO}
            disabled={generatingSEO || !formData.name}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            {generatingSEO ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer avec l&apos;IA
              </>
            )}
          </Button>
        </div>

        {/* Meta Title */}
        <div className="space-y-2">
          <Label htmlFor="meta_title">Titre SEO</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
            placeholder="Mon Blog Cuisine - Recettes et Conseils"
          />
          <p className="text-xs text-gray-500">
            {(formData.meta_title || "").length}/60 caractères recommandés
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="meta_description">Description SEO</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            placeholder="Découvrez nos meilleures recettes et conseils culinaires..."
            rows={3}
          />
          <p className="text-xs text-gray-500">
            {(formData.meta_description || "").length}/160 caractères recommandés
          </p>
        </div>
      </div>

      {/* Webhook Section */}
      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-sm text-gray-700">Rapports hebdomadaires</h3>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="webhook_enabled" className="text-sm text-gray-600">
              Activer
            </Label>
            <Switch
              id="webhook_enabled"
              checked={formData.webhook_enabled || false}
              onCheckedChange={(checked) => setFormData({ ...formData, webhook_enabled: checked })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook_url">URL du webhook</Label>
          <Input
            id="webhook_url"
            type="url"
            value={formData.webhook_url}
            onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
            placeholder="https://hooks.slack.com/services/xxx ou https://discord.com/api/webhooks/xxx"
            disabled={!formData.webhook_enabled}
          />
          <p className="text-xs text-gray-500">
            Recevez un rapport JSON avec les métriques SEO chaque semaine (clics, impressions, CTR, position)
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          {loading ? "Enregistrement..." : site ? "Mettre à jour" : "Créer le site"}
        </Button>
      </div>
    </form>
  );
}
