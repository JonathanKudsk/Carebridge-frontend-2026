import api from "../services/api";

export async function getResidents() {
    const { data } = await api.get("/residents");
    return data;
}