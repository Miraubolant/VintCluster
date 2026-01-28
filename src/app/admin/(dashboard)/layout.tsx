import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { BulkProgressWrapper } from "@/components/admin/BulkProgressWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <BulkProgressWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <div className="lg:pl-64">
          <AdminHeader user={user} />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </BulkProgressWrapper>
  );
}
