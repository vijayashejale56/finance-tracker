import axiosClient from "./axiosClient";

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  currency: string;
  category: string;
  description: string;
  transactionDate: string;
  status: string;
  createdAt: string;
}

export interface TransactionRequest {
  accountId: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  transactionDate: string;
  transferToAccountId?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  savings: number;
}

// ← Updated with new filter params
export interface TransactionFilters {
  page?: number;
  size?: number;
  type?: string;
  category?: string;
  accountId?: string;
  from?: string;
  to?: string;
  keyword?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortDir?: string;
}

export const getTransactionsApi = (params?: Record<string, string | number>) =>
  axiosClient.get<PageResponse<Transaction>>("/transactions", { params });

export const createTransactionApi = (data: TransactionRequest) =>
  axiosClient.post<Transaction>("/transactions", data);

export const deleteTransactionApi = (id: string) =>
  axiosClient.delete(`/transactions/${id}`);

export const getMonthlySummaryApi = () =>
  axiosClient.get<MonthlySummary>("/transactions/monthly-summary");

export interface CategorySpending {
  category: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export const getSpendingByCategoryApi = (from?: string, to?: string) =>
  axiosClient.get<CategorySpending[]>("/transactions/spending-by-category", {
    params: { ...(from && { from }), ...(to && { to }) },
  });

export const getMonthlyTrendApi = () =>
  axiosClient.get<MonthlyTrend[]>("/transactions/monthly-trend");

export const exportToCsvApi = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  return axiosClient.get(`/export/csv${query ? "?" + query : ""}`, {
    responseType: "blob",
  });
};

export const exportToPdfApi = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  return axiosClient.get(`/export/pdf${query ? "?" + query : ""}`, {
    responseType: "blob",
  });
};
