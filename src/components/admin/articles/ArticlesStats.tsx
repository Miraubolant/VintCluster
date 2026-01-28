"use client";

import { FileText, Edit, CheckCircle, Eye, EyeOff } from "lucide-react";

interface ArticlesStatsProps {
  stats: {
    total: number;
    draft: number;
    ready: number;
    published: number;
    unpublished: number;
  };
}

export function ArticlesStats({ stats }: ArticlesStatsProps) {
  const items = [
    { label: "Total", value: stats.total, icon: FileText, color: "bg-gray-100 text-gray-600" },
    { label: "Brouillons", value: stats.draft, icon: Edit, color: "bg-yellow-100 text-yellow-600" },
    { label: "Prêts", value: stats.ready, icon: CheckCircle, color: "bg-blue-100 text-blue-600" },
    { label: "Publiés", value: stats.published, icon: Eye, color: "bg-green-100 text-green-600" },
    { label: "Dépubliés", value: stats.unpublished, icon: EyeOff, color: "bg-gray-100 text-gray-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
