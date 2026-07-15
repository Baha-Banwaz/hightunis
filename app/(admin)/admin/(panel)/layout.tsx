import AdminSidebar from "../components/AdminSidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 md:p-12">{children}</main>
    </div>
  );
}
