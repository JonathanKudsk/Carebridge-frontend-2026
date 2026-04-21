import api from "../services/api";

function normalizeResident(record) {
  const fullName = (
    record.displayName ||
    record.name ||
    `${record.firstName || ""} ${record.lastName || ""}`
  ).trim();
  const [derivedFirstName = "", ...derivedLastNameParts] = fullName.split(" ");

  return {
    ...record,
    firstName: record.firstName || derivedFirstName,
    lastName: record.lastName || derivedLastNameParts.join(" "),
    journalId: record.journalId ?? null,
  };
}

function getArrayPayload(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return null;
}

// --- Brugere ---
export async function getUsers() {
  const res = await api.get("/users");
  return res.data;
}

export async function getResidents() {
  const residentEndpoints = ["/residents", "/residents/all", "/residents/list"];

  for (const endpoint of residentEndpoints) {
    try {
      const res = await api.get(endpoint);
      const records = getArrayPayload(res.data);

      if (records) {
        return records.map(normalizeResident);
      }
    } catch (error) {
      if (error?.response?.status && error.response.status !== 404) {
        throw error;
      }
    }
  }

  const usersRes = await api.get("/users");
  const users = getArrayPayload(usersRes.data) || [];

  return users
    .filter((user) => String(user.role || "").toUpperCase() === "RESIDENT")
    .map(normalizeResident);
}

// --- Opret bruger ---
export async function createUser(user) {
  const res = await api.post("/users", user);
  return res.data;
}

// --- Journal entries ---
export async function createJournalEntry(journalId, entry) {
  const res = await api.post(`/journals/${journalId}/journal-entries`, entry);
  return res.data;
}

export async function createResident(resident) {
  const res = await api.post("/residents/create", resident);
  return res.data;
}

// --- Server status ---
export async function getServerStatus() {
  const res = await api.get("/");
  return res.data;
}
