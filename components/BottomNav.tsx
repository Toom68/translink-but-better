"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Search, Map, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Stops", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/map", label: "Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: AlertCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="max-w-md mx-auto px-4 pb-3 pt-2">
        <div className="bg-bg-elevated/90 backdrop-blur-xl border border-border shadow-[var(--shadow-md)] rounded-full px-2 py-1.5 flex items-center justify-around">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-full transition-all duration-200",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
