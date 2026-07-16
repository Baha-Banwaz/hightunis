"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Property {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  price: string;
  description: string;
  image_url: string;
  gallery: string[];
  amenities: string[];
  featured: boolean;
  published: boolean;
  order: number;
}

const CATEGORIES = ["Villas", "Hotels", "Yachts", "Restaurants"];

const EMPTY_FORM: Omit<Property, "id"> = {
  name: "",
  slug: "",
  category: "Villas",
  location: "",
  price: "",
  description: "",
  image_url: "",
  gallery: [],
  amenities: [],
  featured: false,
  published: true,
  order: 0,
};

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [amenitiesInput, setAmenitiesInput] = useState("");
  const [galleryInput, setGalleryInput] = useState("");
  const [saving, setSaving] = useState(false);


  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/admin/properties?orderColumn=order&ascending=true", {
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openNew = () => {
    setForm(EMPTY_FORM);
    setAmenitiesInput("");
    setGalleryInput("");
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Property) => {
    setForm({
      name: p.name,
      slug: p.slug,
      category: p.category,
      location: p.location,
      price: p.price,
      description: p.description,
      image_url: p.image_url,
      gallery: p.gallery || [],
      amenities: p.amenities || [],
      featured: p.featured,
      published: p.published,
      order: p.order,
    });
    setAmenitiesInput((p.amenities || []).join(", "));
    setGalleryInput((p.gallery || []).join("\n"));
    setEditing(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      // always sanitize — a slug with spaces or symbols breaks the page URL
      slug: generateSlug(form.slug || form.name),
      amenities: amenitiesInput.split(",").map((s) => s.trim()).filter(Boolean),
      gallery: galleryInput.split(/\n+/).map((s) => s.trim()).filter(Boolean),
    };

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/properties?id=${editing}` : "/api/admin/properties";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    setShowForm(false);
    setEditing(null);
    fetchProperties();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property?")) return;
    await fetch(`/api/admin/properties?id=${id}`, {
      method: "DELETE",
    });
    fetchProperties();
  };

  const toggleField = async (id: string, field: "featured" | "published", current: boolean) => {
    await fetch(`/api/admin/properties?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [field]: !current })
    });
    fetchProperties();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">
            Properties
          </h1>
          <p className="text-sm text-black/40 font-semibold mt-1">
            {properties.length} total
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg"
        >
          <Plus size={16} /> Add Property
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Featured</th>
                <th className="px-6 py-4 text-center">Published</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm text-black/40 font-bold">{p.order}</td>
                  <td className="px-6 py-4 text-sm font-bold text-black">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase tracking-[2px] bg-black/5 px-3 py-1 rounded-full">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-black/60">{p.location}</td>
                  <td className="px-6 py-4 text-sm font-bold text-black">{p.price}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleField(p.id, "featured", p.featured)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        p.featured ? "bg-black text-white" : "bg-black/10 text-black/30"
                      }`}
                    >
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleField(p.id, "published", p.published)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        p.published ? "bg-green-500 text-white" : "bg-black/10 text-black/30"
                      }`}
                    >
                      <Check size={14} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/60 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">
                {editing ? "Edit Property" : "New Property"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black">
                <X size={20} />
              </button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-5">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: generateSlug(v) })} />
              <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">
                  Category — pick one or type a new one
                </label>
                <input
                  list="category-suggestions"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                />
                <datalist id="category-suggestions">
                  {Array.from(new Set([...CATEGORIES, ...properties.map((p) => p.category).filter(Boolean)])).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="text-[10px] text-black/40 font-semibold mt-2">
                  The website filter tabs are built from these categories — keep the spelling consistent.
                </p>
              </div>
              <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
              <Field label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-none"
                />
              </div>
              <Field label="Main Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">
                  Gallery — one image URL per line
                </label>
                <textarea
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  rows={4}
                  placeholder={"https://...jpg\nhttps://...jpg"}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-xs font-mono outline-none focus:border-black transition-colors resize-y"
                />
                {galleryInput.trim() && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {galleryInput.split(/\n+/).map((u) => u.trim()).filter(Boolean).map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt={`Gallery ${i + 1}`} className="h-20 w-28 object-cover rounded-lg border border-black/10 shrink-0" />
                    ))}
                  </div>
                )}
              </div>
              <Field label="Amenities (comma separated)" value={amenitiesInput} onChange={setAmenitiesInput} />
              <Field label="Order" value={String(form.order)} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} />
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-5 h-5 accent-black" />
                  <span className="text-sm font-bold">Featured</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-5 h-5 accent-black" />
                  <span className="text-sm font-bold">Published</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-black/10">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg disabled:opacity-40"
              >
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
      />
    </div>
  );
}
