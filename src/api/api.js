import api from "../services/api";

// --- Brugere ---
export async function getUsers() {
  const res = await api.get("/users");
  return res.data;
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

export async function getJournalEntries(journalId) {
  const res = await api.get(`/journals/${journalId}/journal-entries-data`);
  return res.data;
}

export async function getJournalEntry(journalId, entryId) {
  const res = await api.get(`/journals/${journalId}/journal-entries/${entryId}`);
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

// --- Medarbejdere (careworkers) ---
export async function getCareworkers() {
  const res = await api.get("/users/careworkers");
  return res.data;
}

// --- Medarbejderjournal ---
export async function getStaffJournalByUserId(userId) {
  const res = await api.get(`/staff-journals/user/${userId}`);
  return res.data;
}

export async function getStaffJournalEntries(journalId) {
  const res = await api.get(`/staff-journals/${journalId}/entries`);
  return res.data;
}

export async function createStaffJournalEntry(journalId, data) {
  const res = await api.post(`/staff-journals/${journalId}/entries`, data);
  return res.data;
}

export async function updateStaffJournalEntry(journalId, entryId, data) {
  const res = await api.put(`/staff-journals/${journalId}/entries/${entryId}`, data);
  return res.data;
}

export async function deleteStaffJournalEntry(journalId, entryId) {
  await api.delete(`/staff-journals/${journalId}/entries/${entryId}`);
}

export async function uploadContract(journalId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post(`/staff-journals/${journalId}/contract`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function downloadContract(journalId, contractId) {
  const res = await api.get(`/staff-journals/${journalId}/contract/${contractId}`, {
    responseType: "blob",
  });
  const contentDisposition = res.headers["content-disposition"] || "";
  const match = contentDisposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : "contract.pdf";
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteContract(journalId, contractId) {
  await api.delete(`/staff-journals/${journalId}/contract/${contractId}`);
}
export async function updateResident(id, residentData) {
  const res = await api.put(`/residents/${id}`, residentData);
  return res.data;
}

export async function deleteResident(id) {
  const res = await api.delete(`/residents/${id}`);
  return res.data;
}

export async function getResidents() {
  const res = await api.get("/residents");
  return res.data;
}

export async function getResidentById(id) {
  const res = await api.get(`/residents/${id}`);
  return res.data;
}

export async function deactivateResident(id) {
  const res = await api.put(`/residents/deactivate/${id}`);
  return res.data;
}
