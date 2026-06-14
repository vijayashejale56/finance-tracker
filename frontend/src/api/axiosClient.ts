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
  baseURL: "/api/v1",
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
        const response = await axios.post("/api/v1/auth/refresh", {
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

// import axios from "axios";
// import { toast } from "../components/ui/Toast";

// const isTokenExpired = (token: string): boolean => {
//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     return payload.exp * 1000 < Date.now();
//   } catch {
//     return true;
//   }
// };

// const axiosClient = axios.create({
//   baseURL: "/api/v1",
//   headers: { "Content-Type": "application/json" },
//   timeout: 10000, // 10 second timeout
// });

// axiosClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     // Skip token check for auth endpoints
//     const isAuthEndpoint = config.url?.includes("/auth/");
//     if (isAuthEndpoint) {
//       return config;
//     }

//     if (!token || isTokenExpired(token)) {
//       localStorage.clear();
//       window.location.href = "/login";
//       return config;
//     }

//     config.headers["Authorization"] = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // axiosClient.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (!error.response) {
// //       // Network error — backend not running
// //       toast.error("Cannot connect to server. Is the backend running?");
// //       return Promise.reject(error);
// //     }

// //     const status = error.response?.status;

// //     if (status === 401 || status === 403) {
// //       toast.warning("Session expired. Please login again.");
// //       localStorage.clear();
// //       setTimeout(() => {
// //         window.location.href = "/login";
// //       }, 1500);
// //     } else if (status === 500) {
// //       toast.error("Server error. Please try again.");
// //     } else if (status === 404) {
// //       toast.error("Resource not found.");
// //     }

// //     return Promise.reject(error);
// //   },
// // );

// axiosClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (!error.response) {
//       toast.error("Cannot connect to server. Is the backend running?");
//       return Promise.reject(error);
//     }

//     const status = error.response?.status;
//     const data = error.response?.data;

//     // Use our consistent error format
//     const message = data?.message || "Something went wrong";
//     const code = data?.code || "UNKNOWN_ERROR";

//     if (status === 401) {
//       if (code === "INVALID_CREDENTIALS") {
//         // Don't redirect — let login page handle this
//         return Promise.reject(error);
//       }
//       localStorage.clear();
//       window.location.href = "/login";
//     } else if (status === 403) {
//       toast.warning("Session expired. Please login again.");
//       localStorage.clear();
//       setTimeout(() => {
//         window.location.href = "/login";
//       }, 1500);
//     } else if (status === 404) {
//       toast.error(message);
//     } else if (status === 400) {
//       // Validation errors handled by individual forms
//       return Promise.reject(error);
//     } else if (status === 500) {
//       toast.error("Server error. Please try again later.");
//     }

//     return Promise.reject(error);
//   },
// );

// export default axiosClient;
