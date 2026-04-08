"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Testimonial {
  id: string;
  author: string;
  role: string;
  quote: string;
  photo_url: string;
  published: boolean;
}

const EMPTY: Omit<Testimonial, "id"> = {
  author: "",
  role: "",
  quote: "",
  photo_url: "",
  published: true,
};

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (t: Testimonial) => {
    setForm({ author: t.author, role: t.role || "", quote: t.quote, photo_url: t.photo_url || "", published: t.published });
    setEditing(t.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await supabase.from("testimonials").update(form).eq("id", editing);
    } else {
      await supabase.from("testimonials").insert([form]);
    }
    setSaving(false); setShowForm(false); setEditing(null); fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    fetch_();
  };

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from("testimonials").update({ published: !current }).eq("id", id);
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Testimonials</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">{items.length} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg">
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/10 p-16 text-center">
          <p className="text-sm text-black/40 font-bold uppercase tracking-widest">No testimonials yet</p>
          <button onClick={openNew} className="mt-6 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] rounded-lg hover:bg-black/80 transition-colors">
            Add First Testimonial
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-black/10 p-6 flex items-start gap-6">
              <div className="flex-1">
                <p className="text-lg font-semibold italic text-black/80 mb-3">"{t.quote}"</p>
                <p className="text-sm font-black uppercase tracking-tighter">{t.author}</p>
                {t.role && <p className="text-xs font-bold uppercase tracking-[2px] text-black/40">{t.role}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => togglePublished(t.id, t.published)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t.published ? "bg-green-500 text-white" : "bg-black/10 text-black/30"}`}>
                  <Check size={14} />
                </button>
                <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/60 transition-colors"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">{editing ? "Edit Testimonial" : "New Testimonial"}</h2>
              <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-5">
              <Field label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
              <Field label="Role / Title" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Quote</label>
                <textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} rows={4}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-none" />
              </div>
              <Field label="Photo URL" value={form.photo_url} onChange={(v) => setForm({ ...form, photo_url: v })} />
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-5 h-5 accent-black" />
                <span className="text-sm font-bold">Published</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-black/10">
              <button onClick={() => setShowForm(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.author || !form.quote}
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
