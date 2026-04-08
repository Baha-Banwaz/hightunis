"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string;
  bio: string;
  order: number;
}

const EMPTY: Omit<TeamMember, "id"> = {
  name: "",
  role: "",
  photo_url: "",
  bio: "",
  order: 0,
};

export default function AdminTeam() {
  const [items, setItems] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const getToken = () => sessionStorage.getItem("admin_token") || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

  const fetch_ = async () => {
    try {
      const res = await fetch("/api/admin/team?orderColumn=order&ascending=true", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
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

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (t: TeamMember) => {
    setForm({ name: t.name, role: t.role, photo_url: t.photo_url || "", bio: t.bio || "", order: t.order });
    setEditing(t.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/team?id=${editing}` : "/api/admin/team";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify(form)
    });
    setSaving(false); setShowForm(false); setEditing(null); fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    await fetch(`/api/admin/team?id=${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Team</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">{items.length} members</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/10 p-16 text-center">
          <p className="text-sm text-black/40 font-bold uppercase tracking-widest">No team members yet</p>
          <button onClick={openNew} className="mt-6 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] rounded-lg hover:bg-black/80 transition-colors">
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-black/10 p-6 flex flex-col">
              {t.photo_url && (
                <div className="w-16 h-16 rounded-full bg-black/5 mb-4 overflow-hidden">
                  <img src={t.photo_url} alt={t.name} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-lg font-black tracking-tighter uppercase">{t.name}</h3>
              <p className="text-xs font-bold uppercase tracking-[2px] text-black/40 mt-1">{t.role}</p>
              {t.bio && <p className="text-sm text-black/60 mt-3 line-clamp-2">{t.bio}</p>}
              <div className="flex items-center gap-2 mt-auto pt-4">
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
              <h2 className="text-xl font-black uppercase tracking-tighter">{editing ? "Edit Member" : "New Member"}</h2>
              <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-5">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Role / Title" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
              <Field label="Photo URL" value={form.photo_url} onChange={(v) => setForm({ ...form, photo_url: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-none" />
              </div>
              <Field label="Order" value={String(form.order)} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} />
            </div>
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-black/10">
              <button onClick={() => setShowForm(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
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
