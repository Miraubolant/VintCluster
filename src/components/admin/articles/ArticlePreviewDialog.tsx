"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Article, FAQItem } from "@/types/database";
import Image from "next/image";
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

interface ArticlePreviewDialogProps {
  article: ArticleWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticlePreviewDialog({
  article,
  open,
  onOpenChange,
}: ArticlePreviewDialogProps) {
  if (!article) return null;

  const faq = (article.faq as FAQItem[] | null) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{article.site?.name}</Badge>
            <Badge variant="secondary">{article.keyword?.keyword}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {article.image_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
              <Image
                src={article.image_url}
                alt={article.image_alt || article.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {article.summary && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 italic">{article.summary}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {faq.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">FAQ</h3>
              <div className="space-y-4">
                {faq.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">
                      {item.question}
                    </p>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
