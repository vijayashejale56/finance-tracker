import axiosClient from "./axiosClient";

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: "SAFE" | "WARNING" | "EXCEEDED";
  month: number;
  year: number;
}

export interface BudgetRequest {
  category: string;
  limitAmount: number;
  month: number;
  year: number;
}

export interface BudgetSummary {
  totalBudgets: number;
  exceededCount: number;
  warningCount: number;
  safeCount: number;
  budgets: Budget[];
}

export const getBudgetsApi = () =>
  axiosClient.get<{ data: Budget[] }>("/budgets");

export const getBudgetSummaryApi = () =>
  axiosClient.get<{ data: BudgetSummary }>("/budgets/summary");

export const createBudgetApi = (data: BudgetRequest) =>
  axiosClient.post<{ data: Budget }>("/budgets", data);

export const updateBudgetApi = (id: string, data: BudgetRequest) =>
  axiosClient.put<{ data: Budget }>(`/budgets/${id}`, data);

export const deleteBudgetApi = (id: string) =>
  axiosClient.delete(`/budgets/${id}`);
