"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n) => String(n).padStart(2, "0");
const toLocalYMD = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const afterPaint = (fn) =>
  requestAnimationFrame(() => requestAnimationFrame(fn));

export const ContinuousCalendar = ({
  onClick,
  onCreate,
  onEventClick,
  onDelete,
  events = [],
}) => {
  const today = new Date();
  const dayRefs = useRef([]);
  const containerRef = useRef(null);

  const [year, setYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState(() => ({
  title: "",
  description: "",
  date: toLocalYMD(new Date()),
  time: "",
  type: "Meeting",
  showOnBoard: true,

  residentId: "",
  isPrivate: false,
  accessLevel: "1",
  riskLevel: 1,
  usersWithAccessIds: [],
}));

  const eventTypes = [
    "Meeting",
    "Task",
    "Reminder",
    "Holiday",
    "Private",
    "Other",
  ];
  const monthOptions = monthNames.map((m, i) => ({ name: m, value: `${i}` }));

  const visuals = (type) => {
    const map = {
      Meeting: {
        icon: "🧑‍💼",
        bg: "#e7f1ff",
        border: "#b7d4ff",
        text: "#0d6efd",
      },
      Task: { icon: "📝", bg: "#e6fff7", border: "#b9f2df", text: "#15997a" },
      Reminder: {
        icon: "⏰",
        bg: "#fff8e6",
        border: "#ffe1a3",
        text: "#b08900",
      },
      Holiday: {
        icon: "🎉",
        bg: "#ffe8ea",
        border: "#ffc3c8",
        text: "#c43b51",
      },
      Private: {
        icon: "🔒",
        bg: "#eef4ff",
        border: "#bcd0ff",
        text: "#2b5bd7",
      },
      Other: { icon: "✨", bg: "#f0f2f5", border: "#d7dbe1", text: "#5c6773" },
    };
    return map[type] || map.Other;
  };

  const eventsByDate = useMemo(() => {
    const map = new Map();

    (events || []).forEach((e) => {
      if (!e?.showOnBoard) return;

      let key = null;

      if (e.startAt) {
        const dt = new Date(e.startAt);
        if (!isNaN(dt.getTime())) {
          key = toLocalYMD(dt);
        }
      }

      if (!key && e.date) {
        key = String(e.date).slice(0, 10);
      }

      if (!key) return;

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });

    for (const [, arr] of map.entries()) {
      arr.sort(
        (a, b) =>
          (a.time || "").localeCompare(b.time || "") ||
          (a.title || "").localeCompare(b.title || "")
      );
    }

    return map;
  }, [events]);

 const openForm = useCallback((eventToEdit = null, dateObj = null) => {
  setFormErrors({});
  setEditingEvent(eventToEdit || null);

  if (eventToEdit) {
    setFormData({
      id: eventToEdit.id,
      title: eventToEdit.title || "",
      description: eventToEdit.description || "",
      date:
        (eventToEdit.date || "").slice(0, 10) ||
        (eventToEdit.startAt
          ? toLocalYMD(new Date(eventToEdit.startAt))
          : toLocalYMD(new Date())),
      time: eventToEdit.time || "",
      type: eventToEdit.type || "Meeting",
      showOnBoard: !!eventToEdit.showOnBoard,
      residentId: eventToEdit.residentId || "",
      isPrivate: !!eventToEdit.isPrivate,
      accessLevel: eventToEdit.accessLevel || "1",
      riskLevel: eventToEdit.riskLevel || 1,
      usersWithAccessIds: eventToEdit.usersWithAccessIds || [],
    });
  } else {
    const initialDate = dateObj
      ? toLocalYMD(dateObj)
      : toLocalYMD(new Date());

    setFormData({
      id: null,
      title: "",
      description: "",
      date: initialDate,
      time: "",
      type: "Meeting",
      showOnBoard: true,
      residentId: "",
      isPrivate: false,
      accessLevel: "1",
      riskLevel: 1,
      usersWithAccessIds: [],
    });
  }

  setShowForm(true);
}, []);

  const validate = () => {
    const e = {};
    if (!formData.title?.trim()) e.title = "Title is required";
    if (!formData.date) e.date = "Date is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const [y, m, d] = formData.date.split("-").map(Number);
    const out = new Date(y, (m || 1) - 1, d || 1);
    if (formData.time) {
      const [hh, mi] = formData.time.split(":").map(Number);
      out.setHours(hh || 0, mi || 0, 0, 0);
    }

    const eventId = editingEvent ? editingEvent.id : `${Date.now()}`;

    const payload = {
      id: eventId,
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      date: formData.date,
      time: formData.time || "",
      datetime: out.toISOString(),
      type: formData.type,
      showOnBoard: !!formData.showOnBoard,
    };

    if (onCreate) onCreate(payload);

    setShowForm(false);
    setEditingEvent(null);
    setFormData((p) => ({
      ...p,
      id: null,
      title: "",
      description: "",
      time: "",
      showOnBoard: true,
    }));
  };

  const scrollToDay = (monthIndex, dayIndex) => {
    const idx = dayRefs.current.findIndex(
      (ref) =>
        ref &&
        ref.getAttribute("data-month") === `${monthIndex}` &&
        ref.getAttribute("data-day") === `${dayIndex}`
    );
    const target = dayRefs.current[idx];
    if (idx === -1 || !target) return;

    const cont = containerRef.current;
    const r = target.getBoundingClientRect();

    if (cont) {
      const cr = cont.getBoundingClientRect();
      const offset = r.top - cr.top - cr.height / 2.5 + r.height / 2;
      cont.scrollTo({ top: cont.scrollTop + offset, behavior: "smooth" });
    } else {
      const offset =
        window.scrollY + r.top - window.innerHeight / 2.5 + r.height / 2;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const jumpToMonthDay = (y, m, d) => {
    setYear(y);
    setSelectedMonth(m);
    afterPaint(() => scrollToDay(m, d));
  };

  const handleMonthChange = (e) => {
    const i = Number(e.target.value);
    setSelectedMonth(i);
    afterPaint(() => scrollToDay(i, 1));
  };

  const handleTodayClick = () => {
    const t = new Date();
    jumpToMonthDay(t.getFullYear(), t.getMonth(), t.getDate());
  };

  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => setYear((y) => y + 1);

  const handleDayClick = (day, month, yy) => {
    if (!onClick) return;
    if (month < 0) onClick(day, 11, yy - 1);
    else onClick(day, month, yy);
  };

  const handleAddEventButton = () => openForm(null, new Date());

  const handleInlineAddClick = (e, day, month, yy) => {
    e.preventDefault();
    e.stopPropagation();
    const m = month < 0 ? 11 : month;
    const y = month < 0 ? yy - 1 : yy;
    openForm(null, new Date(y, m, day));
  };

  const handleEventOpen = (eObj, e) => {
    e?.stopPropagation();
    setSelectedEvent(eObj);
    if (onEventClick) onEventClick(eObj);
  };

  const closeDetails = () => setSelectedEvent(null);

  const handleDeleteClick = (eventObj) => {
    if (onDelete) {
      onDelete(eventObj.id);
      closeDetails();
    }
  };

  const generateCalendar = useMemo(() => {
    dayRefs.current = [];

    const todayLocal = new Date();

    const daysInYear = () => {
      const out = [];
      const startDay = new Date(year, 0, 1).getDay();
      if (startDay < 6) {
        for (let i = 0; i < startDay; i++) {
          out.push({ month: -1, day: 32 - startDay + i });
        }
      }
      for (let m = 0; m < 12; m++) {
        const dim = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= dim; d++) {
          out.push({ month: m, day: d });
        }
      }
      const tail = out.length % 7;
      if (tail > 0) {
        for (let d = 1; d <= 7 - tail; d++) {
          out.push({ month: 0, day: d });
        }
      }
      return out;
    };

    const calendarDays = daysInYear();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return weeks.map((week, w) => (
      <div className="grid-7 w-100" key={`week-${w}`}>
        {week.map(({ month, day }, di) => {
          const idx = w * 7 + di;
          const isNewMonth = idx === 0 || calendarDays[idx - 1].month !== month;
          const isToday =
            todayLocal.getMonth() === month &&
            todayLocal.getDate() === day &&
            todayLocal.getFullYear() === year;

          const dateKey =
            month >= 0 ? `${year}-${pad(month + 1)}-${pad(day)}` : null;
          const items = dateKey ? eventsByDate.get(dateKey) || [] : [];

          const featured = items.find((e) => e.type === "Private");
          const regular = items.filter((e) => e.type !== "Private");
          const iconStack = items.slice(0, 3).map((e) => visuals(e.type).icon);

          const keyActivate = (cb) => (evt) => {
            if (evt.key === "Enter" || evt.key === " ") {
              evt.preventDefault();
              cb(evt);
            }
          };

          return (
            <div
              key={`${month}-${day}`}
              ref={(el) => {
                dayRefs.current[idx] = el;
              }}
              data-month={month}
              data-day={day}
              onClick={() => handleDayClick(day, month, year)}
              className="calendar-day modern-day"
            >
              <div className="calendar-square position-relative">
                <div className="position-absolute top-0 start-0 end-0 bottom-0 p-2 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className={
                          "day-number modern-day-number " +
                          (isToday ? "is-today" : "")
                        }
                      >
                        {day}
                      </span>
                      {isNewMonth && month >= 0 && (
                        <span className="month-label text-truncate">
                          {monthNames[month]}
                        </span>
                      )}
                    </div>

                    {iconStack.length > 0 && (
                      <div className="icon-stack">
                        {iconStack.map((ic, i) => (
                          <span className="icon-badge" key={i} title="Event">
                            {ic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {featured && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(ev) => handleEventOpen(featured, ev)}
                      onKeyDown={keyActivate((ev) =>
                        handleEventOpen(featured, ev)
                      )}
                      className="event-featured mt-2"
                      title={featured.title}
                      style={{
                        background: visuals(featured.type).bg,
                        borderColor: visuals(featured.type).border,
                        color: visuals(featured.type).text,
                        cursor: "pointer",
                      }}
                    >
                      <span className="me-2">
                        {visuals(featured.type).icon}
                      </span>
                      <strong className="me-1">{featured.title}</strong>
                      {featured.time && (
                        <span className="opacity-75">{featured.time}</span>
                      )}
                    </div>
                  )}

                  {regular.length > 0 && (
                    <div className="mt-2 d-flex flex-column gap-2">
                      {regular.slice(0, 2).map((eObj) => {
                        const v = visuals(eObj.type);
                        return (
                          <div
                            key={eObj.id}
                            role="button"
                            tabIndex={0}
                            onClick={(ev) => handleEventOpen(eObj, ev)}
                            onKeyDown={keyActivate((ev) =>
                              handleEventOpen(eObj, ev)
                            )}
                            className="event-pill"
                            title={
                              eObj.title + (eObj.time ? ` • ${eObj.time}` : "")
                            }
                            style={{
                              background: v.bg,
                              borderColor: v.border,
                              color: v.text,
                              cursor: "pointer",
                            }}
                          >
                            <span className="me-2">{v.icon}</span>
                            <span className="text-truncate">
                              {eObj.time ? `${eObj.time} ` : ""}
                              {eObj.title}
                            </span>
                          </div>
                        );
                      })}
                      {regular.length > 2 && (
                        <div className="event-more">
                          +{regular.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm btn-light rounded-circle add-btn"
                    aria-label="Add event"
                    onClick={(e) => handleInlineAddClick(e, day, month, year)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  }, [year, eventsByDate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            const m = parseInt(ent.target.getAttribute("data-month"), 10);
            if (!Number.isNaN(m) && m >= 0) {
              setSelectedMonth(m);
            }
          }
        });
      },
      {
        root: container,
        rootMargin: "-75% 0px -25% 0px",
        threshold: 0,
      }
    );

    dayRefs.current.forEach((ref) => {
      if (
        ref &&
        ref.getAttribute("data-day") === "15" &&
        ref.getAttribute("data-month") >= 0
      ) {
        obs.observe(ref);
      }
    });

    return () => obs.disconnect();
  }, [generateCalendar]);

  return (
    <div
      ref={containerRef}
      className="no-scrollbar calendar-container bg-white text-dark shadow rounded-top-4 pb-4"
    >
      {/* toolbar */}
      <div className="calendar-toolbar position-sticky top-0 w-100 bg-white rounded-top-4 px-3 px-sm-4 pt-3 pt-sm-4 border-bottom">
        <div className="mb-3 d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex flex-wrap gap-2">
            <Select
              name="month"
              value={`${selectedMonth}`}
              options={monthOptions}
              onChange={handleMonthChange}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleTodayClick}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddEventButton}
            >
              + Add Event
            </button>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={handlePrevYear}
              className="btn btn-outline-secondary rounded-circle p-2"
              aria-label="Previous year"
            >
              ‹
            </button>
            <h1 className="fs-5 text-center mb-0" style={{ minWidth: "5rem" }}>
              {year}
            </h1>
            <button
              onClick={handleNextYear}
              className="btn btn-outline-secondary rounded-circle p-2"
              aria-label="Next year"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid-7 text-secondary fw-semibold">
          {daysOfWeek.map((d, i) => (
            <div key={i} className="w-100 text-center py-2 border-bottom">
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="w-100 px-3 px-sm-4 pt-3">{generateCalendar}</div>

      {/* Create Event Modal */}
      {showForm && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(0,0,0,0.35)",
            zIndex: 12000,
          }}
        >
          <div
            className="bg-white rounded-4 shadow p-3 p-sm-4"
            style={{ width: "min(640px, 92vw)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="newEventTitle"
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 id="newEventTitle" className="h5 mb-0">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                className="btn btn-light"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={
                    "form-control " + (formErrors.title ? "is-invalid" : "")
                  }
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Event title"
                  required
                />
                {formErrors.title && (
                  <div className="invalid-feedback">{formErrors.title}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional details"
                />
              </div>

              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={
                      "form-control " + (formErrors.date ? "is-invalid" : "")
                    }
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                  {formErrors.date && (
                    <div className="invalid-feedback">{formErrors.date}</div>
                  )}
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-12 col-sm-6">
                  <label className="form-label">Event Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                  >
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 d-flex align-items-end">
                  <div className="form-check mt-3 mt-sm-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showOnBoard"
                      checked={formData.showOnBoard}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showOnBoard: e.target.checked,
                        })
                      }
                    />
                    <label className="form-check-label" htmlFor="showOnBoard">
                      Show on Board
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(0,0,0,0.35)",
            zIndex: 12000,
          }}
        >
          <div
            className="bg-white rounded-4 shadow p-3 p-sm-4"
            style={{ width: "min(560px, 92vw)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="eventDetailsTitle"
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 id="eventDetailsTitle" className="h5 mb-0">
                Event details
              </h2>
              <button
                className="btn btn-light"
                onClick={closeDetails}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: visuals(selectedEvent.type).bg,
                  border: "1px solid " + visuals(selectedEvent.type).border,
                  color: visuals(selectedEvent.type).text,
                  fontSize: 24,
                }}
              >
                {visuals(selectedEvent.type).icon}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h3 className="h5 mb-0">{selectedEvent.title}</h3>
                  <span
                    className="badge text-bg-light border"
                    style={{
                      borderColor: visuals(selectedEvent.type).border,
                      color: visuals(selectedEvent.type).text,
                    }}
                  >
                    {selectedEvent.type}
                  </span>
                </div>

                <div className="text-secondary mt-1">
                  {(() => {
                    const base = selectedEvent.startAt
                      ? new Date(selectedEvent.startAt)
                      : new Date(
                          `${selectedEvent.date || ""}T${
                            selectedEvent.time || "00:00"
                          }`
                        );
                    return isNaN(base.getTime()) ? "" : base.toLocaleString();
                  })()}
                </div>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="mt-3">
                <div className="fw-semibold mb-1">Description</div>
                <div className="text-secondary">
                  {selectedEvent.description}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteClick(selectedEvent)}
              >
                Delete Event
              </button>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    closeDetails();
                    openForm(selectedEvent);
                  }}
                >
                  ✏️ Edit Event
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Select = ({
  name,
  value,
  label,
  options = [],
  onChange,
  className,
}) => (
  <div className={className || ""}>
    {label && (
      <label htmlFor={name} className="form-label fw-medium text-dark">
        {label}
      </label>
    )}
    <div className="position-relative" style={{ minWidth: 180 }}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="form-select"
        required
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  </div>
);
