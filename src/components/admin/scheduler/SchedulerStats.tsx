"use client";

import { Settings, Power, Clock, FileText } from "lucide-react";

interface SchedulerStatsProps {
  stats: {
    totalConfigs: number;
    enabledConfigs: number;
    pendingKeywords: number;
    articlesToday: number;
  };
}

export function SchedulerStats({ stats }: SchedulerStatsProps) {
  const items = [
    {
      label: "Sites configurés",
      value: stats.totalConfigs,
      icon: Settings,
      color: "bg-gray-100 text-gray-600",
    },
    {
      label: "Schedulers actifs",
      value: stats.enabledConfigs,
      icon: Power,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Mots-clés en attente",
      value: stats.pendingKeywords,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Articles aujourd'hui",
      value: stats.articlesToday,
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
