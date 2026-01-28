"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Eye, Plus, Trash2, ImageIcon, Sparkles, X } from "lucide-react";
import { updateArticle, generateArticleImage } from "@/lib/actions/articles";
import { MODEL_INFO, type ImageModel } from "@/lib/replicate";
import { toast } from "sonner";
import type { Article, FAQItem } from "@/types/database";
import ReactMarkdown from "react-markdown";

interface ArticleWithDetails extends Article {
  keyword?: {
    id: string;
    keyword: string;
  };
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

interface EditArticleFormProps {
  article: ArticleWithDetails;
}

export function EditArticleForm({ article }: EditArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [summary, setSummary] = useState(article.summary || "");
  const [content, setContent] = useState(article.content);
  const [imageUrl, setImageUrl] = useState(article.image_url || "");
  const [imageAlt, setImageAlt] = useState(article.image_alt || "");
  const [faq, setFaq] = useState<FAQItem[]>(
    (article.faq as FAQItem[] | null) || []
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [imageModel, setImageModel] = useState<ImageModel>("flux-schnell");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Le titre et le contenu sont obligatoires");
      return;
    }

    setLoading(true);
    const result = await updateArticle(article.id, {
      title: title.trim(),
      summary: summary.trim() || undefined,
      content: content.trim(),
      faq: faq.length > 0 ? faq : undefined,
      image_url: imageUrl.trim() || null,
      image_alt: imageAlt.trim() || null,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Article mis à jour avec succès");
    router.refresh();
  }

  async function handleGenerateImage() {
    setGeneratingImage(true);
    const result = await generateArticleImage(
      article.id,
      imageModel,
      customPrompt.trim() || undefined
    );
    setGeneratingImage(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.url) {
      setImageUrl(result.url);
      setImageAlt(result.alt || title);
      toast.success("Image générée avec succès");
      router.refresh();
    }
  }

  function handleRemoveImage() {
    setImageUrl("");
    setImageAlt("");
  }

  function addFaqItem() {
    setFaq([...faq, { question: "", answer: "" }]);
  }

  function updateFaqItem(index: number, field: "question" | "answer", value: string) {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  }

  function removeFaqItem(index: number) {
    setFaq(faq.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de l'article"
          disabled={loading}
          className="text-lg font-medium"
        />
      </div>

      {/* Résumé */}
      <div className="space-y-2">
        <Label htmlFor="summary">Résumé (meta description)</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Bref résumé de l'article pour le SEO..."
          disabled={loading}
          rows={2}
        />
        <p className="text-xs text-gray-500">
          {summary.length}/160 caractères recommandés
        </p>
      </div>

      {/* Image */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image de l&apos;article
          </Label>
          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>

        {/* Affichage de l'image actuelle */}
        {imageUrl && (
          <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* URL personnalisée */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-sm">URL de l&apos;image</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={loading || generatingImage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageAlt" className="text-sm">Texte alternatif (SEO)</Label>
            <Input
              id="imageAlt"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Description de l'image..."
              disabled={loading || generatingImage}
            />
          </div>
        </div>

        {/* Génération IA */}
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Génération IA (Replicate)
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="imageModel" className="text-sm">Modèle</Label>
              <Select
                value={imageModel}
                onValueChange={(v) => setImageModel(v as ImageModel)}
                disabled={generatingImage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MODEL_INFO) as ImageModel[]).map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex flex-col">
                        <span>{MODEL_INFO[model].name}</span>
                        <span className="text-xs text-gray-500">{MODEL_INFO[model].speed}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customPrompt" className="text-sm">Prompt personnalisé (optionnel)</Label>
              <Input
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Laisser vide pour générer à partir du titre..."
                disabled={generatingImage}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateImage}
            disabled={loading || generatingImage}
            className="mt-3 gap-2"
          >
            {generatingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generatingImage ? "Génération en cours..." : "Générer une image"}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            L&apos;image sera générée et sauvegardée automatiquement.
          </p>
        </div>
      </div>

      {/* Contenu avec tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Contenu *</Label>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs px-3">
                Éditer
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3">
                <Eye className="h-3 w-3 mr-1" />
                Aperçu
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "edit" ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenu de l'article en Markdown..."
            disabled={loading}
            rows={20}
            className="font-mono text-sm"
          />
        ) : (
          <div className="border rounded-md p-4 min-h-[400px] bg-white">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500">
          Utilisez le format Markdown. Les liens externes s&apos;ouvriront dans un nouvel onglet.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>FAQ (optionnel)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFaqItem}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une question
          </Button>
        </div>

        {faq.length > 0 && (
          <div className="space-y-4">
            {faq.map((item, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-gray-50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.question}
                      onChange={(e) => updateFaqItem(index, "question", e.target.value)}
                      placeholder="Question"
                      disabled={loading}
                      className="font-medium"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaqItem(index)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={item.answer}
                  onChange={(e) => updateFaqItem(index, "answer", e.target.value)}
                  placeholder="Réponse"
                  disabled={loading}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="bg-indigo-500 hover:bg-indigo-600"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
