"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Briefcase, Inbox, Users, FileText, MessageSquareQuote } from "lucide-react";
import Link from "next/link";

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    services: 0,
    blog: 0,
    team: 0,
    testimonials: 0,
    inquiries: 0,
    newInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [props, svcs, blogs, teamMembers, tests, inqs, newInqs] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("team").select("id", { count: "exact", head: true }),
        supabase.from("testimonials").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);

      setStats({
        properties: props.count ?? 0,
        services: svcs.count ?? 0,
        blog: blogs.count ?? 0,
        team: teamMembers.count ?? 0,
        testimonials: tests.count ?? 0,
        inquiries: inqs.count ?? 0,
        newInquiries: newInqs.count ?? 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards: StatCard[] = [
    { label: "Properties", value: stats.properties, icon: Building2, href: "/admin/properties", color: "bg-black" },
    { label: "Services", value: stats.services, icon: Briefcase, href: "/admin/services", color: "bg-stone-800" },
    { label: "Blog Posts", value: stats.blog, icon: FileText, href: "/admin/blog", color: "bg-stone-700" },
    { label: "Team Members", value: stats.team, icon: Users, href: "/admin/team", color: "bg-stone-600" },
    { label: "Testimonials", value: stats.testimonials, icon: MessageSquareQuote, href: "/admin/testimonials", color: "bg-stone-500" },
    { label: "Inquiries", value: `${stats.inquiries} (${stats.newInquiries} new)`, icon: Inbox, href: "/admin/inquiries", color: "bg-blue-600" },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-black">
          Dashboard
        </h1>
        <p className="text-sm text-black/40 font-semibold mt-2">
          Content overview for High Tunis
        </p>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">
          Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`${card.color} text-white rounded-xl p-8 flex flex-col justify-between min-h-[180px] hover:opacity-90 transition-opacity group`}
            >
              <div className="flex items-center justify-between">
                <card.icon size={28} className="opacity-60" />
                <span className="text-xs font-bold uppercase tracking-[2px] opacity-60">
                  Manage →
                </span>
              </div>
              <div>
                <p className="text-4xl font-black tracking-tighter">{card.value}</p>
                <p className="text-sm font-bold uppercase tracking-widest opacity-70 mt-1">
                  {card.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
