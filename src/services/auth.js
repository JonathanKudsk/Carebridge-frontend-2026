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
        isEmployed: data.isEmployed ?? true,
      })
    );
  }
}

// Returns { requiresTotpSetup, tempToken } or { requires2FA, tempToken } when 2FA is required.
// Otherwise persists full session (token + expiresAt/warningAt + user) and returns the same data.
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  if (data.token) {
    saveSession(data, email);
    notifyAuthChanged();
  }
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

// Step 2a — first-time setup: fetch QR code URI using the SETUP tempToken
export async function setupTotp(tempToken) {
  const { data } = await api.get("/auth/2fa/setup", {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
  return data; // { secret, otpauthUri }
}

function storeFullSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.name,
      isEmployed: data.isEmployed ?? true,
    }),
  );
  notifyAuthChanged();
}

// Step 2b — first-time setup: confirm 6-digit code, receive full 14-day JWT
export async function confirmTotp(tempToken, code) {
  const { data } = await api.post(
    "/auth/2fa/confirm",
    { code },
    { headers: { Authorization: `Bearer ${tempToken}` } },
  );
  storeFullSession(data);
  return data;
}

// Step 2c — returning user: verify 6-digit code, receive full 14-day JWT
export async function verifyTotp(tempToken, code) {
  const { data } = await api.post(
    "/auth/2fa/verify",
    { code },
    { headers: { Authorization: `Bearer ${tempToken}` } },
  );
  storeFullSession(data);
  return data;
}
