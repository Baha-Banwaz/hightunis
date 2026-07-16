"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import DatePicker from "@/app/components/DatePicker";

interface Booking {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  source: string;
  inquiry_id: string | null;
  note: string | null;
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

export default function AdminCalendar() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formStart, setFormStart] = useState<Date | null>(null);
  const [formEnd, setFormEnd] = useState<Date | null>(null);
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState("");

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = toISODate(new Date());

  const bookingsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return bookings.filter((b) => {
      const start = parseISODate(b.start_date);
      const end = parseISODate(b.end_date);
      return date >= start && date < end;
    });
  };

  const openForm = () => {
    setFormPropertyId(properties[0]?.id ?? "");
    setFormStart(null);
    setFormEnd(null);
    setFormNote("");
    setFormError("");
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!formPropertyId || !formStart || !formEnd) {
      setFormError("Pick a property and both dates");
      return;
    }
    if (formEnd <= formStart) {
      setFormError("End date must be after the start date");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: formPropertyId,
        start_date: toISODate(formStart),
        end_date: toISODate(formEnd),
        source: "manual",
        note: formNote.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      setFormError(err?.error ?? "Could not save the block");
    }
  };

  const handleDelete = async (b: Booking) => {
    const label = `${propertyName[b.property_id] ?? "property"} ${b.start_date} → ${b.end_date}`;
    if (!confirm(`Remove this booking block?\n${label}`)) return;
    await fetch(`/api/admin/bookings?id=${b.id}`, { method: "DELETE" });
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Calendar</h1>
          <p className="text-sm text-black/40 font-semibold mt-1">
            Bookings and blocked dates across all properties
          </p>
        </div>
        <button
          onClick={openForm}
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

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-10 h-10 flex items-center justify-center border border-black/20 rounded-lg hover:bg-black hover:text-white transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-[2px]">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-10 h-10 flex items-center justify-center border border-black/20 rounded-lg hover:bg-black hover:text-white transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : (
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
              const isToday = dayISO === today;
              const dayBookings = bookingsForDay(day);
              return (
                <div key={day} className="min-h-[110px] border-b border-r border-black/5 p-2 flex flex-col gap-1">
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
                      onClick={() => handleDelete(b)}
                      title={`${propertyName[b.property_id] ?? "Property"}${b.note ? ` — ${b.note}` : ""} (${b.start_date} → ${b.end_date}). Click to remove.`}
                      className={`group flex items-center justify-between gap-1 text-left text-[9px] font-bold uppercase tracking-[1px] px-2 py-1 rounded truncate ${
                        b.source === "inquiry"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-black text-white hover:bg-black/80"
                      }`}
                    >
                      <span className="truncate">
                        {propertyName[b.property_id] ?? "Property"}
                        {b.note ? ` — ${b.note}` : ""}
                      </span>
                      <Trash2 size={9} className="shrink-0 opacity-0 group-hover:opacity-70" />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-black inline-block" /> Manual block</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Booked inquiry</span>
        <span>Click an entry to remove it</span>
      </div>

      {/* Block dates modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/10">
              <h2 className="text-xl font-black uppercase tracking-tighter">Block Dates</h2>
              <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property</label>
                <select
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <DatePicker label="First blocked night" value={formStart} onChange={(d) => { setFormStart(d); if (formEnd && formEnd <= d) setFormEnd(null); }} />
              <DatePicker
                label="Free again from"
                value={formEnd}
                onChange={setFormEnd}
                minDate={formStart ? new Date(formStart.getFullYear(), formStart.getMonth(), formStart.getDate() + 1) : null}
              />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Note (optional)</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. maintenance, walk-in guest"
                  className="w-full border border-black/20 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                />
              </div>
              {formError && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{formError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-black/10">
              <button onClick={() => setShowForm(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors rounded-lg disabled:opacity-40"
              >
                {saving ? "Saving..." : "Block Dates"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
