// src/Components/Routes/ProtectedRoute.js
import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios'; // Assuming you're using axios for API calls

// Helper function to check token expiration
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // to get in seconds
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Invalid token, treat as expired
  }
};

// Helper to get refresh token from cookie
const getRefreshTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'refreshToken') {
            return value;
        }
    }
    return null;
};

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start as false
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize the authentication check and refresh logic
  const verifyAuthAndRefresh = useCallback(async () => {
    let accessToken = localStorage.getItem('token');
    let refreshToken = getRefreshTokenFromCookie(); // Get refresh token from cookie

    // 1. Check current access token
    if (accessToken && !isTokenExpired(accessToken)) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // 2. Access token is expired or missing, try to refresh if refresh token exists
    if (refreshToken) {
      //console.log("ProtectedRoute: Access token expired/missing. Attempting refresh...");
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/auth/refresh-token`, // Use your actual refresh endpoint
          { refreshToken } // Send the refresh token in the body
          // If your backend expects it as a cookie, ensure 'withCredentials: true' is set here
          // and that your backend handles cookies for this endpoint.
          // For simplicity, this example sends it in the body.
        );

        const newAccessToken = response.data.token;
        if (newAccessToken) {
          localStorage.setItem('token', newAccessToken);
          setIsAuthenticated(true);
        } else {
          // Refresh successful but no new token (should not happen with a good backend)
          console.warn("ProtectedRoute: Refresh successful but no new token received.");
          localStorage.removeItem('token'); // Ensure old token is gone
          localStorage.removeItem('selectedRoleName')
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("ProtectedRoute: Token refresh failed:", error.response?.data?.message || error.message);
        localStorage.removeItem('token'); // Clear any potentially invalid access token
        // Optionally clear the refresh token cookie if it's definitively invalid
        // document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setIsAuthenticated(false);
      }
    } else {
      // No access token and no refresh token
      //console.log("ProtectedRoute: No access or refresh token found.");
      localStorage.removeItem('token');
      localStorage.removeItem('selectedRoleName')
      setIsAuthenticated(false);
    }

    setIsLoading(false); // Done with checks/refresh attempt
  }, []); // No dependencies that change often, so it runs once like componentDidMount

  useEffect(() => {
    verifyAuthAndRefresh();
  }, [verifyAuthAndRefresh]); // Run the auth check logic

  // Display loading state
  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  // If not authenticated after checks, redirect to login
  if (!isAuthenticated) {
    //console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children (protected content)
  return children;
};

export default ProtectedRoute;