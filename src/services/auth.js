import api from "./api";

const AUTH_CHANGED_EVENT = "auth-changed";

export function notifyAuthChanged() {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function onAuthChanged(callback) {
    window.addEventListener(AUTH_CHANGED_EVENT, callback);

    return () =>
        window.removeEventListener(AUTH_CHANGED_EVENT, callback);
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

    localStorage.setItem(
        "user",
        JSON.stringify({
            id: data.id,
            email: data.email,
            role: data.role,
            name:
                data.name ||
                (emailFallback ?? data.email).split("@")[0],
        })
    );

    if (data.expiresAt) {
        localStorage.setItem(
            "expiresAt",
            String(data.expiresAt)
        );
    }

    if (data.warningAt) {
        localStorage.setItem(
            "warningAt",
            String(data.warningAt)
        );
    }

    notifyAuthChanged();
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
        })
    );

    if (data.expiresAt) {
        localStorage.setItem(
            "expiresAt",
            String(data.expiresAt)
        );
    }

    if (data.warningAt) {
        localStorage.setItem(
            "warningAt",
            String(data.warningAt)
        );
    }

    notifyAuthChanged();
}

// LOGIN
// Step 1 — credentials only
export async function login({ email, password }) {
    const { data } = await api.post(
        "/auth/login",
        {
            email,
            password,
        }
    );

    // Hvis backend allerede returnerer token
    if (data.token) {
        storeFullSession(data);
    }

    return data;
}

// REGISTER
export async function register({
                                   name,
                                   email,
                                   password,
                               }) {
    const { data } = await api.post(
        "/auth/register",
        {
            name,
            email,
            password,
        }
    );

    saveSession(data, email);

    return data;
}

// REFRESH TOKEN
export async function refresh() {
    const { data } = await api.post(
        "/auth/refresh"
    );

    localStorage.setItem("token", data.token);
    localStorage.setItem(
        "expiresAt",
        String(data.expiresAt)
    );
    localStorage.setItem(
        "warningAt",
        String(data.warningAt)
    );

    notifyAuthChanged();

    return data;
}

// LOGOUT
export async function logout() {
    try {
        await api.post("/auth/logout");
    } catch {
        // ignore
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("warningAt");

    notifyAuthChanged();
}

// STEP 2A — Setup TOTP
export async function setupTotp(tempToken) {
    const { data } = await api.get(
        "/auth/2fa/setup",
        {
            headers: {
                Authorization: `Bearer ${tempToken}`,
            },
        }
    );

    return data;
}

// STEP 2B — Confirm setup
export async function confirmTotp(
    tempToken,
    code
) {
    const { data } = await api.post(
        "/auth/2fa/confirm",
        { code },
        {
            headers: {
                Authorization: `Bearer ${tempToken}`,
            },
        }
    );

    storeFullSession(data);

    return data;
}

// STEP 2C — Verify login
export async function verifyTotp(
    tempToken,
    code
) {
    const { data } = await api.post(
        "/auth/2fa/verify",
        { code },
        {
            headers: {
                Authorization: `Bearer ${tempToken}`,
            },
        }
    );

    storeFullSession(data);

    return data;
}