import api from "../services/api";

export async function getMedicationChart(chartId) {
    const { data } = await api.get(`/medication-charts/${chartId}`);
    return data;
}

export async function updateMedication(chartId, medicationId, payload) {
    const res = await api.put(
        `/medication-charts/${chartId}/medications/${medicationId}`,
        payload
    );
    return res.data;
}
