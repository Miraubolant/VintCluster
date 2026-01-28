"use client";

import { Activity, Calendar, CalendarDays, BarChart3 } from "lucide-react";

interface LogsStatsProps {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    byType: Record<string, number>;
  };
}

export function LogsStats({ stats }: LogsStatsProps) {
  const topTypes = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const items = [
    {
      label: "Total",
      value: stats.total,
      icon: Activity,
      color: "bg-gray-100 text-gray-600",
    },
    {
      label: "Aujourd'hui",
      value: stats.today,
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Cette semaine",
      value: stats.thisWeek,
      icon: CalendarDays,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Types",
      value: Object.keys(stats.byType).length,
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
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

      {topTypes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Types les plus fréquents
          </h3>
          <div className="flex flex-wrap gap-2">
            {topTypes.map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                <span className="text-gray-700">{type.replace(/_/g, " ")}</span>
                <span className="text-gray-500 font-medium">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
