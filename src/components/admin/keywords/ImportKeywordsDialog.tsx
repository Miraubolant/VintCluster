"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import { importKeywords, type KeywordImportData } from "@/lib/actions/keywords";
import { toast } from "sonner";
import type { Site } from "@/types/database";

interface ImportKeywordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  onSuccess: () => void;
}

type ImportStep = "select-site" | "input" | "preview" | "result";

// Interface pour le parsing CSV avec en-têtes
interface CSVRow {
  keyword?: string;
  search_volume?: string;
  difficulty?: string;
  cluster?: string;
  site_key?: string;
  priority?: string;
  notes?: string;
  [key: string]: string | undefined;
}

export function ImportKeywordsDialog({
  open,
  onOpenChange,
  sites,
  onSuccess,
}: ImportKeywordsDialogProps) {
  const [step, setStep] = useState<ImportStep>("select-site");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("global");
  const [rawInput, setRawInput] = useState("");
  const [parsedKeywords, setParsedKeywords] = useState<KeywordImportData[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null);

  const parseCSVRow = useCallback((row: CSVRow): KeywordImportData | null => {
    const keyword = row.keyword?.trim();
    if (!keyword) return null;

    return {
      keyword,
      search_volume: row.search_volume ? parseInt(row.search_volume, 10) : undefined,
      difficulty: row.difficulty ? parseInt(row.difficulty, 10) : undefined,
      cluster: row.cluster?.trim() || undefined,
      site_key: row.site_key?.trim() || undefined,
      priority: row.priority ? parseInt(row.priority, 10) : undefined,
      notes: row.notes?.trim() || undefined,
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const keywords: KeywordImportData[] = [];

        results.data.forEach((row: unknown) => {
          const csvRow = row as CSVRow;
          const parsed = parseCSVRow(csvRow);
          if (parsed) {
            keywords.push(parsed);
          }
        });

        if (keywords.length === 0) {
          // Fallback: essayer sans en-têtes (première colonne = keyword)
          Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (fallbackResults) => {
              const fallbackKeywords: KeywordImportData[] = [];
              fallbackResults.data.forEach((row: unknown) => {
                if (Array.isArray(row) && row[0]) {
                  const keyword = String(row[0]).trim();
                  if (keyword && keyword !== "keyword") {
                    fallbackKeywords.push({ keyword });
                  }
                }
              });
              setParsedKeywords(fallbackKeywords);
              setStep("preview");
            },
          });
        } else {
          setParsedKeywords(keywords);
          setStep("preview");
        }
      },
      error: () => {
        toast.error("Erreur lors de la lecture du fichier");
      },
    });
  }, [parseCSVRow]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  function handleTextInput() {
    const lines = rawInput
      .split(/[\n,;]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setParsedKeywords(lines.map((keyword) => ({ keyword })));
    setStep("preview");
  }

  async function handleImport() {
    if (parsedKeywords.length === 0) return;

    setImporting(true);
    const siteId = selectedSiteId === "global" ? null : selectedSiteId;
    const res = await importKeywords(siteId, parsedKeywords);
    setImporting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    setResult({ imported: res.imported, duplicates: res.duplicates });
    setStep("result");
  }

  function handleClose() {
    setStep("select-site");
    setSelectedSiteId("global");
    setRawInput("");
    setParsedKeywords([]);
    setResult(null);
    onOpenChange(false);
    if (result && result.imported > 0) {
      onSuccess();
    }
  }

  function handleBack() {
    if (step === "input") {
      setStep("select-site");
    } else if (step === "preview") {
      setStep("input");
      setParsedKeywords([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des mots-clés</DialogTitle>
          <DialogDescription>
            {step === "select-site" && "Sélectionnez le site cible (optionnel)"}
            {step === "input" && "Uploadez un fichier CSV ou collez vos mots-clés"}
            {step === "preview" && `${parsedKeywords.length} mots-clés détectés`}
            {step === "result" && "Import terminé"}
          </DialogDescription>
        </DialogHeader>

        {step === "select-site" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Site de destination</Label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un site (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span>Global (tous les sites)</span>
                    </div>
                  </SelectItem>
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
                Les mots-clés globaux peuvent être utilisés pour générer des articles sur n&apos;importe quel site.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep("input")}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === "input" && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? "Déposez le fichier ici"
                  : "Glissez un fichier CSV ou cliquez pour sélectionner"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Formats acceptés: .csv, .txt
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Colonnes CSV: keyword, search_volume, difficulty, cluster, site_key, priority, notes
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>

            <Textarea
              placeholder="Collez vos mots-clés (un par ligne, ou séparés par des virgules)"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={5}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              <Button onClick={handleTextInput} disabled={!rawInput.trim()}>
                Aperçu
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              <div className="p-3 space-y-1">
                {parsedKeywords.slice(0, 50).map((kw, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 text-sm py-1 px-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{kw.keyword}</span>
                    </div>
                    {(kw.search_volume || kw.priority) && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                        {kw.search_volume && <span>Vol: {kw.search_volume}</span>}
                        {kw.priority && <span>P{kw.priority}</span>}
                      </div>
                    )}
                  </div>
                ))}
                {parsedKeywords.length > 50 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    ... et {parsedKeywords.length - 50} autres mots-clés
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Import en cours..." : `Importer ${parsedKeywords.length} mots-clés`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">
                {result.imported} mot{result.imported > 1 ? "s" : ""}-clé
                {result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""}
              </p>
              {result.duplicates > 0 && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  {result.duplicates} doublon{result.duplicates > 1 ? "s" : ""} ignoré
                  {result.duplicates > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
