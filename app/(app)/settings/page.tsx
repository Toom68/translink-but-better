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

    // Load theme from localStorage
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
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold mb-5">Settings</h1>

      {/* Account */}
      <h2 className="text-sm font-semibold text-text-secondary mb-2">Account</h2>
      <Card className="p-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
            {email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{email ?? "Not signed in"}</p>
            <p className="text-xs text-text-muted">Signed in via magic link</p>
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
      <h2 className="text-sm font-semibold text-text-secondary mb-2">Appearance</h2>
      <Card className="p-2 mb-5">
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
                  "flex flex-col items-center gap-2 py-3 rounded-[var(--radius-sm)] transition-colors",
                  theme === opt.value
                    ? "bg-accent-soft text-accent"
                    : "text-text-secondary hover:bg-bg-subtle"
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* About */}
      <h2 className="text-sm font-semibold text-text-secondary mb-2">About</h2>
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Bus size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">TransLink But Better</p>
            <p className="text-xs text-text-muted">v1.0.0</p>
          </div>
        </div>
        <div className="text-xs text-text-secondary space-y-1">
          <p>Real-time data from TransLink Queensland (CC-BY-4.0)</p>
          <p>Map tiles from OpenFreeMap / OpenStreetMap contributors</p>
          <p>Built for Brisbane transit riders</p>
        </div>
      </Card>
    </div>
  );
}
