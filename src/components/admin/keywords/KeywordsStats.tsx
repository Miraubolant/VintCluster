"use client";

import { FileText, Clock, Sparkles, CheckCircle, Archive, LayoutList } from "lucide-react";

interface KeywordsStatsProps {
  stats: {
    total: number;
    pending: number;
    generating: number;
    generated: number;
    published: number;
    archived: number;
  };
}

export function KeywordsStats({ stats }: KeywordsStatsProps) {
  const items = [
    { label: "Total", value: stats.total, icon: LayoutList, color: "bg-gray-100 text-gray-600" },
    { label: "En attente", value: stats.pending, icon: Clock, color: "bg-yellow-100 text-yellow-600" },
    { label: "En génération", value: stats.generating, icon: Sparkles, color: "bg-blue-100 text-blue-600" },
    { label: "Générés", value: stats.generated, icon: FileText, color: "bg-purple-100 text-purple-600" },
    { label: "Publiés", value: stats.published, icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { label: "Archivés", value: stats.archived, icon: Archive, color: "bg-gray-100 text-gray-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
