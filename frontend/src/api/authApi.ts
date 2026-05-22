import axiosClient from "./axiosClient";

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
}

export const registerApi = (data: {
  email: string;
  password: string;
  fullName: string;
}) => axiosClient.post<AuthResponse>("/auth/register", data);

export const loginApi = (data: { email: string; password: string }) =>
  axiosClient.post<AuthResponse>("/auth/login", data);
