import axios from "axios";
import { toast } from "../components/ui/Toast";

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const axiosClient = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 second timeout
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Skip token check for auth endpoints
    const isAuthEndpoint = config.url?.includes("/auth/");
    if (isAuthEndpoint) {
      return config;
    }

    if (!token || isTokenExpired(token)) {
      localStorage.clear();
      window.location.href = "/login";
      return config;
    }

    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — backend not running
      toast.error("Cannot connect to server. Is the backend running?");
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status === 401 || status === 403) {
      toast.warning("Session expired. Please login again.");
      localStorage.clear();
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } else if (status === 500) {
      toast.error("Server error. Please try again.");
    } else if (status === 404) {
      toast.error("Resource not found.");
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
