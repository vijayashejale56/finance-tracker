import axiosClient from "./axiosClient";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  fullName: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const registerApi = (data: {
  email: string;
  password: string;
  fullName: string;
}) =>
  axiosClient.post<{ success: boolean; data: AuthResponse }>(
    "/auth/register",
    data,
  );

export const loginApi = (data: { email: string; password: string }) =>
  axiosClient.post<{ success: boolean; data: AuthResponse }>(
    "/auth/login",
    data,
  );

export const refreshTokenApi = (refreshToken: string) =>
  axiosClient.post<{ data: RefreshTokenResponse }>("/auth/refresh", {
    refreshToken,
  });

export const logoutApi = (refreshToken: string) =>
  axiosClient.post("/auth/logout", { refreshToken });

// import axiosClient from "./axiosClient";

// export interface AuthResponse {
//   token: string;
//   email: string;
//   fullName: string;
// }

// export const registerApi = (data: {
//   email: string;
//   password: string;
//   fullName: string;
// }) => axiosClient.post<AuthResponse>("/auth/register", data);

// export const loginApi = (data: { email: string; password: string }) =>
//   axiosClient.post<AuthResponse>("/auth/login", data);
