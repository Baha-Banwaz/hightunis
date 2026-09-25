import AdminSidebar from "../components/AdminSidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-stone">
      <AdminSidebar />
      {/*
        ml-64 only from lg up: below that the sidebar is an off-canvas drawer,
        so reserving 16rem of left margin pushed every admin page off the side
        of a phone screen. pt-16 leaves room for the mobile bar.
        min-w-0 stops a wide table stretching the flex item and forcing the
        whole page to scroll sideways.
      */}
      <main className="flex-1 min-w-0 lg:ml-64 px-5 sm:px-8 md:px-12 pb-8 md:pb-12 pt-20 lg:pt-12">
        {children}
      </main>
    </div>
  );
}
