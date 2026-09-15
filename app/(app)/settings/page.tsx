"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Card, Button } from "@/components/ui";
import { LogOut, Moon, Sun, Monitor, Info, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>("system");
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
    const saved = localStorage.getItem("theme") || "system";
    setTheme(saved);
  }, []);

  function applyTheme(newTheme: string) {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  }

  async function handleSignOut() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-5 pt-10 pb-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>

      {/* Account */}
      <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">Account</h2>
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-lg">
            {email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{email ?? "Not signed in"}</p>
            <p className="text-xs text-text-muted mt-0.5">Signed in via magic link</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleSignOut}
          className="w-full mt-4"
        >
          <LogOut size={18} /> Sign out
        </Button>
      </Card>

      {/* Theme */}
      <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">Appearance</h2>
      <Card className="p-3 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "Auto", icon: Monitor },
          ].map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => applyTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-[var(--radius-sm)] transition-all duration-200",
                  theme === opt.value
                    ? "bg-accent-soft text-accent"
                    : "text-text-secondary hover:bg-bg-subtle"
                )}
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* About */}
      <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">About</h2>
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center">
            <Bus size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">TransLink But Better</p>
            <p className="text-xs text-text-muted mt-0.5">v1.0.0</p>
          </div>
        </div>
        <div className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
          <p>Real-time data from TransLink Queensland (CC-BY-4.0)</p>
          <p>Map tiles from CARTO / OpenStreetMap contributors</p>
          <p>Built for Brisbane transit riders</p>
        </div>
      </Card>
    </div>
  );
}
