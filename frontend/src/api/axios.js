import axios from "axios";

// Generate or retrieve a device identifier
let deviceId = localStorage.getItem("lms_device_id");
if (!deviceId) {
  deviceId = "device_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem("lms_device_id", deviceId);
}

const getBaseURL = () => {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:3000/api";
  }
  return import.meta.env.VITE_API_URL || "https://lms-4kly.vercel.app/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Client-side fast memory cache for GET requests
const clientCache = new Map();
const CACHE_TTL_MS = 25000; // 25 seconds client-side cache

// Expose cache clearing for explicit refresh
api.clearCache = () => {
  clientCache.clear();
};

// Request interceptor: attach token & deviceId + serve from cache for fast re-opens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("lms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Device-Id"] = deviceId;

    const method = (config.method || "get").toLowerCase();

    // Any mutation (POST, PUT, DELETE, PATCH) immediately invalidates the entire cache
    if (method !== "get") {
      clientCache.clear();
      return config;
    }

    // For GET requests, check if fresh cached data exists
    if (!config.noCache) {
      const cacheKey = `${config.baseURL || ""}${config.url || ""}?${JSON.stringify(config.params || {})}`;
      const cached = clientCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        // Return instantly via custom adapter without network roundtrip
        config.adapter = () => {
          return Promise.resolve({
            data: JSON.parse(JSON.stringify(cached.data)),
            status: 200,
            statusText: "OK (Cached)",
            headers: cached.headers,
            config,
            request: {},
          });
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: cache GET responses & handle auth failures
api.interceptors.response.use(
  (response) => {
    const method = (response.config.method || "get").toLowerCase();
    if (method === "get" && !response.config.noCache && response.status === 200) {
      const cacheKey = `${response.config.baseURL || ""}${response.config.url || ""}?${JSON.stringify(response.config.params || {})}`;
      clientCache.set(cacheKey, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isDeviceLoggedOut = error.response.data?.code === "DEVICE_LOGGED_OUT";
      clientCache.clear();
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