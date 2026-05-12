import api from "./api";

const AUTH_CHANGED_EVENT = "auth-changed";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
export function onAuthChanged(callback) {
  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, callback);
}

export function getToken() {
  return localStorage.getItem("token");
}
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
export function getSessionTimes() {
  return {
    warningAt: Number(localStorage.getItem("warningAt")) || null,
    expiresAt: Number(localStorage.getItem("expiresAt")) || null,
  };
}

function saveSession(data, emailFallback) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("expiresAt", String(data.expiresAt));
  localStorage.setItem("warningAt", String(data.warningAt));
  if (data.email !== undefined) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name || (emailFallback ?? data.email).split("@")[0],
      })
    );
  }
}

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  saveSession(data, email);
  notifyAuthChanged();
  return data;
}

export async function register({ name, email, password }) {
  const { data } = await api.post("/auth/register", { name, email, password });
  saveSession(data, email);
  notifyAuthChanged();
  return data;
}

export async function refresh() {
  const { data } = await api.post("/auth/refresh");
  localStorage.setItem("token", data.token);
  localStorage.setItem("expiresAt", String(data.expiresAt));
  localStorage.setItem("warningAt", String(data.warningAt));
  notifyAuthChanged();
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // token may already be invalid — proceed with local cleanup
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("expiresAt");
  localStorage.removeItem("warningAt");
  notifyAuthChanged();
}
