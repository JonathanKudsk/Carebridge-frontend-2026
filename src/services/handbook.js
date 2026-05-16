import api from "./api.js";

// Fetches the full handbook with all tabs
export async function getHandbook() {
    const { data } = await api.get(`/handbook`);
    return data;
}

// Updates the HTML content of a tab, sanitized server-side via Jsoup
export async function updateTabContent(tabId, content) {
    const { data } = await api.put(`/handbook/tabs/${tabId}/content`, { content });
    return data;
}

export async function updateTabTitle(tabId, title) {
    const { data } = await api.put(`/handbook/tabs/${tabId}/title`, { title });
    return data;
}

// Creates a new tab under the given handbook with a role restriction
export async function createTab(handbookId, title, requiredRole) {
    const { data } = await api.post(`/handbook/tabs`, { handbookId, title, requiredRole });
    return data;
}

export async function deleteTab(tabId) {
    await api.delete(`/handbook/tabs/${tabId}`);
}

// Persists the new tab order by sending an ordered list of tab ids
export async function updateTabOrder(handbookId, tabIds) {
    const { data } = await api.put(`/handbook/${handbookId}/tabs/order`, { tabIds });
    return data;
}