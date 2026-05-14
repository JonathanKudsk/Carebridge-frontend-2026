import api from "../services/api";

export async function getMedicationChart(chartId) {
  const { data } = await api.get(`/medication-charts/${chartId}`);
  return data;
}

export async function addMedication(chartId, payload) {
  const { data } = await api.post(`/medication-charts/${chartId}/medications`, payload);
  return data;
}

export async function getMedication(chartId, medicationId) {
  const { data } = await api.get(`/medication-charts/${chartId}/medications/${medicationId}`);
  return data;
}

export async function updateMedication(chartId, medicationId, payload) {
  const { data } = await api.put(
    `/medication-charts/${chartId}/medications/${medicationId}`,
    payload
  );
  return data;
}

export async function deleteMedication(chartId, medicationId) {
  await api.delete(`/medication-charts/${chartId}/medications/${medicationId}`);
}
