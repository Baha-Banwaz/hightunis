"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, User, Mail, Phone } from "lucide-react";
import DatePicker from "@/app/components/DatePicker";
import { StatusChip, allowedStatusOptions } from "../../components/StatusChip";
import { addDaysISO, colourForProperty, layoutWeek, weekStartsForMonth } from "@/lib/calendar-layout";
import { centsToInput, formatMoney, inputToCents, SUPPORTED_CURRENCIES } from "@/lib/money";

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

/** The inquiry behind a booking, for the status control. */
interface LinkedInquiry {
  id: string;
  name: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  amount_cents?: number | null;
  currency?: string | null;
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
  // Keyed by inquiry id. Only bookings created from an inquiry have one.
  const [inquiries, setInquiries] = useState<Record<string, LinkedInquiry>>({});
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [fAmount, setFAmount] = useState("");
  const [fCurrency, setFCurrency] = useState("EUR");
  const [priceBusy, setPriceBusy] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
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

  // Colour is assigned from this order, so a villa keeps its colour.
  const propertyOrder = useMemo(() => properties.map((p) => p.id), [properties]);

  const propertyName = useMemo(() => {
    const map: Record<string, string> = {};
    properties.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [properties]);

  /**
   * Status changes go through the same PUT as the inquiries list, so the
   * transition table, the clash guard and the audit log all still apply.
   * Cancelling deletes the block under the cursor, hence the refetch.
   */
  const changeStatus = async (inquiryId: string, status: string) => {
    setStatusBusy(inquiryId);
    setFormError("");

    const res = await fetch(`/api/admin/inquiries?id=${inquiryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);

    const body = await res?.json().catch(() => null);
    if (!res?.ok) {
      setFormError(body?.error ?? "Could not change the status.");
    } else if (Array.isArray(body?.warnings) && body.warnings.length > 0) {
      setFormError(body.warnings.join(" "));
    }

    setStatusBusy(null);
    // The block may have just been released, so close the modal and reload.
    setModalOpen(false);
    await fetchAll();
  };

  /**
   * The value belongs to the inquiry, not to this booking row - sync deletes
   * and recreates booking rows on every inquiry edit, so an amount stored
   * there would not survive.
   */
  const savePrice = async (inquiryId: string) => {
    const cents = inputToCents(fAmount);
    if (cents === "invalid") {
      setFormError("Booking value must be a positive number, for example 1700 or 1700.50");
      return;
    }

    setPriceBusy(true);
    setFormError("");
    setPriceSaved(false);

    const res = await fetch(`/api/admin/inquiries?id=${inquiryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_cents: cents, currency: fCurrency }),
    }).catch(() => null);

    const body = await res?.json().catch(() => null);
    setPriceBusy(false);

    if (!res?.ok) {
      setFormError(body?.error ?? "Could not save the value.");
      return;
    }
    setPriceSaved(true);
    setInquiries((prev) =>
      prev[inquiryId]
        ? { ...prev, [inquiryId]: { ...prev[inquiryId], amount_cents: cents, currency: fCurrency } }
        : prev
    );
  };

  const fetchAll = async () => {
    try {
      const [bookingsRes, propsRes, inqRes] = await Promise.all([
        fetch("/api/admin/bookings?orderColumn=start_date&ascending=true"),
        fetch("/api/admin/properties?orderColumn=order&ascending=true"),
        fetch("/api/admin/inquiries"),
      ]);
      if (inqRes.ok) {
        const list: LinkedInquiry[] = await inqRes.json();
        setInquiries(Object.fromEntries(list.map((i) => [i.id, i])));
      }
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
  const todayISO = toISODate(new Date());

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
    const linked = b.inquiry_id ? inquiries[b.inquiry_id] : undefined;
    setFAmount(centsToInput(linked?.amount_cents));
    setFCurrency(linked?.currency || "EUR");
    setPriceSaved(false);
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
          className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors"
        >
          <Plus size={16} /> Block Dates
        </button>
      </div>

      {migrationMissing && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 mb-8 text-sm font-semibold">
          The bookings table doesn&apos;t exist yet. Run <code className="font-mono">supabase-migration-bookings.sql</code> in
          the Supabase SQL Editor, then reload this page.
        </div>
      )}

      {/* Toolbar: month nav + filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-10 h-10 flex items-center justify-center border border-black/20 hover:bg-black hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className="h-10 px-4 text-xs font-bold uppercase tracking-[2px] border border-black/20 hover:bg-black hover:text-white transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-10 h-10 flex items-center justify-center border border-black/20 hover:bg-black hover:text-white transition-colors"
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
          className="text-xs font-bold uppercase tracking-[2px] border border-black/20 px-4 py-3 bg-white outline-none cursor-pointer"
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
          <div className="bg-white border border-black/20 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-black/20">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-3 py-3 text-[10px] font-bold uppercase tracking-[2px] text-black/40 text-center">
                  {d}
                </div>
              ))}
            </div>
            {weekStartsForMonth(year, month).map((weekStart) => {
              const { segments, lanes } = layoutWeek(visibleBookings, weekStart);
              // Enough room for the date plus every stacked bar in this week.
              const minHeight = 34 + Math.max(1, lanes) * 24 + 8;

              return (
                <div key={weekStart} className="relative border-b border-black/20 last:border-b-0">
                  {/* Day cells: the grid people read dates from. */}
                  <div className="grid grid-cols-7" style={{ minHeight }}>
                    {Array.from({ length: 7 }, (_, i) => {
                      const dayISO = addDaysISO(weekStart, i);
                      const inMonth = Number(dayISO.slice(5, 7)) === month + 1;
                      const isToday = dayISO === todayISO;
                      return (
                        <div
                          key={dayISO}
                          className={`border-r border-black/10 last:border-r-0 p-2 ${
                            !inMonth ? "bg-black/[0.02]" : isToday ? "bg-black/[0.04]" : ""
                          }`}
                        >
                          <span
                            className={`text-xs font-black px-1.5 py-0.5 inline-block ${
                              isToday ? "bg-black text-white" : inMonth ? "text-black/50" : "text-black/20"
                            }`}
                          >
                            {Number(dayISO.slice(8, 10))}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bars, spanning the nights they actually occupy. */}
                  <div
                    className="absolute left-0 right-0 grid grid-cols-7 gap-y-1 px-px pointer-events-none"
                    style={{ top: 34 }}
                  >
                    {segments.map((seg) => {
                      const c = colourForProperty(seg.item.property_id, propertyOrder);
                      const manual = seg.item.source !== "inquiry";
                      const label = `${propertyName[seg.item.property_id] ?? "Property"}${
                        guestLabel(seg.item) ? ` ${guestLabel(seg.item)}` : ""
                      }`;
                      return (
                        <button
                          key={`${seg.item.id}-${weekStart}`}
                          onClick={() => openEdit(seg.item)}
                          title={`${label} · ${seg.item.start_date} to ${seg.item.end_date} · ${nightsBetween(
                            seg.item.start_date,
                            seg.item.end_date
                          )} nights${manual ? " · manual block" : ""}. Click to edit.`}
                          style={{
                            gridColumn: `${seg.startCol} / span ${seg.span}`,
                            gridRow: seg.lane + 1,
                            backgroundColor: manual ? "transparent" : c.bg,
                            color: manual ? "#000000" : c.fg,
                            boxShadow: manual ? `inset 0 0 0 2px ${c.bg}` : undefined,
                          }}
                          className="pointer-events-auto text-left text-[9px] font-bold uppercase tracking-[1px] px-2 py-1 truncate hover:opacity-80 transition-opacity"
                        >
                          {seg.continuesBefore ? "< " : ""}
                          {label}
                          {seg.continuesAfter ? " >" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[2px] text-black/50">
            {properties
              .filter((p) => visibleBookings.some((b) => b.property_id === p.id))
              .map((p) => (
                <span key={p.id} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 inline-block"
                    style={{ backgroundColor: colourForProperty(p.id, propertyOrder).bg }}
                  />
                  {p.name}
                </span>
              ))}
            <span className="flex items-center gap-2 text-black/40">
              <span className="w-3 h-3 inline-block" style={{ boxShadow: "inset 0 0 0 2px #767676" }} />
              Outlined = manual block
            </span>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Upcoming</h3>
              <div className="bg-white border border-black/20 divide-y divide-black/5">
                {upcoming.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => openEdit(b)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-left hover:bg-black/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-2.5 h-2.5 ${b.source === "inquiry" ? "bg-accent" : "bg-black"}`} />
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
          <div className="bg-white w-full max-w-lg mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/20">
              <h2 className="text-xl font-black uppercase tracking-tighter">
                {editing ? "Edit Booking" : "Block Dates"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-black/40 hover:text-black"><X size={20} /></button>
            </div>
            <div className="px-8 py-6 flex flex-col gap-6">
              {editing?.source === "inquiry" && editing.inquiry_id && inquiries[editing.inquiry_id] && (
                <div className="border-2 border-black p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[3px] text-black/50">
                      Inquiry status
                    </span>
                    <StatusChip status={inquiries[editing.inquiry_id].status} />
                  </div>
                  <select
                    value={inquiries[editing.inquiry_id].status}
                    disabled={statusBusy === editing.inquiry_id}
                    onChange={(e) => changeStatus(editing.inquiry_id!, e.target.value)}
                    className="w-full border-2 border-black/20 px-4 py-3 text-sm font-semibold bg-white outline-none focus:border-black disabled:opacity-40"
                  >
                    {allowedStatusOptions(inquiries[editing.inquiry_id].status).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <div className="border-t border-black/20 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">
                      Booking value
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={fCurrency}
                        onChange={(e) => { setFCurrency(e.target.value); setPriceSaved(false); }}
                        className="border-2 border-black/20 px-3 py-2 text-sm font-semibold bg-white outline-none focus:border-black"
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fAmount}
                        onChange={(e) => { setFAmount(e.target.value); setPriceSaved(false); setFormError(""); }}
                        placeholder="1700"
                        className="flex-1 border-2 border-black/20 px-4 py-2 text-sm font-semibold outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        disabled={priceBusy}
                        onClick={() => savePrice(editing.inquiry_id!)}
                        className="px-5 py-2 text-[10px] font-bold uppercase tracking-[2px] bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-40"
                      >
                        {priceBusy ? "Saving" : priceSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/40 mt-2">
                      {inquiries[editing.inquiry_id].amount_cents != null
                        ? `Currently ${formatMoney(
                            inquiries[editing.inquiry_id].amount_cents as number,
                            inquiries[editing.inquiry_id].currency || "EUR"
                          )}`
                        : "Not priced yet, so excluded from revenue"}
                    </p>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/40 leading-[1.6]">
                    Cancelling releases these dates and removes this block. Editing the
                    inquiry itself overwrites the dates shown below.
                  </p>
                </div>
              )}
              {editing?.source === "inquiry" && (!editing.inquiry_id || !inquiries[editing.inquiry_id]) && (
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/60 px-4 py-3 border border-black/20">
                  Created from an inquiry that no longer exists. Editing here changes the dates only.
                </p>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property</label>
                <select
                  value={fPropertyId}
                  onChange={(e) => setFPropertyId(e.target.value)}
                  className="w-full border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
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
            <div className="flex justify-between gap-3 px-8 py-6 border-t border-black/20">
              {editing ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Remove
                </button>
              ) : <span />}
              <div className="flex gap-3">
                <button onClick={() => setModalOpen(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors disabled:opacity-40"
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
      <div className="flex items-center gap-3 border border-black/20 px-4 py-3 focus-within:border-black transition-colors">
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
