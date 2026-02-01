import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { BulkProgressWrapper } from "@/components/admin/BulkProgressWrapper";
import { MobileSidebarProvider } from "@/components/admin/MobileSidebarContext";

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
      <MobileSidebarProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main content */}
          <div className="lg:pl-72">
            <AdminHeader user={user} />
            <main className="p-4 sm:p-6 lg:p-8 xl:p-10">
              <div className="max-w-[1800px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </MobileSidebarProvider>
    </BulkProgressWrapper>
  );
}
