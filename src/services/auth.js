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

// Step 1 — credentials only. Never writes to localStorage.
// Returns { requiresTotpSetup, tempToken } or { requires2FA, tempToken }
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
 
  return data;
}

export async function register({ name, email, password }) {
  const { data } = await api.post("/auth/register", { name, email, password });
  const token = data.token;
  try {
    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name || email.split("@")[0],
      })
    );
  } catch (e) {
    console.error("FAILED TO WRITE LOCALSTORAGE (register)", e);
  }
  notifyAuthChanged();
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  notifyAuthChanged();
}

// Step 2a — first-time setup: fetch QR code URI using the SETUP tempToken
export async function setupTotp(tempToken) {
const { data } = await api.get("/auth/2fa/setup", {
  headers: { Authorization:  `Bearer ${tempToken}` },
  });
  return data; // { secret, otpauthUri }
}

function storeFullSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: data.it,
      email: data.email,
      role: data.role,
      name: data.name,
    })
  );
  notifyAuthChanged();
}