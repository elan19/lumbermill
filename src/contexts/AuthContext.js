// AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Function to fetch user data.
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);  // <-- Update the user
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null); // Set to null on error
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();  // Initial fetch when the component mounts.
  }, [fetchUserData]);

  const hasPermission = (resource, action) => {
    if (!user || !user.role) return false;
    if (user.role === 'admin') return true; // Admins have all permissions

    const requiredPermission = `${resource}:${action}`;
    return user.permissions && user.permissions.includes(requiredPermission);
  };

  const value = {
    user,
    hasPermission,
    isLoadingAuth,
    fetchUserData,  // Expose the refetch function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;