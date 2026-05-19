import { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import {
  getShift,
  updateShift,
  deleteShift,
  getPlanPeriod,
  getCareWorkers,
  createShiftAssignment,
} from "../services/shifts.js";
import { useNavigate, useParams } from "react-router-dom";
import { useSnack } from "../hooks/useSnack.js";

export default function ShiftEditPage() {
  const navigate = useNavigate();
  const { shiftId } = useParams();
  const { createSnack } = useSnack();
  const [planPeriodId, setPlanPeriodId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [shiftType, setShiftType] = useState("DAY");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [careWorkers, setCareWorkers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingShift, setLoadingShift] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function fetchShift() {
      try {
        const shift = await getShift(shiftId);
        setPlanPeriodId(String(shift.planPeriodId));
        setLocationId(String(shift.locationId));
        setShiftType(shift.shiftType || "DAY");
        setStartTime(shift.startShift ? shift.startShift.slice(0, 16) : "");
        setEndTime(shift.endShift ? shift.endShift.slice(0, 16) : "");
        setSelectedUserId(
          shift.assignedUserId ? String(shift.assignedUserId) : "",
        );
      } catch (err) {
        console.error("Kunne ikke hente vagt:", err);
      } finally {
        setLoadingShift(false);
      }
    }
    fetchShift();
  }, [shiftId]);

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
    setSuccessMsg("");

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

      await updateShift(shiftId, {
        planPeriodId: Number(planPeriodId),
        locationId: Number(locationId),
        shiftType,
        startShift: startTime,
        endShift: endTime,
        assignedUserId: selectedUserId ? Number(selectedUserId) : null,
      });

      if (selectedUserId) {
        await createShiftAssignment(shiftId, Number(selectedUserId));
      }

      setErrors({});
      setSuccessMsg("Vagt opdateret.");
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Kunne ikke opdatere vagt.";

      if (String(msg).toLowerCase().includes("overlap")) {
        setErrors({
          selectedUserId:
            "Medarbejderen er allerede planlagt i dette tidsrum.",
        });
      } else if (String(msg).toLowerCase().includes("planperiode")) {
        setErrors({
          startTime: "Vagten skal ligge inden for planperioden.",
          endTime: "Vagten skal ligge inden for planperioden.",
        });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      await deleteShift(shiftId);
      setShowDeleteModal(false);
      createSnack("Vagten blev slettet.", "success");
      navigate("/schedule");
    } catch (err) {
      const message =
        err?.response?.status === 404
          ? "Vagten findes ikke længere"
          : err?.response?.data?.msg ||
            err?.response?.data?.message ||
            err?.message ||
            "Kunne ikke slette vagten.";

      setShowDeleteModal(false);
      createSnack(message, "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loadingShift) return <div>Henter vagt...</div>;

  return (
    <div>
      <h2>Rediger vagt</h2>

      {successMsg && <div style={{ color: "green" }}>{successMsg}</div>}
      {errors.general && <div style={{ color: "red" }}>{errors.general}</div>}

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
          {errors.planPeriodId && (
            <div style={{ color: "red" }}>{errors.planPeriodId}</div>
          )}
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
          {errors.locationId && (
            <div style={{ color: "red" }}>{errors.locationId}</div>
          )}
        </p>

        <p>
          <label>
            Vagttype:
            <br />
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
            >
              <option value="DAY">DAY</option>
              <option value="EVENING">EVENING</option>
              <option value="NIGHT">NIGHT</option>
              <option value="ON_CALL">ON_CALL</option>
            </select>
          </label>
          {errors.shiftType && (
            <div style={{ color: "red" }}>{errors.shiftType}</div>
          )}
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
          {errors.startTime && (
            <div style={{ color: "red" }}>{errors.startTime}</div>
          )}
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
          {errors.endTime && (
            <div style={{ color: "red" }}>{errors.endTime}</div>
          )}
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
          {errors.selectedUserId && (
            <div style={{ color: "red" }}>{errors.selectedUserId}</div>
          )}
        </p>

        <button type="submit" disabled={submitting || deleting}>
          {submitting ? "Gemmer..." : "Gem ændringer"}
        </button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
          disabled={submitting || deleting}
        >
          Slet vagt
        </Button>
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Bekræft sletning</Modal.Title>
        </Modal.Header>
        <Modal.Body>Er du sikker på at du vil slette denne vagt?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Annuller
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Sletter..." : "Bekræft"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
