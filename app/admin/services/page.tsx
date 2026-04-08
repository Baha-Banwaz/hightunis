"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  published: boolean;
}

const EMPTY: Omit<Service, "id"> = {
  title: "",
  description: "",
  icon: "",
  order: 0,
  published: true,
};

export default function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    const { data } = await supabase.from("services").select("*").order("order", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (s: Service) => {
    setForm({ title: s.title, description: s.description, icon: s.icon || "", order: s.order, published: s.published });
    setEditing(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await supabase.from("services").update(form).eq("id", editing);
    } else {
      await supabase.from("services").insert([form]);
    }
    setSaving(false); setShowForm(false); setEditing(null); fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    fetch_();
  };

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from("services").update({ published: !current }).eq("id", id);
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Services</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">{items.length} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Published</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm text-black/40 font-bold">{s.order}</td>
                  <td className="px-6 py-4 text-sm font-bold text-black">{s.title}</td>
                  <td className="px-6 py-4 text-sm text-black/60 max-w-xs truncate">{s.description}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => togglePublished(s.id, s.published)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${s.published ? "bg-green-500 text-white" : "bg-black/10 text-black/30"}`}>
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/60 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">{editing ? "Edit Service" : "New Service"}</h2>
              <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-5">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-none" />
              </div>
              <Field label="Icon (Lucide icon name)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
              <Field label="Order" value={String(form.order)} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} />
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-5 h-5 accent-black" />
                <span className="text-sm font-bold">Published</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-black/10">
              <button onClick={() => setShowForm(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title}
                className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg disabled:opacity-40">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors" />
    </div>
  );
}
