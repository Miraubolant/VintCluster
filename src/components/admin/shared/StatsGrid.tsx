"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatColor = "indigo" | "green" | "orange" | "red" | "purple" | "blue" | "gray" | "amber" | "emerald" | "rose" | "cyan" | "yellow";

export interface StatCard {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: StatColor;
  suffix?: string;
  description?: string;
}

export interface StatsGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
  className?: string;
}

const COLOR_CLASSES: Record<StatColor, { bg: string; icon: string; text: string }> = {
  indigo: {
    bg: "bg-indigo-100",
    icon: "text-indigo-600",
    text: "text-indigo-700",
  },
  green: {
    bg: "bg-green-100",
    icon: "text-green-600",
    text: "text-green-700",
  },
  orange: {
    bg: "bg-orange-100",
    icon: "text-orange-600",
    text: "text-orange-700",
  },
  red: {
    bg: "bg-red-100",
    icon: "text-red-600",
    text: "text-red-700",
  },
  purple: {
    bg: "bg-purple-100",
    icon: "text-purple-600",
    text: "text-purple-700",
  },
  blue: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
    text: "text-blue-700",
  },
  gray: {
    bg: "bg-gray-100",
    icon: "text-gray-600",
    text: "text-gray-700",
  },
  amber: {
    bg: "bg-amber-100",
    icon: "text-amber-600",
    text: "text-amber-700",
  },
  emerald: {
    bg: "bg-emerald-100",
    icon: "text-emerald-600",
    text: "text-emerald-700",
  },
  rose: {
    bg: "bg-rose-100",
    icon: "text-rose-600",
    text: "text-rose-700",
  },
  cyan: {
    bg: "bg-cyan-100",
    icon: "text-cyan-600",
    text: "text-cyan-700",
  },
  yellow: {
    bg: "bg-yellow-100",
    icon: "text-yellow-600",
    text: "text-yellow-700",
  },
};

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export function StatsGrid({
  stats,
  columns = 4,
  loading = false,
  className,
}: StatsGridProps) {
  if (loading) {
    return (
      <div className={cn("grid gap-4", GRID_COLS[columns], className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", GRID_COLS[columns], className)}>
      {stats.map((stat, index) => {
        const colors = COLOR_CLASSES[stat.color];
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Icon className={cn("h-5 w-5", colors.icon)} />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-bold", colors.text)}>
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-sm text-gray-500">{stat.suffix}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                {stat.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Composant pour une stat inline (utile dans les headers)
export function StatBadge({
  value,
  label,
  color = "gray",
}: {
  value: number | string;
  label?: string;
  color?: StatColor;
}) {
  const colors = COLOR_CLASSES[color];

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm", colors.bg)}>
      <span className={cn("font-semibold", colors.text)}>{value}</span>
      {label && <span className="text-gray-600">{label}</span>}
    </div>
  );
}
