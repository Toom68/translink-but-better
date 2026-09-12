"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button, Input, Card } from "@/components/ui";
import { Bus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Bus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">TransLink But Better</h1>
          <p className="text-sm text-text-secondary mt-1">
            Your saved stops, live arrivals
          </p>
        </div>

        {sent ? (
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-text-secondary mb-4">
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
                <p className="text-sm text-danger">{error}</p>
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

        <p className="text-xs text-text-muted text-center mt-6">
          By signing in, you agree to save your stops across devices.
        </p>
      </div>
    </div>
  );
}
