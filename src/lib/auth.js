const KEY = 'repairconnect_user';

export const setCurrentUser = (user) => {
  localStorage.setItem(KEY, JSON.stringify(user));
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearCurrentUser = () => {
  localStorage.removeItem(KEY);
};

export const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;