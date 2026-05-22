import axiosClient from "./axiosClient";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  currency: string;
}

export interface UserStats {
  totalAccounts: number;
  memberSince: string;
}

export const getProfileApi = () => axiosClient.get<UserProfile>("/users/me");

export const updateProfileApi = (data: {
  fullName: string;
  currency: string;
}) => axiosClient.put<UserProfile>("/users/me", data);

export const changePasswordApi = (data: {
  currentPassword: string;
  newPassword: string;
}) => axiosClient.put("/users/me/password", data);

export const getUserStatsApi = () =>
  axiosClient.get<UserStats>("/users/me/stats");
