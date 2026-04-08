"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  Users,
  MessageSquareQuote,
  Inbox,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    sessionStorage.removeItem("ht_admin_auth");
    window.location.reload();
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-black/10 flex flex-col fixed left-0 top-0 z-50">
      {/* Brand */}
      <div className="px-6 py-8 border-b border-black/10">
        <h1 className="text-xl font-black tracking-tighter uppercase text-black">
          HIGH TUNIS
        </h1>
        <p className="text-[9px] font-bold uppercase tracking-[3px] text-black/40 mt-1">
          Content Manager
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-black text-white"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-black/40 hover:bg-black/5 hover:text-black transition-all duration-200"
        >
          <ArrowLeft size={18} />
          Back to Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-500/60 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full text-left"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
