import { useEffect, useState, useCallback } from "react";
import { ContinuousCalendar } from "../components/ContinuousCalendar.jsx";
import {
  listEvents,
  createEvent,
  deleteEvent as deleteEventApi,
} from "../services/events.js";
import api from "../services/api";

const normalizeDate = (raw) => {
  if (!raw && raw !== 0) return null;
  if (typeof raw === "number") {
    return new Date(raw * 1000);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const toYMD = (d) =>
  d.toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" }); // "YYYY-MM-DD"

const toHM = (d) =>
  d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Copenhagen",
  });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typesReady, setTypesReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/event-types/");
        setEventTypes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load event types", e);
        setErr(
          "Kunne ikke hente event-typer. Kør /api/populate eller opret typer som ADMIN."
        );
      } finally {
        setTypesReady(true);
      }
    })();
  }, []);

  const toUi = useCallback(
    (e) => {
      if (!e) return null;
      const dt = normalizeDate(e.startAt);
      if (!dt) {
        console.warn("Invalid startAt from backend", e);
        return null;
      }

      const typeName =
        eventTypes.find((t) => t.id === e.eventTypeId)?.name || "Meeting";

      return {
        id: e.id,
        title: e.title,
        description: e.description || "",
        date: toYMD(dt),
        time: toHM(dt),
        type: typeName,
        showOnBoard:
          e.showOnBoard === true ||
          e.showOnBoard === 1 ||
          e.showOnBoard === "true",
        startAt: dt.toISOString(),
        eventTypeId: e.eventTypeId,
        createdById: e.createdById,
      };
    },
    [eventTypes]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await listEvents();
        console.log("Raw backend events:", data);
        setEvents((data || []).map(toUi).filter(Boolean));
      } catch (ex) {
        console.error(ex);
        setErr((prev) => prev || "Kunne ikke hente events fra serveren.");
      } finally {
        setLoading(false);
      }
    })();
  }, [toUi]);

  const getTypeIdByName = (name) => {
    if (!name) return undefined;
    const hit = eventTypes.find(
      (t) => (t.name || "").toLowerCase() === String(name).toLowerCase()
    );
    return hit?.id;
  };

  const toApi = (ui) => {
    const now = new Date();
    let dt;

    if (ui.datetime) {
      dt = new Date(ui.datetime);
    } else {
      const [y, m, d] = (ui.date || toYMD(now)).split("-").map(Number);
      let hh = 0,
        mi = 0;
      if (ui.time) [hh, mi] = ui.time.split(":").map(Number);
      dt = new Date(
        y || now.getFullYear(),
        (m || 1) - 1,
        d || now.getDate(),
        hh || 0,
        mi || 0,
        0
      );
      if (
        dt < now &&
        y === now.getFullYear() &&
        m - 1 === now.getMonth() &&
        d === now.getDate()
      ) {
        dt = new Date(now.getTime() + 5 * 60 * 1000);
      }
    }

    const resolvedId = ui.eventTypeId ?? getTypeIdByName(ui.type);
    if (!resolvedId) {
      throw new Error(
        "No matching EventType in database. Kør /api/populate eller opret en event type."
      );
    }

    return {
      title: ui.title,
      description: ui.description || "",
      startAt: dt.toISOString(),
      showOnBoard: !!ui.showOnBoard,
      eventTypeId: resolvedId,
    };
  };

  const handleCreate = useCallback(
    async (payloadFromCalendar) => {
      try {
        if (!typesReady || eventTypes.length === 0) {
          alert(
            "Ingen Event Types i databasen. Kør /api/populate eller opret event types som ADMIN."
          );
          return;
        }

        const createEventPayload = buildCreateEventPayload(toApi(payloadFromCalendar));
        const created = await createEvent(createEventPayload);
        const mapped = toUi(created);
        if (mapped) {
          setEvents((prev) => [...prev, mapped]);
        }
      } catch (ex) {
        console.error("Create error:", ex?.response || ex);
        const msg =
          ex?.response?.data?.msg ||
          ex?.response?.data?.message ||
          ex?.message ||
          "Kunne ikke oprette begivenheden.";
        alert(msg);
      }
    },
    [typesReady, eventTypes, toUi]
  );

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Er du sikker på, at du vil slette denne begivenhed?"))
      return;
    try {
      await deleteEventApi(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (ex) {
      console.error(ex);
      const msg =
        ex?.response?.data?.msg ||
        ex?.response?.data?.message ||
        ex?.message ||
        "Kunne ikke slette begivenheden.";
      alert(msg);
    }
  }, []);

  return (
    <div className="calendar-shell">
      <div className="container py-3">
        <h1 className="h4 mb-3">Continuous Calendar</h1>
        {err && <p style={{ color: "red" }}>{err}</p>}
        {loading && <p>Indlæser kalender…</p>}
        {typesReady && eventTypes.length === 0 && (
          <p style={{ color: "orange" }}>
            Ingen event-typer fundet. Kør <code>/api/populate</code> eller opret
            event-typer som ADMIN.
          </p>
        )}
      </div>

      {!loading && (
        <ContinuousCalendar
          events={events}
          onCreate={handleCreate}
          onEventClick={(e) => console.log("clicked event", e)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
