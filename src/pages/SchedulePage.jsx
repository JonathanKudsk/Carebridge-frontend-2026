import { useMemo, useState } from "react";
import { getSchedule } from "../services/shifts.js";
import PeriodSelector from "../components/PeriodSelector.jsx";

const dateFormatter = new Intl.DateTimeFormat("da-DK", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("da-DK", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function parseDate(value) {
  if (!value && value !== 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : "Ukendt dato";
}

function formatTime(value) {
  const date = parseDate(value);
  return date ? timeFormatter.format(date) : "Ukendt tid";
}

function readLocation(shift) {
  return (
    shift.location?.name ||
    shift.locationName ||
    shift.location ||
    shift.team?.name ||
    shift.teamName ||
    shift.team ||
    "Ukendt lokation"
  );
}

function normalizeShift(shift, index) {
  const startValue =
    shift.startShift || shift.startTime || shift.start || shift.startsAt;
  const endValue = shift.endShift || shift.endTime || shift.end || shift.endsAt;

  return {
    id: shift.id ?? `${startValue ?? "shift"}-${index}`,
    date: shift.date || startValue,
    startTime: startValue,
    endTime: endValue,
    shiftType: shift.shiftType || shift.type || "Ukendt vagttype",
    location: readLocation(shift),
  };
}

export default function SchedulePage() {
  const [periodId, setPeriodId] = useState("");
  const [shifts, setShifts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          shifts
            .map((shift) => shift.location)
            .filter((location) => typeof location === "string" && location.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b, "da-DK")),
    [shifts],
  );

  const visibleShifts = useMemo(() => {
    if (!selectedLocation) return shifts;
    return shifts.filter((shift) => shift.location === selectedLocation);
  }, [selectedLocation, shifts]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!periodId.trim()) {
      setError("Planperiode ID er påkrævet.");
      setHasSearched(false);
      setShifts([]);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const data = await getSchedule(periodId.trim());
      setSelectedLocation("");
      setShifts((Array.isArray(data) ? data : []).map(normalizeShift));
    } catch (err) {
      console.error("Kunne ikke hente vagtplan:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Kunne ikke hente vagtplanen.",
      );
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Vagtplan</h2>

      <form onSubmit={onSubmit}>
        <PeriodSelector value={periodId} onChange={setPeriodId} disabled={loading} />

        <p>
          <label>
            Lokation:
            <br />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              disabled={loading || locations.length === 0}
            >
              <option value="">Alle lokationer</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </p>

        <button type="submit" disabled={loading}>
          {loading ? "Henter..." : "Hent vagtplan"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {!error && hasSearched && !loading && visibleShifts.length === 0 && (
        <p style={{ marginTop: "1rem" }}>Ingen vagter i denne periode.</p>
      )}

      {visibleShifts.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          {visibleShifts.map((shift) => (
            <div
              key={shift.id}
              style={{
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <strong>Dato:</strong> {formatDate(shift.date)}
              </div>
              <div>
                <strong>Start:</strong> {formatTime(shift.startTime)}
              </div>
              <div>
                <strong>Slut:</strong> {formatTime(shift.endTime)}
              </div>
              <div>
                <strong>Vagttype:</strong> {shift.shiftType}
              </div>
              <div>
                <strong>Team/lokation:</strong> {shift.location}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
