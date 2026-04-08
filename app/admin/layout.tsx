import PasswordGate from "./components/PasswordGate";
import AdminSidebar from "./components/AdminSidebar";

export const metadata = {
  title: "Admin | High Tunis",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PasswordGate>
      <div className="flex min-h-screen bg-[#FAFAFA]">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-8 md:p-12">{children}</main>
      </div>
    </PasswordGate>
  );
}
