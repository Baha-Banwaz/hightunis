"use client";

import { useEffect, useState } from "react";
import { Inbox, Mail, Clock, Phone, CalendarDays, Pencil, X, Trash2 } from "lucide-react";
import DatePicker from "@/app/components/DatePicker";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  property_id: string | null;
  status: string;
  phone?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  created_at: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["new", "contacted", "booked", "finished"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  booked: "bg-green-100 text-green-700",
  finished: "bg-stone-200 text-stone-600",
};

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit form state
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fType, setFType] = useState("");
  const [fMessage, setFMessage] = useState("");
  const [fStatus, setFStatus] = useState("new");
  const [fPropertyId, setFPropertyId] = useState("");
  const [fCheckIn, setFCheckIn] = useState<Date | null>(null);
  const [fCheckOut, setFCheckOut] = useState<Date | null>(null);

  const fetch_ = async () => {
    try {
      const [inqRes, propsRes] = await Promise.all([
        fetch("/api/admin/inquiries"),
        fetch("/api/admin/properties?orderColumn=order&ascending=true"),
      ]);
      if (inqRes.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (inqRes.ok) setItems(await inqRes.json());
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const propertyName = (id: string | null) =>
    properties.find((p) => p.id === id)?.name ?? null;

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/inquiries?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetch_();
  };

  const openEdit = (inq: Inquiry) => {
    setEditing(inq);
    setFName(inq.name);
    setFEmail(inq.email);
    setFPhone(inq.phone ?? "");
    setFType(inq.type ?? "");
    setFMessage(inq.message ?? "");
    setFStatus(inq.status);
    setFPropertyId(inq.property_id ?? "");
    setFCheckIn(parseISODate(inq.check_in));
    setFCheckOut(parseISODate(inq.check_out));
    setFormError("");
  };

  const handleSave = async () => {
    if (!fName.trim() || !fEmail.trim()) {
      setFormError("Name and email are required");
      return;
    }
    if (fCheckIn && fCheckOut && fCheckOut <= fCheckIn) {
      setFormError("Check-out must be after check-in");
      return;
    }
    if (fStatus === "booked" && (!fPropertyId || !fCheckIn || !fCheckOut)) {
      setFormError("A booked inquiry needs a property, check-in and check-out — otherwise it can't block the calendar");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/inquiries?id=${editing!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fName.trim(),
        email: fEmail.trim(),
        phone: fPhone.trim() || null,
        type: fType.trim(),
        message: fMessage,
        status: fStatus,
        property_id: fPropertyId || null,
        check_in: fCheckIn ? toISODate(fCheckIn) : null,
        check_out: fCheckOut ? toISODate(fCheckOut) : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      fetch_();
    } else {
      const err = await res.json().catch(() => ({}));
      setFormError(err?.error ?? "Could not save changes");
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm(`Delete the inquiry from ${editing.name}? This also removes its calendar block.`)) return;
    await fetch(`/api/admin/inquiries?id=${editing.id}`, { method: "DELETE" });
    setEditing(null);
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
                    {propertyName(inq.property_id) && (
                      <span className="text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full bg-black/5 text-black/60">
                        {propertyName(inq.property_id)}
                      </span>
                    )}
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
                <div className="flex items-center gap-2">
                  <select
                    value={inq.status}
                    onChange={(e) => updateStatus(inq.id, e.target.value)}
                    className="text-xs font-bold uppercase tracking-[2px] border border-black/20 rounded-lg px-3 py-2 bg-white outline-none cursor-pointer"
                  >
                    {(STATUS_OPTIONS.includes(inq.status)
                      ? STATUS_OPTIONS
                      : [inq.status, ...STATUS_OPTIONS]
                    ).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => openEdit(inq)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 text-black/60 transition-colors"
                    title="Edit inquiry"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              {inq.type && (
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/40 mb-2">
                  Subject: {inq.type}
                </p>
              )}
              {(inq.phone || inq.check_in) && (
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {inq.phone && (
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] bg-black/5 px-3 py-1.5 rounded-full">
                      <Phone size={11} /> {inq.phone}
                    </span>
                  )}
                  {inq.check_in && inq.check_out && (
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] bg-black text-white px-3 py-1.5 rounded-full">
                      <CalendarDays size={11} /> {inq.check_in} → {inq.check_out}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm text-black/70 leading-relaxed whitespace-pre-line">{inq.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">Edit Inquiry</h2>
              <button onClick={() => setEditing(null)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Name" value={fName} onChange={setFName} />
              <Field label="Email" value={fEmail} onChange={setFEmail} />
              <Field label="Phone" value={fPhone} onChange={setFPhone} />
              <Field label="Subject" value={fType} onChange={setFType} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Status</label>
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                >
                  {(STATUS_OPTIONS.includes(fStatus) ? STATUS_OPTIONS : [fStatus, ...STATUS_OPTIONS]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property / Villa</label>
                <select
                  value={fPropertyId}
                  onChange={(e) => setFPropertyId(e.target.value)}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                >
                  <option value="">— none —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <DatePicker
                label="Check-in"
                value={fCheckIn}
                onChange={(d) => { setFCheckIn(d); if (fCheckOut && fCheckOut <= d) setFCheckOut(null); }}
              />
              <DatePicker
                label="Check-out"
                value={fCheckOut}
                onChange={setFCheckOut}
                minDate={fCheckIn ? new Date(fCheckIn.getFullYear(), fCheckIn.getMonth(), fCheckIn.getDate() + 1) : null}
              />
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Message</label>
                <textarea
                  value={fMessage}
                  onChange={(e) => setFMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-y"
                />
              </div>
              {fStatus === "booked" && (
                <p className="md:col-span-2 text-[10px] font-bold uppercase tracking-[2px] text-green-700 bg-green-50 rounded-lg px-4 py-3">
                  Booked — these dates will be blocked on the website calendar for the selected property.
                </p>
              )}
              {formError && (
                <p className="md:col-span-2 text-red-500 text-xs font-bold uppercase tracking-widest">{formError}</p>
              )}
            </div>
            <div className="flex justify-between gap-3 px-8 py-6 border-t border-black/10">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
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
