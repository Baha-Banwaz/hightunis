"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, User, Mail, Phone } from "lucide-react";
import DatePicker from "@/app/components/DatePicker";

interface Booking {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  source: string;
  inquiry_id: string | null;
  note: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
}

interface PropertyOption {
  id: string;
  name: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function nightsBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86400000);
}

export default function AdminCalendar() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [filterPropertyId, setFilterPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrationMissing, setMigrationMissing] = useState(false);

  // Modal state: null = closed; editing = existing booking or null for new
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fPropertyId, setFPropertyId] = useState("");
  const [fStart, setFStart] = useState<Date | null>(null);
  const [fEnd, setFEnd] = useState<Date | null>(null);
  const [fGuestName, setFGuestName] = useState("");
  const [fGuestEmail, setFGuestEmail] = useState("");
  const [fGuestPhone, setFGuestPhone] = useState("");
  const [fNote, setFNote] = useState("");

  const propertyName = useMemo(() => {
    const map: Record<string, string> = {};
    properties.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [properties]);

  const fetchAll = async () => {
    try {
      const [bookingsRes, propsRes] = await Promise.all([
        fetch("/api/admin/bookings?orderColumn=start_date&ascending=true"),
        fetch("/api/admin/properties?orderColumn=order&ascending=true"),
      ]);
      if (bookingsRes.status === 401 || propsRes.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      }
      if (bookingsRes.ok) {
        setBookings(await bookingsRes.json());
        setMigrationMissing(false);
      } else {
        const err = await bookingsRes.json().catch(() => ({}));
        if (/property_bookings|schema cache|does not exist/i.test(err?.error ?? "")) {
          setMigrationMissing(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const visibleBookings = filterPropertyId
    ? bookings.filter((b) => b.property_id === filterPropertyId)
    : bookings;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayISO = toISODate(new Date());

  const bookingsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return visibleBookings.filter((b) => {
      const start = parseISODate(b.start_date);
      const end = parseISODate(b.end_date);
      return date >= start && date < end;
    });
  };

  const upcoming = useMemo(
    () =>
      [...visibleBookings]
        .filter((b) => b.end_date >= todayISO)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 8),
    [visibleBookings, todayISO]
  );

  const guestLabel = (b: Booking) => b.guest_name || b.note || "";

  const openCreate = () => {
    setEditing(null);
    setFPropertyId(filterPropertyId || properties[0]?.id || "");
    setFStart(null);
    setFEnd(null);
    setFGuestName("");
    setFGuestEmail("");
    setFGuestPhone("");
    setFNote("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (b: Booking) => {
    setEditing(b);
    setFPropertyId(b.property_id);
    setFStart(parseISODate(b.start_date));
    setFEnd(parseISODate(b.end_date));
    setFGuestName(b.guest_name ?? "");
    setFGuestEmail(b.guest_email ?? "");
    setFGuestPhone(b.guest_phone ?? "");
    setFNote(b.note ?? "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!fPropertyId || !fStart || !fEnd) {
      setFormError("Pick a property and both dates");
      return;
    }
    if (fEnd <= fStart) {
      setFormError("End date must be after the start date");
      return;
    }
    const startISO = toISODate(fStart);
    const endISO = toISODate(fEnd);
    const clash = bookings.find(
      (b) =>
        b.property_id === fPropertyId &&
        b.id !== editing?.id &&
        startISO < b.end_date &&
        endISO > b.start_date
    );
    if (clash) {
      setFormError(
        `Overlaps an existing booking (${clash.start_date} → ${clash.end_date}${guestLabel(clash) ? `, ${guestLabel(clash)}` : ""})`
      );
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      property_id: fPropertyId,
      start_date: startISO,
      end_date: endISO,
      note: fNote.trim() || null,
      guest_name: fGuestName.trim() || null,
      guest_email: fGuestEmail.trim() || null,
      guest_phone: fGuestPhone.trim() || null,
    };
    if (!editing) payload.source = "manual";

    const url = editing ? `/api/admin/bookings?id=${editing.id}` : "/api/admin/bookings";
    const method = editing ? "PUT" : "POST";

    let res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (/guest_|column/i.test(err?.error ?? "")) {
        // guest columns not migrated yet — save without them
        const { guest_name, guest_email, guest_phone, ...legacy } = payload;
        void guest_name; void guest_email; void guest_phone;
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(legacy),
        });
      }
    }
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      setFormError(err?.error ?? "Could not save");
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm(`Remove this booking?\n${propertyName[editing.property_id] ?? "Property"} ${editing.start_date} → ${editing.end_date}`)) return;
    await fetch(`/api/admin/bookings?id=${editing.id}`, { method: "DELETE" });
    setModalOpen(false);
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Calendar</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">
            Bookings and blocked dates — click any entry to edit it
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg"
        >
          <Plus size={16} /> Block Dates
        </button>
      </div>

      {migrationMissing && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-8 text-sm font-semibold">
          The bookings table doesn&apos;t exist yet. Run <code className="font-mono">supabase-migration-bookings.sql</code> in
          the Supabase SQL Editor, then reload this page.
        </div>
      )}

      {/* Toolbar: month nav + filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-10 h-10 flex items-center justify-center border border-black/20 rounded-lg hover:bg-black hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className="h-10 px-4 text-xs font-bold uppercase tracking-[2px] border border-black/20 rounded-lg hover:bg-black hover:text-white transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-10 h-10 flex items-center justify-center border border-black/20 rounded-lg hover:bg-black hover:text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <h2 className="text-xl font-black uppercase tracking-[2px] ml-4">
            {MONTHS[month]} {year}
          </h2>
        </div>
        <select
          value={filterPropertyId}
          onChange={(e) => setFilterPropertyId(e.target.value)}
          className="text-xs font-bold uppercase tracking-[2px] border border-black/20 rounded-lg px-4 py-3 bg-white outline-none cursor-pointer"
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-black/10">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-3 py-3 text-[10px] font-bold uppercase tracking-[2px] text-black/40 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[110px] border-b border-r border-black/5 bg-black/[0.015]" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayISO = toISODate(new Date(year, month, day));
                const isToday = dayISO === todayISO;
                const dayBookings = bookingsForDay(day);
                return (
                  <div key={day} className={`min-h-[110px] border-b border-r border-black/5 p-2 flex flex-col gap-1 ${isToday ? "bg-black/[0.03]" : ""}`}>
                    <span
                      className={`text-xs font-black self-start px-1.5 py-0.5 rounded ${
                        isToday ? "bg-black text-white" : "text-black/50"
                      }`}
                    >
                      {day}
                    </span>
                    {dayBookings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => openEdit(b)}
                        title={`${propertyName[b.property_id] ?? "Property"}${guestLabel(b) ? ` — ${guestLabel(b)}` : ""} (${b.start_date} → ${b.end_date}). Click to edit.`}
                        className={`text-left text-[9px] font-bold uppercase tracking-[1px] px-2 py-1 rounded truncate transition-colors ${
                          b.source === "inquiry"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-black text-white hover:bg-black/70"
                        }`}
                      >
                        {b.start_date === dayISO ? "◂ " : ""}
                        {propertyName[b.property_id] ?? "Property"}
                        {guestLabel(b) ? ` — ${guestLabel(b)}` : ""}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-black inline-block" /> Manual block</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Booked inquiry</span>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Upcoming</h3>
              <div className="bg-white rounded-xl border border-black/10 divide-y divide-black/5">
                {upcoming.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => openEdit(b)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-left hover:bg-black/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-2.5 h-2.5 rounded-full ${b.source === "inquiry" ? "bg-green-400" : "bg-black"}`} />
                      <span className="text-sm font-black uppercase tracking-tight">{propertyName[b.property_id] ?? "Property"}</span>
                      {guestLabel(b) && <span className="text-sm font-semibold text-black/50">{guestLabel(b)}</span>}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[2px] text-black/50">
                      {b.start_date} → {b.end_date} · {nightsBetween(b.start_date, b.end_date)} night{nightsBetween(b.start_date, b.end_date) === 1 ? "" : "s"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">
                {editing ? "Edit Booking" : "Block Dates"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-6">
              {editing?.source === "inquiry" && (
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-green-700 bg-green-50 rounded-lg px-4 py-3">
                  Created from an inquiry — if you edit that inquiry later, it overwrites these dates.
                </p>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property</label>
                <select
                  value={fPropertyId}
                  onChange={(e) => setFPropertyId(e.target.value)}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DatePicker label="First blocked night" value={fStart} onChange={(d) => { setFStart(d); if (fEnd && fEnd <= d) setFEnd(null); }} />
                <DatePicker
                  label="Free again from"
                  value={fEnd}
                  onChange={setFEnd}
                  minDate={fStart ? new Date(fStart.getFullYear(), fStart.getMonth(), fStart.getDate() + 1) : null}
                />
              </div>
              {fStart && fEnd && (
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/40 -mt-2">
                  {nightsBetween(toISODate(fStart), toISODate(fEnd))} night{nightsBetween(toISODate(fStart), toISODate(fEnd)) === 1 ? "" : "s"} blocked
                </p>
              )}
              <div className="grid grid-cols-1 gap-4">
                <IconField icon={<User size={14} />} label="Guest name (optional)" value={fGuestName} onChange={setFGuestName} placeholder="Who is staying?" />
                <IconField icon={<Mail size={14} />} label="Guest email (optional)" value={fGuestEmail} onChange={setFGuestEmail} placeholder="guest@email.com" />
                <IconField icon={<Phone size={14} />} label="Guest phone (optional)" value={fGuestPhone} onChange={setFGuestPhone} placeholder="+216 ..." />
                <IconField icon={null} label="Note (optional)" value={fNote} onChange={setFNote} placeholder="e.g. maintenance, walk-in guest" />
              </div>
              {formError && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{formError}</p>
              )}
            </div>
            <div className="flex justify-between gap-3 px-8 py-6 border-t border-black/10">
              {editing ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} /> Remove
                </button>
              ) : <span />}
              <div className="flex gap-3">
                <button onClick={() => setModalOpen(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg disabled:opacity-40"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Block Dates"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconField({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">{label}</label>
      <div className="flex items-center gap-3 border border-black/20 rounded-lg px-4 py-3 focus-within:border-black transition-colors">
        {icon && <span className="text-black/30">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm font-semibold outline-none placeholder:text-black/25"
        />
      </div>
    </div>
  );
}
