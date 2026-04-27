import api from './api.js';

export async function getMessages(chatRoomId) {
    const { data } = await api.get('/messages', { params: { chatRoomId } });
    return data;
}

export async function sendMessage({ userId, chatRoomId, message }) {
    const { data } = await api.post('/messages', { userId, chatRoomId, message });
    return data;
}
