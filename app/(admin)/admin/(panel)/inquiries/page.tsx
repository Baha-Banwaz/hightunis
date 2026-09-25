"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusChip, MetaChip, allowedStatusOptions } from "../../components/StatusChip";
import { isMissingAmount, isOverdue } from "@/lib/inquiry-status";
import { centsToInput, formatMoney, inputToCents, SUPPORTED_CURRENCIES } from "@/lib/money";
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
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
  created_at: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

// Status colours and the legal option list live in StatusChip, shared with
// the calendar so the two views cannot disagree.

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const STATUS_FILTERS = ["new", "contacted", "booked", "cancelled", "finished"] as const;

function InquiriesView() {
  const router = useRouter();
  const params = useSearchParams();

  // Filter state lives in the URL, so it survives a refresh, works with
  // back/forward, and a filtered view can be shared as a link.
  const fStatusFilter = params.get("status") ?? "";
  const fPropertyFilter = params.get("propertyId") ?? "";
  const fFrom = params.get("from") ?? "";
  const fTo = params.get("to") ?? "";
  const fDateField = params.get("dateField") === "stay" ? "stay" : "created";
  const hasFilters = Boolean(fStatusFilter || fPropertyFilter || fFrom || fTo);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.toString() ? `?${next}` : "?", { scroll: false });
  };

  const [items, setItems] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  // Surfaces failures from the inline status dropdown, which has no modal.
  const [listError, setListError] = useState("");
  // Warnings come back on a 200 - the save worked, but something needs
  // attention. Kept apart from errors so the styling can differ.
  const [listWarnings, setListWarnings] = useState<string[]>([]);

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
  const [fAmount, setFAmount] = useState("");
  const [fCurrency, setFCurrency] = useState("EUR");

  const fetch_ = async () => {
    const qs = new URLSearchParams();
    if (fStatusFilter) qs.set("status", fStatusFilter);
    if (fPropertyFilter) qs.set("propertyId", fPropertyFilter);
    if (fFrom) qs.set("from", fFrom);
    if (fTo) qs.set("to", fTo);
    qs.set("dateField", fDateField);

    try {
      const [inqRes, propsRes] = await Promise.all([
        fetch(`/api/admin/inquiries?${qs}`),
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

  // Re-runs whenever a filter changes, because the server does the filtering.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch_(); }, [fStatusFilter, fPropertyFilter, fFrom, fTo, fDateField]);

  const propertyName = (id: string | null) =>
    properties.find((p) => p.id === id)?.name ?? null;

  const updateStatus = async (id: string, status: string) => {
    setListError("");
    setListWarnings([]);
    const res = await fetch(`/api/admin/inquiries?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);

    const body = await res?.json().catch(() => null);

    if (!res?.ok) {
      // The inquiry may well have saved and only the calendar sync failed;
      // the message from the API says which.
      setListError(body?.error ?? "Could not update this inquiry. Please try again.");
    }
    // A 409 can carry warnings too - show both rather than only the blocker.
    if (Array.isArray(body?.warnings) && body.warnings.length > 0) {
      setListWarnings(body.warnings);
    }

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
    setFAmount(centsToInput(inq.amount_cents));
    setFCurrency(inq.currency || "EUR");
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
    const amountCents = inputToCents(fAmount);
    if (amountCents === "invalid") {
      setFormError("Booking value must be a positive number, for example 1700 or 1700.50");
      return;
    }
    if (fStatus === "booked" && (!fPropertyId || !fCheckIn || !fCheckOut)) {
      setFormError("A booked inquiry needs a property, check-in and check-out, otherwise it cannot block the calendar");
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
        amount_cents: amountCents,
        currency: fCurrency,
      }),
    });
    setSaving(false);
    const body = await res.json().catch(() => null);

    if (Array.isArray(body?.warnings) && body.warnings.length > 0) {
      setListWarnings(body.warnings);
    }

    if (res.ok) {
      setEditing(null);
      fetch_();
    } else {
      setFormError(body?.error ?? "Could not save changes");
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
            {loading
              ? "Loading"
              : `${items.length} ${items.length === 1 ? "inquiry" : "inquiries"}${
                  hasFilters ? " matching these filters" : ""
                }`}
          </p>
        </div>
      </div>

      <div className="border-2 border-black bg-white p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Status</label>
          <select
            value={fStatusFilter}
            onChange={(e) => setFilter("status", e.target.value)}
            className="border-2 border-black/20 px-4 py-2 text-sm font-semibold bg-white outline-none focus:border-black"
          >
            <option value="">Any status</option>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[180px]">
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property</label>
          <select
            value={fPropertyFilter}
            onChange={(e) => setFilter("propertyId", e.target.value)}
            className="w-full border-2 border-black/20 px-4 py-2 text-sm font-semibold bg-white outline-none focus:border-black"
          >
            <option value="">Any property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Dates refer to</label>
          <select
            value={fDateField}
            onChange={(e) => setFilter("dateField", e.target.value === "stay" ? "stay" : "")}
            className="border-2 border-black/20 px-4 py-2 text-sm font-semibold bg-white outline-none focus:border-black"
          >
            <option value="created">When it arrived</option>
            <option value="stay">When the stay is</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">From</label>
          <input
            type="date"
            value={fFrom}
            onChange={(e) => setFilter("from", e.target.value)}
            className="border-2 border-black/20 px-4 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">To</label>
          <input
            type="date"
            value={fTo}
            onChange={(e) => setFilter("to", e.target.value)}
            className="border-2 border-black/20 px-4 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace("?", { scroll: false })}
            className="px-5 py-2 text-[10px] font-bold uppercase tracking-[2px] border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {listError && (
        <div className="mb-6 border-2 border-red-500 bg-red-50 p-4 flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[2px] text-red-600 leading-[1.6]">
            {listError}
          </p>
          <button
            type="button"
            onClick={() => setListError("")}
            className="text-[10px] font-bold uppercase tracking-[2px] text-red-600/60 hover:text-red-600 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {listWarnings.length > 0 && (
        <div className="mb-6 border-2 border-black border-l-8 border-l-accent bg-white p-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {listWarnings.map((w, i) => (
              <p key={i} className="text-xs font-bold uppercase tracking-[2px] text-black leading-[1.6]">
                {w}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setListWarnings([])}
            className="text-[10px] font-bold uppercase tracking-[2px] text-black/40 hover:text-black shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-black/20 p-16 text-center">
          <Inbox size={48} className="text-black/20 mx-auto mb-4" />
          <p className="text-sm text-black/40 font-bold uppercase tracking-widest">
            {hasFilters ? "No inquiries match these filters" : "No inquiries yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((inq) => (
            <div key={inq.id} className="bg-white border border-black/20 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black tracking-tighter uppercase">{inq.name}</h3>
                    <StatusChip status={inq.status} />
                    {propertyName(inq.property_id) && (
                      <MetaChip>{propertyName(inq.property_id)}</MetaChip>
                    )}
                    {/* Derived, not stored: correct even if the cron never runs. */}
                    {isOverdue(inq) && (
                      <MetaChip tone="warn" title="Checked out but still marked booked">
                        Overdue
                      </MetaChip>
                    )}
                    {isMissingAmount(inq) ? (
                      <MetaChip tone="warn" title="Confirmed with no amount - excluded from revenue">
                        No amount
                      </MetaChip>
                    ) : (
                      inq.amount_cents != null && (
                        <MetaChip>{formatMoney(inq.amount_cents, inq.currency || "EUR")}</MetaChip>
                      )
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
                    className="text-xs font-bold uppercase tracking-[2px] border border-black/20 px-3 py-2 bg-white outline-none cursor-pointer"
                  >
                    {allowedStatusOptions(inq.status).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => openEdit(inq)}
                    className="w-9 h-9 flex items-center justify-center border border-black/20 hover:border-black hover:bg-black hover:text-white text-black/60 transition-colors"
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
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] bg-black/5 px-3 py-1.5">
                      <Phone size={11} /> {inq.phone}
                    </span>
                  )}
                  {inq.check_in && inq.check_out && (
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] bg-black text-white px-3 py-1.5">
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
          <div className="bg-white w-full max-w-2xl mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/20">
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
                  className="w-full border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                >
                  {/* Legal targets come from the status the inquiry was
                      opened with, not from whatever is currently picked. */}
                  {allowedStatusOptions(editing?.status ?? null).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">
                  Booking value
                </label>
                <div className="flex gap-2">
                  <select
                    value={fCurrency}
                    onChange={(e) => setFCurrency(e.target.value)}
                    className="border border-black/20 px-3 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fAmount}
                    onChange={(e) => { setFAmount(e.target.value); setFormError(""); }}
                    placeholder="1700"
                    className="flex-1 border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/40 mt-2">
                  Leave empty if not priced yet. Excluded from revenue until set.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property / Villa</label>
                <select
                  value={fPropertyId}
                  onChange={(e) => setFPropertyId(e.target.value)}
                  className="w-full border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                >
                  <option value="">— none —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <DatePicker
                id="inquiry-check-in"
                label="Check-in"
                value={fCheckIn}
                onChange={(d) => { setFCheckIn(d); if (fCheckOut && fCheckOut <= d) setFCheckOut(null); }}
              />
              <DatePicker
                id="inquiry-check-out"
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
                  className="w-full border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-y"
                />
              </div>
              {fStatus === "booked" && (
                <p className="md:col-span-2 text-[10px] font-bold uppercase tracking-[2px] text-black/60 bg-white px-4 py-3">
                  Booked — these dates will be blocked on the website calendar for the selected property.
                </p>
              )}
              {formError && (
                <p className="md:col-span-2 text-red-500 text-xs font-bold uppercase tracking-widest">{formError}</p>
              )}
            </div>
            <div className="flex justify-between gap-3 px-8 py-6 border-t border-black/20">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="px-6 py-3 text-xs font-bold uppercase tracking-[2px] text-black/40 hover:text-black transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[2px] hover:bg-black/80 transition-colors disabled:opacity-40"
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
        className="w-full border-2 border-black/20 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
      />
    </div>
  );
}

export default function AdminInquiries() {
  return (
    <Suspense
      fallback={
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">
          Loading...
        </div>
      }
    >
      <InquiriesView />
    </Suspense>
  );
}
