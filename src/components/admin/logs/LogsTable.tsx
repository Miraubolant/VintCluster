"use client";

import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  EyeOff,
  Upload,
  Globe,
  Settings,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { ActivityLog } from "@/types/database";

interface ActivityLogWithSite extends ActivityLog {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

interface LogsTableProps {
  logs: ActivityLogWithSite[];
}

const typeConfig: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  article_generated: {
    label: "Article généré",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-700",
  },
  article_published: {
    label: "Article publié",
    icon: Eye,
    color: "bg-green-100 text-green-700",
  },
  article_unpublished: {
    label: "Article dépublié",
    icon: EyeOff,
    color: "bg-gray-100 text-gray-700",
  },
  keyword_imported: {
    label: "Mots-clés importés",
    icon: Upload,
    color: "bg-blue-100 text-blue-700",
  },
  site_created: {
    label: "Site créé",
    icon: Globe,
    color: "bg-indigo-100 text-indigo-700",
  },
  site_updated: {
    label: "Site modifié",
    icon: Settings,
    color: "bg-yellow-100 text-yellow-700",
  },
  scheduler_updated: {
    label: "Scheduler modifié",
    icon: Settings,
    color: "bg-orange-100 text-orange-700",
  },
  error: {
    label: "Erreur",
    icon: AlertCircle,
    color: "bg-red-100 text-red-700",
  },
};

function getTypeConfig(type: string) {
  return (
    typeConfig[type] || {
      label: type.replace(/_/g, " "),
      icon: FileText,
      color: "bg-gray-100 text-gray-700",
    }
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Moins d'une minute
  if (diff < 60000) {
    return "À l'instant";
  }

  // Moins d'une heure
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `Il y a ${minutes} min`;
  }

  // Moins d'un jour
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Il y a ${hours}h`;
  }

  // Plus d'un jour
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LogsTable({ logs }: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Aucune activité enregistrée</p>
        <p className="text-sm text-gray-400 mt-1">
          Les actions seront enregistrées ici
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => {
              const config = getTypeConfig(log.type);
              const Icon = config.icon;

              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Badge className={`${config.color} gap-1.5`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">{log.message}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {log.site?.name || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(log.created_at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
