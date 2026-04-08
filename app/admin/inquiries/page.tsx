"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Inbox, Mail, Clock } from "lucide-react";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  property_id: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["new", "contacted", "in-progress", "closed"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  "in-progress": "bg-purple-100 text-purple-700",
  closed: "bg-green-100 text-green-700",
};

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("inquiries").update({ status }).eq("id", id);
    fetch_();
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Inquiries</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">
            {items.length} total • {items.filter((i) => i.status === "new").length} new
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/10 p-16 text-center">
          <Inbox size={48} className="text-black/20 mx-auto mb-4" />
          <p className="text-sm text-black/40 font-bold uppercase tracking-widest">No inquiries yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((inq) => (
            <div key={inq.id} className="bg-white rounded-xl border border-black/10 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black tracking-tighter uppercase">{inq.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full ${STATUS_COLORS[inq.status] || STATUS_COLORS["new"]}`}>
                      {inq.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-black/40">
                    <span className="flex items-center gap-1 font-bold">
                      <Mail size={12} /> {inq.email}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Clock size={12} /> {formatDate(inq.created_at)}
                    </span>
                  </div>
                </div>
                <select
                  value={inq.status}
                  onChange={(e) => updateStatus(inq.id, e.target.value)}
                  className="text-xs font-bold uppercase tracking-[2px] border border-black/20 rounded-lg px-3 py-2 bg-white outline-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {inq.type && (
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/40 mb-2">
                  Subject: {inq.type}
                </p>
              )}
              <p className="text-sm text-black/70 leading-relaxed">{inq.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
