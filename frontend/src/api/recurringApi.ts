import axiosClient from "./axiosClient";

export interface RecurringTransaction {
  id: string;
  accountId: string;
  accountName: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  category: string;
  description: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  dayOfMonth?: number;
  nextDueDate: string;
  lastExecutedDate?: string;
  isActive: boolean;
  daysUntilNext: number;
}

export interface RecurringRequest {
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  frequency: string;
  dayOfMonth?: number;
  startDate: string;
}

export const getRecurringApi = () =>
  axiosClient.get<{ data: RecurringTransaction[] }>("/recurring");

export const createRecurringApi = (data: RecurringRequest) =>
  axiosClient.post<{ data: RecurringTransaction }>("/recurring", data);

export const toggleRecurringApi = (id: string) =>
  axiosClient.put<{ data: RecurringTransaction }>(`/recurring/${id}/toggle`);

export const deleteRecurringApi = (id: string) =>
  axiosClient.delete(`/recurring/${id}`);
