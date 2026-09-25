import axios from "axios";

// Generate or retrieve a device identifier
let deviceId = localStorage.getItem("lms_device_id");
if (!deviceId) {
  deviceId = "device_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem("lms_device_id", deviceId);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Request interceptor to attach Authorization token and X-Device-Id
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("lms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Device-Id"] = deviceId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isDeviceLoggedOut = error.response.data?.code === "DEVICE_LOGGED_OUT";
      // Clear storage and redirect if token invalid/expired
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");
      if (window.location.pathname !== "/login") {
        if (isDeviceLoggedOut) {
          window.location.href = "/login?reason=logged_out";
        } else {
          window.location.href = "/login";
        }
      }
    } else if (error.response && error.response.status === 403 && error.response.data?.mustChangePassword) {
      if (window.location.pathname !== "/change-password") {
        window.location.href = "/change-password";
      }
    }
    return Promise.reject(error);
  }
);

export default api;