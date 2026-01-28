"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Search, FileText } from "lucide-react";
import { generateArticleFromTopic, generateArticleFromKeyword } from "@/lib/actions/articles";
import { getAvailableKeywords } from "@/lib/actions/keywords";
import { toast } from "sonner";
import type { Site, Keyword } from "@/types/database";

interface KeywordWithSite extends Keyword {
  site?: {
    id: string;
    name: string;
    domain: string;
  } | null;
}

interface GenerateArticleDialogProps {
  sites: Site[];
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function GenerateArticleDialog({
  sites,
  children,
  onSuccess,
}: GenerateArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedKeywordId, setSelectedKeywordId] = useState("");
  const [keywords, setKeywords] = useState<KeywordWithSite[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [mode, setMode] = useState<"keyword" | "topic">("keyword");

  // Charger les keywords disponibles à l'ouverture
  useEffect(() => {
    if (open) {
      loadKeywords();
    }
  }, [open]);

  async function loadKeywords() {
    setLoadingKeywords(true);
    const result = await getAvailableKeywords();
    if (result.data) {
      setKeywords(result.data);
    }
    setLoadingKeywords(false);
  }

  // Filtrer les keywords par recherche
  const filteredKeywords = keywords.filter((kw) =>
    kw.keyword.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  async function handleGenerate() {
    if (mode === "keyword") {
      if (!selectedKeywordId) {
        toast.error("Veuillez sélectionner un mot-clé");
        return;
      }

      const selectedKeyword = keywords.find((k) => k.id === selectedKeywordId);

      // Si le keyword a un site, utiliser ce site
      // Sinon, un site doit être sélectionné
      const targetSiteId = selectedKeyword?.site_id || siteId;

      if (!targetSiteId) {
        toast.error("Veuillez sélectionner un site de destination");
        return;
      }

      setLoading(true);

      // Si le keyword a un site associé, utiliser generateArticleFromKeyword
      // Sinon, utiliser generateArticleFromTopic avec le keyword comme topic
      let result;
      if (selectedKeyword?.site_id) {
        result = await generateArticleFromKeyword(selectedKeywordId);
      } else {
        result = await generateArticleFromTopic(targetSiteId, selectedKeyword!.keyword);
      }

      setLoading(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Article généré avec succès !");
      handleClose();
      onSuccess?.();
    } else {
      // Mode topic libre
      if (!siteId || !topic.trim()) {
        toast.error("Veuillez sélectionner un site et entrer un sujet");
        return;
      }

      setLoading(true);
      const result = await generateArticleFromTopic(siteId, topic.trim());
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Article généré avec succès !");
      handleClose();
      onSuccess?.();
    }
  }

  function handleClose() {
    setOpen(false);
    setSiteId("");
    setTopic("");
    setSelectedKeywordId("");
    setKeywordSearch("");
    setMode("keyword");
  }

  const selectedKeyword = keywords.find((k) => k.id === selectedKeywordId);
  const needsSiteSelection = mode === "keyword" && selectedKeyword && !selectedKeyword.site_id;

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Générer un article avec l&apos;IA
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un mot-clé importé ou entrez un sujet libre pour générer un article complet.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "keyword" | "topic")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keyword" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mot-clé importé
            </TabsTrigger>
            <TabsTrigger value="topic" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Sujet libre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keyword" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rechercher un mot-clé</Label>
              <Input
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Filtrer les mots-clés..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Mot-clé à utiliser *</Label>
              {loadingKeywords ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Chargement des mots-clés...
                </div>
              ) : filteredKeywords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                  {keywords.length === 0
                    ? "Aucun mot-clé disponible. Importez des mots-clés d'abord."
                    : "Aucun mot-clé correspondant à la recherche."}
                </div>
              ) : (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredKeywords.slice(0, 50).map((kw) => (
                    <div
                      key={kw.id}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedKeywordId === kw.id ? "bg-indigo-50 hover:bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedKeywordId(kw.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            selectedKeywordId === kw.id
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedKeywordId === kw.id && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <span className="truncate text-sm">{kw.keyword}</span>
                      </div>
                      {kw.site ? (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {kw.site.name}
                        </span>
                      ) : (
                        <span className="text-xs text-indigo-500 flex-shrink-0 ml-2">
                          Global
                        </span>
                      )}
                    </div>
                  ))}
                  {filteredKeywords.length > 50 && (
                    <div className="text-center py-2 text-xs text-gray-500">
                      ... et {filteredKeywords.length - 50} autres
                    </div>
                  )}
                </div>
              )}
            </div>

            {needsSiteSelection && (
              <div className="space-y-2">
                <Label htmlFor="site">Site de destination *</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: site.primary_color || "#6366F1" }}
                          />
                          {site.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Ce mot-clé est global, choisissez le site où publier l&apos;article.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="topic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site de destination *</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: site.primary_color || "#6366F1" }}
                        />
                        {site.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Sujet / Mot-clé *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Comment optimiser son SEO en 2024"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Entrez un sujet, une question ou un mot-clé. L&apos;IA générera un
                article complet optimisé SEO.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <div>
                <p className="font-medium text-indigo-900">
                  Génération en cours...
                </p>
                <p className="text-sm text-indigo-600">
                  L&apos;IA rédige votre article, cela peut prendre quelques secondes.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              loading ||
              (mode === "keyword" && (!selectedKeywordId || (needsSiteSelection && !siteId))) ||
              (mode === "topic" && (!siteId || !topic.trim()))
            }
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer l&apos;article
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
