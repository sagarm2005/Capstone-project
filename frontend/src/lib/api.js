const BASE_URL = "/api";

function getHeaders() {
  const token = localStorage.getItem("medicore_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getAuthHeaders() {
  const token = localStorage.getItem("medicore_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleExpiredToken(message = "") {
  const lower = (message || "").toLowerCase();
  const isExpired =
    lower.includes("expired") ||
    lower.includes("token has expired") ||
    lower.includes("token is expired") ||
    lower.includes("signature has expired") ||
    lower.includes("invalid token") ||
    lower.includes("invalid crypto padding") ||
    lower.includes("unauthorized");

  if (isExpired) {
    localStorage.removeItem("medicore_token");
    localStorage.removeItem("medicore_user");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("medicore:auth_expired"));
    }
    return true;
  }
  return false;
}

async function request(method, path, body) {
  const hadToken = !!localStorage.getItem("medicore_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.error || errorBody.msg || errorBody.message || `HTTP ${res.status}`;

    if (res.status === 401 || res.status === 422) {
      const wasExpired = handleExpiredToken(message);
      // If token was expired and request included a token, retry once anonymously
      if (wasExpired && hadToken) {
        try {
          const retryRes = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: { "Content-Type": "application/json" },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          });
          if (retryRes.ok) {
            return retryRes.json();
          }
        } catch (_) {}
      }
    }

    throw new Error(message);
  }
  return res.json();
}

async function upload(path, formData) {
  const hadToken = !!localStorage.getItem("medicore_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.error || errorBody.msg || errorBody.message || `HTTP ${res.status}`;

    if (res.status === 401 || res.status === 422) {
      const wasExpired = handleExpiredToken(message);
      if (wasExpired && hadToken) {
        try {
          const retryRes = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            body: formData,
          });
          if (retryRes.ok) {
            return retryRes.json();
          }
        } catch (_) {}
      }
    }

    throw new Error(message);
  }
  return res.json();
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
  upload,
};
