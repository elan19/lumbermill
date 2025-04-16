import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    // Add more robust checks if needed (e.g., token expiry validation)
    return !!token; // Returns true if token exists, false otherwise
  };

  const location = useLocation(); // Get the current location
  const isAuth = checkAuth();

  // Check if the token exists in localStorage or cookies
  const token = localStorage.getItem('token'); // or from cookies if that's where you store it
  const refreshToken = document.cookie.split(';').find(cookie => cookie.startsWith('refreshToken='));

  // Function to refresh the access token using the refresh token
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(
        '/api/auth/refresh', 
        {},
        { withCredentials: true } // Make sure cookies are sent
      );
      localStorage.setItem('token', response.data.token); // Save the new token
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false); // If refresh fails, consider the user logged out
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token && refreshToken) {
      refreshAccessToken(); // If no access token but a refresh token exists, refresh the token
    } else {
      setLoading(false);
    }
  }, [token, refreshToken]);

  if (loading) {
    return <div>Loading...</div>; // Display loading state while checking authentication
  }


  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />; // Redirect to login page if not authenticated
  }

  return children; // If authenticated, render the children (protected content)
};

export default ProtectedRoute;
