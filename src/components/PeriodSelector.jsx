import { useEffect, useMemo, useState } from "react";
import { listPlanPeriods } from "../services/shifts.js";

const dateFormatter = new Intl.DateTimeFormat("da-DK", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
}

function getPeriodLabel(period) {
  if (!period) return "";

  const start = period.startDate || period.start_date || period.start;
  const end = period.endDate || period.end_date || period.end;

  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  return period.name || period.title || `Planperiode ${period.id}`;
}

export default function PeriodSelector({
  value = "",
  onChange,
  disabled = false,
  label = "Planperiode",
}) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPeriods() {
      setLoading(true);
      setError("");

      try {
        const data = await listPlanPeriods();
        if (!active) return;

        setPeriods(data);

        if (!value && data.length > 0 && onChange) {
          onChange(String(data[0].id), data[0]);
        }
      } catch (err) {
        if (!active) return;

        console.error("Kunne ikke hente planperioder:", err);
        setError("Kunne ikke hente planperioder.");
        setPeriods([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPeriods();

    return () => {
      active = false;
    };
  }, [onChange, value]);

  const selectedIndex = useMemo(
    () => periods.findIndex((period) => String(period.id) === String(value)),
    [periods, value],
  );

  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < periods.length - 1;

  function handleSelectChange(nextValue) {
    const selectedPeriod =
      periods.find((period) => String(period.id) === String(nextValue)) || null;

    if (onChange) {
      onChange(String(nextValue), selectedPeriod);
    }
  }

  function goToOffset(offset) {
    if (selectedIndex < 0) return;
    const nextPeriod = periods[selectedIndex + offset];
    if (!nextPeriod) return;
    handleSelectChange(nextPeriod.id);
  }

  return (
    <div>
      <p>
        <label>
          {label}:
          <br />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => goToOffset(-1)}
              disabled={disabled || loading || !canGoPrevious}
              aria-label="Forrige planperiode"
            >
              ←
            </button>

            <select
              value={value}
              onChange={(e) => handleSelectChange(e.target.value)}
              disabled={disabled || loading || periods.length === 0}
              style={{ minWidth: "240px" }}
            >
              {periods.length === 0 && <option value="">Ingen planperioder</option>}
              {periods.map((period) => (
                <option key={period.id} value={String(period.id)}>
                  {getPeriodLabel(period)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => goToOffset(1)}
              disabled={disabled || loading || !canGoNext}
              aria-label="Næste planperiode"
            >
              →
            </button>
          </div>
        </label>
      </p>

      {loading && <div>Henter planperioder...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
