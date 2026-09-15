"use client";

import { useState } from "react";
import { VehicleMap } from "@/components/VehicleMap";
import { cn } from "@/lib/utils";
import type { TransitMode } from "@/lib/gtfs/types";
import { Bus, Train, Sailboat, TramFront, Layers } from "lucide-react";

const MODE_TABS: { mode: TransitMode; label: string; icon: typeof Bus }[] = [
  { mode: "all", label: "All", icon: Layers },
  { mode: "bus", label: "Bus", icon: Bus },
  { mode: "rail", label: "Train", icon: Train },
  { mode: "ferry", label: "Ferry", icon: Sailboat },
  { mode: "tram", label: "Tram", icon: TramFront },
];

export default function MapPage() {
  const [mode, setMode] = useState<TransitMode>("all");

  return (
    <div className="fixed inset-0 top-0 bottom-24" style={{ height: "calc(100vh - 6rem)" }}>
      {/* Mode filter pills */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-bg-elevated/90 backdrop-blur-xl border border-border shadow-[var(--shadow-md)] rounded-full px-2 py-1.5 flex items-center gap-0.5 safe-top">
        {MODE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.mode;
          return (
            <button
              key={tab.mode}
              onClick={() => setMode(tab.mode)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                active
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <VehicleMap mode={mode} />
    </div>
  );
}
