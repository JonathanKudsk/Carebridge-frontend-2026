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

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  console.log("LOGIN RESPONSE", data);

  // Adjust names if needed, but log first:
  const token = data.token; // if backend sends "token"
  console.log("ABOUT TO SAVE TOKEN", token);

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
    console.log("LOCALSTORAGE AFTER LOGIN", {
      token: localStorage.getItem("token"),
      user: localStorage.getItem("user"),
    });
  } catch (e) {
    console.error("FAILED TO WRITE LOCALSTORAGE", e);
  }

  notifyAuthChanged();
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

export async function setupTotp(_tempToken) {
  throw new Error("Not implemented yet");
}
export async function confirmTotp(_tempToken, _code) {
  throw new Error("Not implemented yet");
}
export async function verifyTotp(_tempToken, _code) {
  throw new Error("Not implemented yet");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  notifyAuthChanged();
}
