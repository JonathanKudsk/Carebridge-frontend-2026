import api from './api.js';

export async function getDosagesByResident(residentId) {
    const { data } = await api.get(`/dosages/${residentId}/dosages`);
    return data;
}

export async function createDosage(payload) {
    const { data } = await api.post('/dosages/', payload);
    return data;
}

export async function updateDosage(id, payload) {
    const { data } = await api.put(`/dosages/${id}`, payload);
    return data;
}

export async function deleteDosage(id) {
    await api.delete(`/dosages/${id}`);
}