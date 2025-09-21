import { useState, useEffect } from "react";
import { authService } from "../services/auth.js";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ id: payload.id, username: payload.username });
      } catch (error) {
        authService.logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async credentials => {
    const data = await authService.login(credentials);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const register = async userData => {
    const data = await authService.register(userData);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: authService.isAuthenticated(),
  };
};
