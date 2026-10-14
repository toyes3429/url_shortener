import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  withCredentials: true,
});

let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/auth/register")
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= axiosInstance
          .post("/api/auth/refresh")
          .finally(() => {
            refreshPromise = null;
          });

        await refreshPromise;
        return axiosInstance(originalRequest);
      } catch {
        // The caller receives the original authentication failure.
      }
    }

    return Promise.reject({
      message:
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred",
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default axiosInstance;
