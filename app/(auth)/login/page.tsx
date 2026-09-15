"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button, Input, Card } from "@/components/ui";
import { Bus } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        console.error("Auth error:", error);
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      console.error("Login exception:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send magic link. Check your connection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-5 shadow-[var(--shadow-md)]">
            <Bus size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">TransLink But Better</h1>
          <p className="text-sm text-text-secondary mt-1.5">
            Your saved stops, live arrivals
          </p>
        </div>

        {sent ? (
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              We sent a magic link to <strong>{email}</strong>. Click the link
              to sign in.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setSent(false)}
              className="w-full"
            >
              Use a different email
            </Button>
          </Card>
        ) : (
          <Card className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && (
                <div className="text-sm text-danger bg-danger-soft rounded-xl p-3 leading-relaxed">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          </Card>
        )}

        <p className="text-xs text-text-muted text-center mt-6 leading-relaxed">
          By signing in, you agree to save your stops across devices.
        </p>
      </div>
    </div>
  );
}
