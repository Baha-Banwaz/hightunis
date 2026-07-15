"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  excerpt: string;
  published: boolean;
  published_at: string | null;
}

const EMPTY: Omit<BlogPost, "id"> = {
  title: "",
  slug: "",
  content: "",
  cover_image: "",
  excerpt: "",
  published: false,
  published_at: null,
};

export default function AdminBlog() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);


  const fetch_ = async () => {
    try {
      const res = await fetch("/api/admin/blog", {
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (b: BlogPost) => {
    setForm({
      title: b.title, slug: b.slug, content: b.content,
      cover_image: b.cover_image || "", excerpt: b.excerpt || "",
      published: b.published, published_at: b.published_at,
    });
    setEditing(b.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
      published_at: form.published ? (form.published_at || new Date().toISOString()) : null,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/blog?id=${editing}` : "/api/admin/blog";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    setSaving(false); setShowForm(false); setEditing(null); fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await fetch(`/api/admin/blog?id=${id}`, {
      method: "DELETE",
    });
    fetch_();
  };

  const togglePublished = async (id: string, current: boolean) => {
    const update: Record<string, unknown> = { published: !current };
    if (!current) update.published_at = new Date().toISOString();
    
    await fetch(`/api/admin/blog?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update)
    });
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Blog</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">{items.length} posts</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg">
          <Plus size={16} /> New Post
        </button>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Excerpt</th>
                <th className="px-6 py-4 text-center">Published</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-black">{b.title}</td>
                  <td className="px-6 py-4 text-sm text-black/60 max-w-xs truncate">{b.excerpt}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => togglePublished(b.id, b.published)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${b.published ? "bg-green-500 text-white" : "bg-black/10 text-black/30"}`}>
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(b)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/60 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(b.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 transition-colors"><Trash2 size={14} /></button>
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
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">{editing ? "Edit Post" : "New Post"}</h2>
              <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-5">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v, slug: generateSlug(v) })} />
              <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
              <Field label="Cover Image URL" value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} />
              <Field label="Excerpt" value={form.excerpt} onChange={(v) => setForm({ ...form, excerpt: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-none" />
              </div>
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
