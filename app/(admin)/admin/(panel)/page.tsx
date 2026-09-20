"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Briefcase, Inbox, Users, FileText, MessageSquareQuote } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { DashboardMetrics, MoneyTotal } from "@/lib/dashboard-metrics";

interface PropertyOption { id: string; name: string }

type ByProperty = DashboardMetrics["byProperty"][number] & { name: string };
type Payload = {
  period: { from: string; to: string };
  today: string;
  properties: PropertyOption[];
  metrics: Omit<DashboardMetrics, "byProperty"> & { byProperty: ByProperty[] };
};

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

const pct = (n: number | null) => (n === null ? null : `${Math.round(n * 100)}%`);

/**
 * One money figure. Renders an empty state rather than a zero when nothing
 * qualified, and says how many of the rows it counted were unpriced, so the
 * number is never mistaken for the whole picture.
 */
function MoneyCard({
  label,
  basis,
  totals,
  rows,
  missingAmount,
  accent = false,
}: {
  label: string;
  basis: string;
  totals: MoneyTotal[];
  rows: number;
  missingAmount: number;
  accent?: boolean;
}) {
  return (
    <div className={`border-2 border-black bg-white p-6 ${accent ? "border-l-8 border-l-accent" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/50">{label}</p>
      <p className="text-[9px] font-bold uppercase tracking-[2px] text-black/30 mt-1">{basis}</p>

      {rows === 0 ? (
        <p className="mt-6 text-sm font-bold uppercase tracking-[2px] text-black/30">
          No bookings in this period
        </p>
      ) : totals.length === 0 ? (
        <>
          <p className="mt-6 text-sm font-bold uppercase tracking-[2px] text-black/30">
            No amounts recorded
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
            {rows} booking{rows === 1 ? "" : "s"} counted, none priced
          </p>
        </>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-1">
            {totals.map((t) => (
              <p key={t.currency} className="text-4xl font-black tracking-tighter">
                {formatMoney(t.cents, t.currency)}
              </p>
            ))}
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
            {rows} booking{rows === 1 ? "" : "s"}
            {missingAmount > 0 && `, ${missingAmount} unpriced and excluded`}
          </p>
        </>
      )}
    </div>
  );
}

function CountCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | null;
  sub?: string;
}) {
  return (
    <div className="border border-black/20 bg-white p-6">
      <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/50">{label}</p>
      {value === null ? (
        <p className="mt-4 text-sm font-bold uppercase tracking-[2px] text-black/30">Not enough data</p>
      ) : (
        <p className="mt-3 text-3xl font-black tracking-tighter">{value}</p>
      )}
      {sub && <p className="mt-2 text-[10px] font-bold uppercase tracking-[2px] text-black/40">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [range, setRange] = useState(defaultRange);
  const [propertyId, setPropertyId] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [contentStats, setContentStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The fetch lives inside the effect and updates state from an async
  // callback, not synchronously in the effect body. The cancelled flag stops
  // a slow response from overwriting a newer one when the filters change.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError("");
      const qs = new URLSearchParams({ from: range.from, to: range.to });
      if (propertyId) qs.set("propertyId", propertyId);

      try {
        const [dash, stats] = await Promise.all([
          fetch(`/api/admin/dashboard?${qs}`),
          fetch("/api/admin/stats"),
        ]);

        if (dash.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (cancelled) return;

        if (dash.ok) {
          setData(await dash.json());
        } else {
          const body = await dash.json().catch(() => null);
          setError(body?.error ?? "Could not load the dashboard");
        }
        if (stats.ok && !cancelled) setContentStats(await stats.json());
      } catch {
        if (!cancelled) setError("Could not reach the server. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, propertyId]);

  const m = data?.metrics;

  const contentCards = [
    { label: "Properties", value: contentStats?.properties, icon: Building2, href: "/admin/properties" },
    { label: "Services", value: contentStats?.services, icon: Briefcase, href: "/admin/services" },
    { label: "Blog Posts", value: contentStats?.blog, icon: FileText, href: "/admin/blog" },
    { label: "Team", value: contentStats?.team, icon: Users, href: "/admin/team" },
    { label: "Testimonials", value: contentStats?.testimonials, icon: MessageSquareQuote, href: "/admin/testimonials" },
    { label: "Inquiries", value: contentStats?.inquiries, icon: Inbox, href: "/admin/inquiries" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Dashboard</h1>
        <p className="text-sm text-black/40 font-semibold mt-2">
          Every figure below is filtered by this range and property.
        </p>
      </div>

      {/* Filters */}
      <div className="border-2 border-black bg-white p-5 mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">From</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="border border-black/20 px-4 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">To</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="border border-black/20 px-4 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2 block">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full border border-black/20 px-4 py-2 text-sm font-semibold bg-white outline-none focus:border-black"
          >
            <option value="">All properties</option>
            {(data?.properties ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-8 border-2 border-red-500 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[2px] text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-sm font-bold uppercase tracking-widest text-black/30 animate-pulse">Loading...</div>
      ) : m ? (
        <>
          {/* Money. Four figures, never merged. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <MoneyCard
              label="Booked revenue"
              basis="Confirmed in period, by confirmation date. Includes cancellations."
              accent
              totals={m.bookedRevenue.totals}
              rows={m.bookedRevenue.rows}
              missingAmount={m.bookedRevenue.missingAmount}
            />
            <MoneyCard
              label="Net bookings"
              basis="Booked revenue minus this cohort's cancellations."
              totals={m.netBookings.totals}
              rows={m.netBookings.rows}
              missingAmount={m.netBookings.missingAmount}
            />
            <MoneyCard
              label="Realised revenue"
              basis="Stays completed in period, by check-out date."
              totals={m.realisedRevenue.totals}
              rows={m.realisedRevenue.rows}
              missingAmount={m.realisedRevenue.missingAmount}
            />
            <MoneyCard
              label="Pipeline"
              basis="Confirmed, not yet stayed, by check-in date."
              totals={m.pipeline.totals}
              rows={m.pipeline.rows}
              missingAmount={m.pipeline.missingAmount}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
            <MoneyCard
              label="Cancelled"
              basis="Confirmed in period, since cancelled."
              totals={m.cancellations.totals}
              rows={m.cancellations.rows}
              missingAmount={m.cancellations.missingAmount}
            />
            <CountCard
              label="Cancellation rate"
              value={pct(m.cancellations.rateOfConfirmed)}
              sub="Of bookings confirmed in this period"
            />
            <CountCard
              label="New inquiries"
              value={String(m.newInquiries)}
              sub="Received in this period"
            />
            <CountCard
              label="Conversion"
              value={pct(m.conversion.rate)}
              sub={`${m.conversion.confirmed} of ${m.conversion.created} inquiries confirmed`}
            />
          </div>

          {/* Volume. Works with no amounts recorded at all. */}
          <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-4">
            Occupancy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <CountCard
              label="Nights booked"
              value={m.stays.count === 0 ? null : String(m.stays.totalNights)}
              sub={`Across ${m.stays.count} stay${m.stays.count === 1 ? "" : "s"} starting in this period`}
            />
            <CountCard
              label="Average stay"
              value={m.stays.averageNights === null ? null : `${m.stays.averageNights.toFixed(1)} nights`}
              sub="Mean length of those stays"
            />
            <CountCard
              label="Lead time"
              value={m.leadTimeDays.averageDays === null ? null : `${m.leadTimeDays.averageDays.toFixed(0)} days`}
              sub="Enquiry to check-in, on average"
            />
          </div>

          <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-4">
            By property
          </h2>
          {m.byProperty.length === 0 ? (
            <div className="border border-black/20 bg-white p-10 text-center mb-10">
              <p className="text-sm font-bold uppercase tracking-[2px] text-black/30">
                No stays starting in this period
              </p>
            </div>
          ) : (
            <div className="border border-black/20 bg-white mb-10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/10">
                    {["Property", "Bookings", "Nights", "Value"].map((h) => (
                      <th key={h} className="px-6 py-3 text-[10px] font-bold uppercase tracking-[2px] text-black/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m.byProperty.map((p) => (
                    <tr key={p.propertyId} className="border-b border-black/5 last:border-0">
                      <td className="px-6 py-4 text-sm font-bold uppercase tracking-tight">{p.name}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{p.bookings}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{p.nights}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {p.totals.length === 0 ? (
                          <span className="text-black/30 text-[10px] font-bold uppercase tracking-[2px]">
                            Unpriced
                          </span>
                        ) : (
                          p.totals.map((t) => <div key={t.currency}>{formatMoney(t.cents, t.currency)}</div>)
                        )}
                        {p.totals.length > 0 && p.missingAmount > 0 && (
                          <span className="text-black/30 text-[10px] font-bold uppercase tracking-[2px]">
                            {p.missingAmount} unpriced
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-4">Content</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {contentCards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="border border-black/20 bg-white p-5 hover:border-black transition-colors"
          >
            <c.icon size={18} className="text-black/40 mb-3" />
            <p className="text-2xl font-black tracking-tighter">{c.value ?? "-"}</p>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/40 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
