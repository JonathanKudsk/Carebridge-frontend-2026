import api from "./api.js";

export async function getPlanPeriod(id) {
  const res = await api.get(`/plan-periods/${id}`);
  return res.data;
}

export async function createShift(payload) {
  const res = await api.post("/shifts/", payload);
  return res.data;
}

export async function getCareWorkers() {
  const res = await api.get("/users/careworkers");
  return res.data;
}

export async function createShiftAssignment(shiftId, userId) {
  const res = await api.post("/shift-assignments", { shiftId, userId });
  return res.data;
}