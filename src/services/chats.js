import api from './api.js';

export async function listChatRooms() {
    const { data } = await api.get('/chatrooms')
    return data;
}

export async function getChat(id) {
    const { data } = await api.get(`/chatrooms/${id}`);
    return data;
}

export async function createChat(chatPayload) {
    const { data } = await api.post(`/chatrooms`, chatPayload);
    return data;
}

export async function updateChat(id, chatPayload) {
    const { data } = await api.put(`/chatrooms/${id}`, chatPayload);
    return data;
}

export async function deleteChat(id) {
    await api.delete(`/chatrooms/${id}`);
}