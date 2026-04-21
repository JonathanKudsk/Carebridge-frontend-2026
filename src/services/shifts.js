import api from "./api.js";

export async function getPlanPeriod(id) {
  const res = await api.get(`/plan-periods/${id}`);
  return res.data;
}

export async function createShift(payload) {
  const res = await api.post("/shifts/", payload);
  return res.data;
}
