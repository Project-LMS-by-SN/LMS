import api from "../api/axios";

/**
 * Performs instant client-side logout while notifying the backend
 * in the background with keepalive so navigation is never blocked.
 */
export const performFastLogout = () => {
  try {
    const token = localStorage.getItem("lms_token");
    const deviceId = localStorage.getItem("lms_device_id") || "";
    const baseURL = api.defaults.baseURL || "";

    if (token && baseURL && typeof fetch === "function") {
      fetch(`${baseURL}/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Device-Id": deviceId,
        },
        body: "{}",
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Ignore errors so logout redirect never stalls
  }

  if (typeof api.clearCache === "function") {
    api.clearCache();
  }
  localStorage.removeItem("lms_token");
  localStorage.removeItem("lms_user");
  window.location.replace("/login");
};
