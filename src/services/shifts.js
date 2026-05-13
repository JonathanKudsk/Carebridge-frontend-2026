import api from "./api.js";
import ToonObjectMapper from "../utils/toon/ToonObjectMapper.js";

export async function getPlanPeriod(id) {
  const res = await api.get(`/plan-periods/${id}`);
  return res.data;
}

export async function listPlanPeriods() {
  const res = await api.get("/plan-periods", {
    headers: {
      Accept: "application/toon",
    },
    responseType: "text",
    transformResponse: [(data) => data],
  });

  return ToonObjectMapper.parseArray(res.data);
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

export async function getSchedule(periodId) {
  const res = await api.get("/shifts/", {
    params: { periodId },
    headers: {
      Accept: "application/toon",
    },
    responseType: "text",
    transformResponse: [(data) => data],
  });

  return ToonObjectMapper.parseArray(res.data);
}
