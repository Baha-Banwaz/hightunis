"use client";

import { useEffect, useRef, useState } from "react";
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
  CalendarDays,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  // Below lg the sidebar is an off-canvas drawer. At lg and up it is always
  // open and this state is ignored.
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  return (
    <>
      {/* Mobile bar. The panel layout leaves room for it with pt-16 lg:pt-0. */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-2 border-black flex items-center justify-between px-4">
        <Link href="/admin" className="text-lg font-black tracking-tighter uppercase text-black">
          HIGHTUNIS
        </Link>
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label={open ? "Close the admin menu" : "Open the admin menu"}
          className="w-11 h-11 flex items-center justify-center border-2 border-black"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop, mobile only. Tapping it closes the drawer. */}
      {open && (
        <button
          type="button"
          aria-label="Close the admin menu"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`w-64 h-dvh bg-white border-r-2 border-black flex flex-col fixed left-0 top-0 z-50 overflow-y-auto transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-6 py-8 border-b-2 border-black flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase text-black">
              HIGHTUNIS
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[3px] text-black/60 mt-1">
              Content Manager
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
            aria-label="Close the admin menu"
            className="lg:hidden w-9 h-9 flex items-center justify-center border-2 border-black shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav aria-label="Admin" className="flex-1 py-6 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                // Closes the drawer on a phone, so the next page does not load
                // underneath a panel still covering it.
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-black text-white"
                    : "text-black/70 hover:bg-black/5 hover:text-black"
                }`}
              >
                <item.icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-6 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black/70 hover:bg-black/5 hover:text-black transition-all duration-200"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 transition-all duration-200 w-full text-left"
          >
            <LogOut size={18} aria-hidden="true" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
