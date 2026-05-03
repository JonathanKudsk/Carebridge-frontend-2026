import { useState, useEffect } from "react";
import { createShift, getPlanPeriod, getCareWorkers, createShiftAssignment } from "../services/shifts.js";

export default function ShiftCreatePage() {
  const [planPeriodId, setPlanPeriodId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [shiftType, setShiftType] = useState("DAY");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [careWorkers, setCareWorkers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchCareWorkers() {
      setLoadingUsers(true);
      try {
        const data = await getCareWorkers();
        setCareWorkers(data);
      } catch (err) {
        console.error("Kunne ikke hente medarbejdere:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchCareWorkers();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!planPeriodId) nextErrors.planPeriodId = "Planperiode er påkrævet.";
    if (!locationId) nextErrors.locationId = "Lokation er påkrævet.";
    if (!shiftType) nextErrors.shiftType = "Vagttype er påkrævet.";
    if (!startTime) nextErrors.startTime = "Starttid er påkrævet.";
    if (!endTime) nextErrors.endTime = "Sluttid er påkrævet.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime())) nextErrors.startTime = "Ugyldig starttid.";
    if (isNaN(end.getTime())) nextErrors.endTime = "Ugyldig sluttid.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    if (end <= start) {
      setErrors({ endTime: "Sluttid skal være efter starttid." });
      return;
    }

    setSubmitting(true);

    try {
      const pp = await getPlanPeriod(planPeriodId);
      const ppStart = pp?.startDate || pp?.start_date;
      const ppEnd = pp?.endDate || pp?.end_date;

      if (!ppStart || !ppEnd) {
        setErrors({ planPeriodId: "Planperioden har ikke start/slut dato." });
        setSubmitting(false);
        return;
      }

      const startDate = new Date(ppStart + "T00:00:00");
      const endDate = new Date(ppEnd + "T23:59:59");

      if (start < startDate || end > endDate) {
        setErrors({
          startTime: "Vagten skal ligge inden for planperioden.",
          endTime: "Vagten skal ligge inden for planperioden.",
        });
        setSubmitting(false);
        return;
      }

      const createdShift = await createShift({
        planPeriodId: Number(planPeriodId),
        locationId: Number(locationId),
        shiftType,
        startTime,
        endTime,
      });

      if (selectedUserId) {
        await createShiftAssignment(createdShift.id, Number(selectedUserId));
      }

      setErrors({});
      alert(selectedUserId ? "Vagt oprettet og medarbejder tildelt." : "Vagt oprettet.");

      setStartTime("");
      setEndTime("");
      setSelectedUserId("");

    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Kunne ikke oprette vagt.";

      if (String(msg).toLowerCase().includes("planperiode")) {
        setErrors({
          startTime: "Vagten skal ligge inden for planperioden.",
          endTime: "Vagten skal ligge inden for planperioden.",
        });
      } else {
        setErrors({});
      }

      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Opret vagt</h2>

      <form onSubmit={onSubmit}>
        <p>
          <label>
            Planperiode ID:
            <br />
            <input
              value={planPeriodId}
              onChange={(e) => setPlanPeriodId(e.target.value)}
            />
          </label>
          {errors.planPeriodId && <div>{errors.planPeriodId}</div>}
        </p>

        <p>
          <label>
            Lokation ID:
            <br />
            <input
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            />
          </label>
          {errors.locationId && <div>{errors.locationId}</div>}
        </p>

        <p>
          <label>
            Vagttype:
            <br />
            <select value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
              <option value="DAY">DAY</option>
              <option value="EVENING">EVENING</option>
              <option value="NIGHT">NIGHT</option>
              <option value="ON_CALL">ON_CALL</option>
            </select>
          </label>
          {errors.shiftType && <div>{errors.shiftType}</div>}
        </p>

        <p>
          <label>
            Starttid:
            <br />
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          {errors.startTime && <div>{errors.startTime}</div>}
        </p>

        <p>
          <label>
            Sluttid:
            <br />
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
          {errors.endTime && <div>{errors.endTime}</div>}
        </p>

        <p>
          <label>
            Tildel medarbejder (valgfrit):
            <br />
            {loadingUsers ? (
              <span>Henter medarbejdere...</span>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Ingen tildeling --</option>
                {careWorkers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        </p>

        <button type="submit" disabled={submitting}>
          {submitting ? "Gemmer..." : "Gem"}
        </button>
      </form>
    </div>
  );
}