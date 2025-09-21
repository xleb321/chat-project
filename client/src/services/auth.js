import api from "./api.js";

export const authService = {
  login: async credentials => {
    const response = await api.post("/login", credentials);
    return response.data;
  },

  register: async userData => {
    const response = await api.post("/register", userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};
