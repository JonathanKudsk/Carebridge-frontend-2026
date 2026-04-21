import api from './api.js';

export async function listChatRooms() {
    const { data } = await api.get('/chat-rooms')
    return data;
}

export async function getChat(id) {
    const { data } = await api.get(`/chat-rooms/${id}`);
    return data;
}

export async function createChat(chatPayload) {
    const { data } = await api.post(`/chat-rooms/`, chatPayload);
    return data;
}

export async function updateChat(id, chatPayload) {
    const { data } = await api.put(`/chat-rooms/${id}`, chatPayload);
    return data;
}

export async function deleteChat(id) {
    await api.delete(`/chat-rooms/${id}`);
}