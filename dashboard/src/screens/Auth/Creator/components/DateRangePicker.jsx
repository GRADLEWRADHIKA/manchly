import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import colors from "../../../../utils/colors";


const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const addDays = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a, b) => !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();

const formatDate = (d) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatMonth = (d) =>
  d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

// "#F5A623" -> "rgba(245, 166, 35, 0.15)"
function tint(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isInDateRange(dateInput, range) {
  if (!range?.start || !range?.end) return true;
  if (!dateInput) return false;
  const t = new Date(dateInput).getTime();
  if (Number.isNaN(t)) return false;
  return (
    t >= startOfDay(range.start).getTime() &&
    t <= endOfDay(range.end).getTime()
  );
}


const PRESETS = [
  { key: "today", label: "Today", range: (t) => ({ start: t, end: t }) },
  {
    key: "yesterday",
    label: "Yesterday",
    range: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }),
  },
  {
    key: "last7",
    label: "Last 7 Days",
    range: (t) => ({ start: addDays(t, -6), end: t }),
  },
  {
    key: "last30",
    label: "Last 30 Days",
    range: (t) => ({ start: addDays(t, -29), end: t }),
  },
  {
    key: "thisMonth",
    label: "This Month",
    range: (t) => ({ start: new Date(t.getFullYear(), t.getMonth(), 1), end: t }),
  },
  {
    key: "lastMonth",
    label: "Last Month",
    range: (t) => ({
      start: new Date(t.getFullYear(), t.getMonth() - 1, 1),
      end: new Date(t.getFullYear(), t.getMonth(), 0),
    }),
  },
];

function detectPreset(range, today) {
  if (!range?.start || !range?.end) return null;
  const match = PRESETS.find((p) => {
    const r = p.range(today);
    return sameDay(r.start, range.start) && sameDay(r.end, range.end);
  });
  return match ? match.key : "custom";
}


const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MonthGrid({ month, start, end, today, accent, onPick }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const lead = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: total }, (_, i) => {
    const date = new Date(year, m, i - lead + 1);
    return { date, inMonth: date.getMonth() === m };
  });

  const band = tint(accent, 0.15);

  return (
    <div style={{ width: 294 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 6,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: colors.typography.secondaryText,
              padding: "6px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells.map(({ date, inMonth }, i) => {
          const key = date.toISOString();

          // Days from the neighbouring months: shown faded, not clickable
          if (!inMonth) {
            return (
              <div
                key={key + i}
                style={{
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "#CBD5E1",
                }}
              >
                {date.getDate()}
              </div>
            );
          }

          const isFuture = startOfDay(date) > today;
          const isStart = sameDay(date, start);
          const isEnd = sameDay(date, end);
          const inRange =
            start && end && date >= startOfDay(start) && date <= endOfDay(end);
          const selected = isStart || isEnd;

          return (
            <div
              key={key}
              style={{
                background: inRange && !selected ? band : "transparent",
                borderTopLeftRadius: isStart ? 8 : 0,
                borderBottomLeftRadius: isStart ? 8 : 0,
                borderTopRightRadius: isEnd ? 8 : 0,
                borderBottomRightRadius: isEnd ? 8 : 0,
                padding: "1px 0",
              }}
            >
              <button
                type="button"
                disabled={isFuture}
                onClick={() => onPick(date)}
                style={{
                  width: "100%",
                  height: 36,
                  border: "none",
                  borderRadius: 8,
                  background: selected ? accent : "transparent",
                  color: selected
                    ? colors.typography.white
                    : isFuture
                      ? "#CBD5E1"
                      : colors.typography.primaryText,
                  fontSize: 13,
                  fontWeight: selected ? 800 : 600,
                  cursor: isFuture ? "not-allowed" : "pointer",
                }}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({
  value = null,
  onChange,
  accentColor = colors.brand.primaryOrange,
  emptyLabel = "All Time",
  align = "left",
  buttonStyle = {},
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const wrapRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ start: null, end: null });
  const [preset, setPreset] = useState(null);
  // The month shown on the RIGHT. The left one is always the month before it.
  const [rightMonth, setRightMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const openPicker = () => {
    const start = value?.start ?? null;
    const end = value?.end ?? null;
    setDraft({ start, end });
    setPreset(detectPreset(value, today));
    const anchor = end ?? today;
    setRightMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setOpen(true);
  };

  // Close WITHOUT applying: outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choosePreset = (p) => {
    const r = p.range(today);
    setDraft(r);
    setPreset(p.key);
    setRightMonth(new Date(r.end.getFullYear(), r.end.getMonth(), 1));
  };

  const chooseCustom = () => {
    setPreset("custom");
    setDraft({ start: null, end: null });
  };

  // 1st click = start, 2nd click = end (swap if earlier), 3rd click = new start
  const pickDay = (date) => {
    setPreset("custom");
    setDraft((d) => {
      if (!d.start || d.end) return { start: date, end: null };
      if (date < d.start) return { start: date, end: d.start };
      return { start: d.start, end: date };
    });
  };

  const apply = () => {
    if (!draft.start || !draft.end) return;
    onChange?.({ start: draft.start, end: draft.end });
    setOpen(false);
  };

  const clear = () => {
    onChange?.(null);
    setOpen(false);
  };

  const canApply = !!draft.start && !!draft.end;
  const canGoNext = rightMonth < currentMonth;

  const summary = draft.start
    ? `${formatDate(draft.start)} - ${draft.end ? formatDate(draft.end) : ""}`
    : "No dates selected";

  const buttonLabel =
    value?.start && value?.end
      ? `${formatDate(value.start)} - ${formatDate(value.end)}`
      : emptyLabel;

  const arrowStyle = (disabled) => ({
    width: 32,
    height: 32,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.3 : 1,
    color: colors.typography.iconText,
  });

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Closed state: looks like the other filter dropdowns */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${colors.base.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 700,
          color: colors.typography.primaryText,
          background: colors.base.cardBackground,
          cursor: "pointer",
          whiteSpace: "nowrap",
          ...buttonStyle,
        }}
      >
        <Calendar size={15} color={colors.typography.iconText} />
        {buttonLabel}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 50,
            background: colors.base.cardBackground,
            border: `1px solid ${colors.base.border}`,
            borderRadius: 16,
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
          }}
        >
          <div style={{ display: "flex" }}>
            {/* Presets */}
            <div
              style={{
                width: 168,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                borderRight: `1px solid ${colors.base.border}`,
              }}
            >
              {[...PRESETS, { key: "custom", label: "Custom range" }].map((p) => {
                const active = preset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => (p.key === "custom" ? chooseCustom() : choosePreset(p))}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: active ? accentColor : "transparent",
                      color: active
                        ? colors.typography.white
                        : colors.typography.primaryText,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Two linked months */}
            <div style={{ padding: "14px 20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 24,
                }}
              >
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setRightMonth((m) => addMonths(m, -1))}
                  style={arrowStyle(false)}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ display: "flex", flex: 1, justifyContent: "space-around" }}>
                  <span style={monthTitleStyle}>{formatMonth(addMonths(rightMonth, -1))}</span>
                  <span style={monthTitleStyle}>{formatMonth(rightMonth)}</span>
                </div>
                <button
                  type="button"
                  aria-label="Next month"
                  disabled={!canGoNext}
                  onClick={() => canGoNext && setRightMonth((m) => addMonths(m, 1))}
                  style={arrowStyle(!canGoNext)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 32 }}>
                <MonthGrid
                  month={addMonths(rightMonth, -1)}
                  start={draft.start}
                  end={draft.end}
                  today={today}
                  accent={accentColor}
                  onPick={pickDay}
                />
                <MonthGrid
                  month={rightMonth}
                  start={draft.start}
                  end={draft.end}
                  today={today}
                  accent={accentColor}
                  onPick={pickDay}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 18px",
              borderTop: `1px solid ${colors.base.border}`,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.typography.secondaryText,
              }}
            >
              {summary}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={clear}
                style={{
                  padding: "9px 20px",
                  border: "none",
                  borderRadius: 10,
                  background: colors.base.hoverBackground,
                  color: colors.typography.iconText,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={!canApply}
                style={{
                  padding: "9px 24px",
                  border: "none",
                  borderRadius: 10,
                  background: accentColor,
                  color: colors.typography.white,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: canApply ? "pointer" : "not-allowed",
                  opacity: canApply ? 1 : 0.5,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const monthTitleStyle = {
  width: 294,
  textAlign: "center",
  fontSize: 15,
  fontWeight: 800,
  color: colors.typography.primaryText,
};