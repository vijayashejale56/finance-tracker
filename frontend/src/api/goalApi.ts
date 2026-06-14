import axiosClient from "./axiosClient";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentageComplete: number;
  deadline: string;
  daysRemaining: number;
  monthsRemaining: number;
  monthlyRequired: number;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  trackingStatus: "ON_TRACK" | "BEHIND" | "COMPLETED";
  notes?: string;
  linkedAccountId?: string;
  linkedAccountName?: string;
}

export interface GoalRequest {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: string;
  linkedAccountId?: string;
  notes?: string;
}

export interface GoalSummary {
  total: number;
  completed: number;
  onTrack: number;
  behind: number;
  goals: Goal[];
}

export const getGoalsApi = () => axiosClient.get<{ data: Goal[] }>("/goals");

export const getGoalSummaryApi = () =>
  axiosClient.get<{ data: GoalSummary }>("/goals/summary");

export const createGoalApi = (data: GoalRequest) =>
  axiosClient.post<{ data: Goal }>("/goals", data);

export const updateGoalApi = (id: string, data: GoalRequest) =>
  axiosClient.put<{ data: Goal }>(`/goals/${id}`, data);

export const contributeToGoalApi = (id: string, amount: number) =>
  axiosClient.put<{ data: Goal }>(`/goals/${id}/contribute`, { amount });

export const deleteGoalApi = (id: string) => axiosClient.delete(`/goals/${id}`);
