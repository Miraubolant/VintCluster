"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Zap,
  MessageSquare,
  GitBranch,
  Target,
  RefreshCw,
  Download,
  CheckCircle,
  Plus,
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateAllKeywords,
  analyzeCompetitorKeywords,
  type GeneratedKeyword,
} from "@/lib/actions/keyword-generator";
import { importKeywordsSimple } from "@/lib/actions/keywords";

// Clusters disponibles
const CLUSTERS = [
  { value: "photo-ia", label: "Photo IA", color: "bg-blue-100 text-blue-700" },
  { value: "mannequin-ia", label: "Mannequin IA", color: "bg-purple-100 text-purple-700" },
  { value: "vente", label: "Vente & Astuces", color: "bg-green-100 text-green-700" },
  { value: "video", label: "Vidéo", color: "bg-red-100 text-red-700" },
  { value: "logistique", label: "Logistique", color: "bg-yellow-100 text-yellow-700" },
  { value: "algorithme", label: "Algorithme", color: "bg-orange-100 text-orange-700" },
  { value: "tendances", label: "Tendances", color: "bg-pink-100 text-pink-700" },
];

// Sources avec icônes
const SOURCES = {
  ai: { icon: Sparkles, label: "IA", color: "text-purple-500" },
  autocomplete: { icon: Search, label: "Autocomplete", color: "text-blue-500" },
  modifier: { icon: Zap, label: "Modificateur", color: "text-yellow-500" },
  question: { icon: MessageSquare, label: "Question", color: "text-green-500" },
  longtail: { icon: GitBranch, label: "Long-tail", color: "text-orange-500" },
  semantic: { icon: Target, label: "Sémantique", color: "text-red-500" },
};

// Intent badges
const INTENTS = {
  informational: { label: "Info", color: "bg-blue-100 text-blue-700" },
  transactional: { label: "Transac", color: "bg-green-100 text-green-700" },
  commercial: { label: "Commercial", color: "bg-purple-100 text-purple-700" },
  navigational: { label: "Nav", color: "bg-gray-100 text-gray-700" },
};

export default function KeywordGeneratorPage() {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<GeneratedKeyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Options de génération
  const [options, setOptions] = useState({
    useAI: true,
    useAutocomplete: true,
    useModifiers: true,
    useQuestions: true,
    useSemantic: true,
    useLongTail: true,
  });

  // Mode génération
  const [mode, setMode] = useState<"seed" | "competitor">("seed");
  const [competitorTopic, setCompetitorTopic] = useState("");

  const handleGenerate = useCallback(async () => {
    if (mode === "seed" && !seedKeyword.trim()) return;
    if (mode === "competitor" && !competitorTopic.trim()) return;

    setLoading(true);
    setError(null);
    setKeywords([]);
    setSelectedKeywords(new Set());
    setImportSuccess(false);

    try {
      let result;

      if (mode === "competitor") {
        result = await analyzeCompetitorKeywords(competitorTopic);
      } else {
        result = await generateAllKeywords(seedKeyword, {
          ...options,
          cluster: selectedCluster || undefined,
        });
      }

      if (result.success && result.keywords) {
        setKeywords(result.keywords);
        // Sélectionner tous par défaut
        setSelectedKeywords(new Set(result.keywords.map(k => k.keyword)));
      } else {
        setError(result.error || "Erreur lors de la génération");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, [mode, seedKeyword, competitorTopic, options, selectedCluster]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedKeywords(new Set(keywords.map(k => k.keyword)));
  };

  const deselectAll = () => {
    setSelectedKeywords(new Set());
  };

  const handleImport = async () => {
    if (selectedKeywords.size === 0) return;

    setLoading(true);
    try {
      const keywordsToImport = Array.from(selectedKeywords);
      const result = await importKeywordsSimple(null, keywordsToImport);

      if (result.error) {
        setError(result.error);
      } else {
        setImportSuccess(true);
        // Retirer les mots-clés importés de la liste
        setKeywords(prev => prev.filter(k => !selectedKeywords.has(k.keyword)));
        setSelectedKeywords(new Set());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur import");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const selectedKws = keywords.filter(k => selectedKeywords.has(k.keyword));
    const csv = [
      "keyword,source,intent,estimated_volume",
      ...selectedKws.map(k =>
        `"${k.keyword}","${k.source}","${k.intent || ""}","${k.estimatedVolume || ""}"`
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keywords-${seedKeyword || "generated"}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats par source
  const statsBySource = keywords.reduce((acc, k) => {
    acc[k.source] = (acc[k.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/keywords">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Générateur de Mots-clés IA
            </h1>
            <p className="text-gray-500 mt-1">
              Génère des mots-clés optimisés avec plusieurs techniques
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode("seed")}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              mode === "seed"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Lightbulb className={`w-6 h-6 mb-2 ${mode === "seed" ? "text-purple-500" : "text-gray-400"}`} />
            <h3 className="font-semibold">Expansion de mot-clé</h3>
            <p className="text-sm text-gray-500">Générer des variations depuis un seed</p>
          </button>
          <button
            onClick={() => setMode("competitor")}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              mode === "competitor"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <TrendingUp className={`w-6 h-6 mb-2 ${mode === "competitor" ? "text-purple-500" : "text-gray-400"}`} />
            <h3 className="font-semibold">Analyse concurrentielle</h3>
            <p className="text-sm text-gray-500">Trouver les mots-clés d&apos;une niche</p>
          </button>
        </div>

        {mode === "seed" ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seed">Mot-clé seed</Label>
                <Input
                  id="seed"
                  placeholder="ex: ia photo vinted"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>
              <div>
                <Label>Cluster (optionnel)</Label>
                <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {CLUSTERS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Sources de génération</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(options).map(([key, value]) => {
                  const sourceKey = key.replace("use", "").toLowerCase();
                  const sourceInfo = SOURCES[sourceKey as keyof typeof SOURCES] || {
                    icon: Zap,
                    label: key,
                    color: "text-gray-500"
                  };
                  const Icon = sourceInfo.icon;

                  return (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={value}
                        onCheckedChange={(checked) =>
                          setOptions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Icon className={`w-4 h-4 ${sourceInfo.color}`} />
                      <span className="text-sm">{sourceInfo.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="topic">Sujet / Niche à analyser</Label>
            <Input
              id="topic"
              placeholder="ex: vente de vêtements d'occasion, photos IA pour e-commerce"
              value={competitorTopic}
              onChange={(e) => setCompetitorTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <p className="text-sm text-gray-500 mt-2">
              L&apos;IA analysera la niche et générera les mots-clés qu&apos;un concurrent ciblerait.
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || (mode === "seed" && !seedKeyword.trim()) || (mode === "competitor" && !competitorTopic.trim())}
          className="mt-4 bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer les mots-clés
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Success */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">Mots-clés importés avec succès !</span>
        </div>
      )}

      {/* Results */}
      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Stats */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {keywords.length} mots-clés générés
                </span>
                <span className="text-gray-500">
                  {selectedKeywords.size} sélectionné(s)
                </span>
              </div>
              <div className="flex gap-2">
                {Object.entries(statsBySource).map(([source, count]) => {
                  const sourceInfo = SOURCES[source as keyof typeof SOURCES];
                  if (!sourceInfo) return null;
                  const Icon = sourceInfo.icon;
                  return (
                    <span
                      key={source}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border text-xs"
                    >
                      <Icon className={`w-3 h-3 ${sourceInfo.color}`} />
                      {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Tout sélectionner
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Tout désélectionner
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={selectedKeywords.size === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selectedKeywords.size === 0 || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Importer ({selectedKeywords.size})
              </Button>
            </div>
          </div>

          {/* Keyword List */}
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 border-b">
                <tr>
                  <th className="w-10 p-3"></th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Mot-clé</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600 w-28">Source</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600 w-28">Intent</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600 w-24">Volume</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, index) => {
                  const sourceInfo = SOURCES[kw.source];
                  const Icon = sourceInfo?.icon || Zap;
                  const intentInfo = kw.intent ? INTENTS[kw.intent] : null;

                  return (
                    <tr
                      key={`${kw.keyword}-${index}`}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        selectedKeywords.has(kw.keyword) ? "bg-purple-50" : ""
                      }`}
                      onClick={() => toggleKeyword(kw.keyword)}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedKeywords.has(kw.keyword)}
                          onCheckedChange={() => toggleKeyword(kw.keyword)}
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900">{kw.keyword}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-sm ${sourceInfo?.color || ""}`}>
                          <Icon className="w-3 h-3" />
                          {sourceInfo?.label || kw.source}
                        </span>
                      </td>
                      <td className="p-3">
                        {intentInfo && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${intentInfo.color}`}>
                            {intentInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {kw.estimatedVolume && (
                          <span className={`text-sm ${
                            kw.estimatedVolume === "high" ? "text-green-600 font-medium" :
                            kw.estimatedVolume === "medium" ? "text-yellow-600" :
                            "text-gray-500"
                          }`}>
                            {kw.estimatedVolume === "high" ? "Haut" :
                             kw.estimatedVolume === "medium" ? "Moyen" : "Bas"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Astuces pour de meilleurs résultats
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>KGR (Keyword Golden Ratio)</strong> - Cible les mots-clés avec moins de 250 recherches/mois
            et peu de résultats allintitle pour un ranking rapide
          </li>
          <li>
            <strong>Long-tail</strong> - Les mots-clés de 4-6 mots ont moins de concurrence et un meilleur taux de conversion
          </li>
          <li>
            <strong>Questions</strong> - &quot;Comment&quot;, &quot;Pourquoi&quot; sont parfaits pour le contenu informationnel et les featured snippets
          </li>
          <li>
            <strong>Autocomplete</strong> - Ces suggestions sont ce que les gens recherchent réellement
          </li>
          <li>
            <strong>Analyse concurrentielle</strong> - Identifie les gaps de contenu que tes concurrents n&apos;ont pas encore exploités
          </li>
        </ul>
      </div>
    </div>
  );
}
