import axiosClient from "./axiosClient";

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface AccountRequest {
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export const getAccountsApi = () => axiosClient.get<Account[]>("/accounts");

export const createAccountApi = (data: AccountRequest) =>
  axiosClient.post<Account>("/accounts", data);

export const deleteAccountApi = (id: string) =>
  axiosClient.delete(`/accounts/${id}`);
