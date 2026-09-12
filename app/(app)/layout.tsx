import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "@/components/Providers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Providers>
      <div className="flex flex-col min-h-screen bg-bg">
        <main className="flex-1 pb-16">{children}</main>
        <BottomNav />
      </div>
    </Providers>
  );
}
