import api from "../services/api";

export async function getSavingsGoalsByResident(residentId) {
  const res = await api.get(`/savings-goals/resident/${residentId}`);
  return res.data;
}

export async function createSavingsGoal(data) {
  const res = await api.post("/savings-goals", data);
  return res.data;
}

export async function updateSavingsGoal(id, data) {
  const res = await api.put(`/savings-goals/${id}`, data);
  return res.data;
}

export async function deleteSavingsGoal(id) {
  const res = await api.delete(`/savings-goals/${id}`);
  return res.data;
}
