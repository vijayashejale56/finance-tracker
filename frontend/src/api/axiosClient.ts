import axios from "axios";
import { toast } from "../components/ui/Toast";

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const axiosClient = axios.create({
  // baseURL: "/api/v1",
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Flag to prevent multiple refresh calls at same time
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// REQUEST interceptor — attach access token
axiosClient.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes("/auth/");
    if (isAuthEndpoint) return config;

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE interceptor — handle 401 with silent refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      toast.error("Cannot connect to server. Is the backend running?");
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // If 401 and not already retrying
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      // No refresh token → force logout
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint
        // const response = await axios.post("/api/v1/auth/refresh", {
        //   refreshToken,
        // });
        const baseURL = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/v1`
          : "/api/v1"

        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Save new tokens
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Update auth store
        const { useAuthStore } = await import("../store/authStore");
        useAuthStore
          .getState()
          .updateAccessToken(newAccessToken, newRefreshToken);

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed → force logout
        processQueue(refreshError, null);
        localStorage.clear();
        toast.warning("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (status === 403) {
      toast.warning("Access denied.");
    } else if (status === 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  },
);

export default axiosClient;