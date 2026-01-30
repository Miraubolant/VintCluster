"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Tag,
  Calendar,
  History,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Sites", href: "/admin/sites", icon: Globe },
  { name: "Mots-clés", href: "/admin/keywords", icon: Tag },
  { name: "Articles", href: "/admin/articles", icon: FileText },
  { name: "Planification", href: "/admin/scheduler", icon: Calendar },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Historique", href: "/admin/logs", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 hidden lg:block">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-base">VC</span>
          </div>
          <span className="font-semibold text-lg text-gray-900">VintCluster</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-5 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-gray-200">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[15px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-400" />
          Paramètres
        </Link>
      </div>
    </aside>
  );
}
