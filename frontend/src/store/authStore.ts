import { create } from "zustand";

// Check if token is expired
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Get valid token from localStorage
const getValidToken = (): string | null => {
  const token = localStorage.getItem("token");
  if (isTokenExpired(token)) {
    // Clear expired data immediately on app load
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("fullName");
    return null;
  }
  return token;
};

interface AuthState {
  token: string | null;
  email: string | null;
  fullName: string | null;
  isAuthenticated: boolean;
  login: (token: string, email: string, fullName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // When app loads, check if existing token is still valid
  const validToken = getValidToken();

  return {
    token: validToken,
    email: validToken ? localStorage.getItem("email") : null,
    fullName: validToken ? localStorage.getItem("fullName") : null,
    isAuthenticated: !!validToken,

    login: (token, email, fullName) => {
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("fullName", fullName);
      set({ token, email, fullName, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("fullName");
      set({
        token: null,
        email: null,
        fullName: null,
        isAuthenticated: false,
      });
    },
  };
});
