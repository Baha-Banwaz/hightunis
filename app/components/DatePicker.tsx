"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDate(date: Date | null) {
  if (!date) return "";
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

export default function DatePicker({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date | null;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => value ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset for the 1st of the month
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = startOfDay(new Date());
  const floor = minDate ? startOfDay(minDate) : today;

  const isDisabled = (day: number) => startOfDay(new Date(year, month, day)) < floor;
  const isSelected = (day: number) =>
    !!value &&
    value.getFullYear() === year &&
    value.getMonth() === month &&
    value.getDate() === day;

  return (
    <div ref={containerRef} className="relative flex flex-col border-b border-black pb-4">
      <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => {
          setViewDate(value ?? new Date());
          setOpen(!open);
        }}
        className={`text-left bg-transparent font-bold uppercase tracking-widest text-sm ${
          value ? "text-black" : "text-black/30"
        }`}
      >
        {value ? formatDate(value) : "Select date"}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white border-2 border-black p-4 shadow-[6px_6px_0_0_#000]">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-8 h-8 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-black uppercase tracking-[2px]">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-8 h-8 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-black/40">
                {d}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(new Date(year, month, day));
                    setOpen(false);
                  }}
                  className={`aspect-square text-xs font-bold flex items-center justify-center transition-colors ${
                    selected
                      ? "bg-black text-white"
                      : disabled
                      ? "text-black/20 cursor-not-allowed"
                      : "text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
