// src/contexts/SettingsContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(16); // Default font size
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (token) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFontSize(response.data?.fontSize || 16); // Use fetched or default
        } catch (error) {
          console.error("Failed to fetch user settings for context:", error);
          // Keep default font size on error
        }
      }
      setIsLoadingSettings(false);
    };

    fetchUserSettings();
  }, [token]); // Re-fetch if token changes (e.g., on login/logout)

  // Function to update font size (e.g., after user changes it on settings page)
  const updateFontSize = (newSize) => {
      setFontSize(newSize);
  };

  return (
    <SettingsContext.Provider value={{ fontSize, updateFontSize, isLoadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};