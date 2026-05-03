import api from './api.js';

export async function listEvents() {
  const { data } = await api.get('/events/');
  return data;
}

export async function getEvent(id) {
  const { data } = await api.get(`/events/${id}`);
  return data;
}

export async function createEvent(eventPayload) {
  const { data } = await api.post('/events/', eventPayload);
  return data;
}

export async function updateEvent(id, eventPayload) {
  const { data } = await api.put(`/events/${id}`, eventPayload);
  return data;
}

export async function deleteEvent(id) {
  await api.delete(`/events/${id}`);
}

const getBrowserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Copenhagen";
  } catch {
    return "Europe/Copenhagen";
  }
};

export const listTodayTomorrowEvents = async () => {
  const tz = getBrowserTimeZone();
  const { data } = await api.get("/events/", {
    params: {
      from: "today",
      to: "tomorrow",
      tz,
    },
  });
  return data;
};

export async function markEventSeen(id) {
  return api.post(`/events/${id}/mark-seen`);
}

export async function unmarkEventSeen(id) {
  return api.delete(`/events/${id}/mark-seen`);
}

export async function fetchCalendarEvents(filters = {}) {
  const { data } = await api.get("/events/", {
    params: filters,
  });
  return data;
}