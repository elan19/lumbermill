import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css'; // Create this CSS file for styling

function SettingsPage() {
    const [currentDesign, setCurrentDesign] = useState(''); // Store the fetched setting
    const [selectedDesign, setSelectedDesign] = useState(''); // Store the user's selection
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false); // For disabling button during save
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Fetch current settings
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(''); // Clear previous success message

        if (!token) {
            setError('Authentication required. Please log in.');
            setIsLoading(false);
            navigate('/login'); // Redirect if no token
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/settings`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error(`Failed to fetch settings (${response.status})`);
            }

            const data = await response.json();
            setCurrentDesign(data.design || 'new'); // Default to 'new' if missing
            setSelectedDesign(data.design || 'new'); // Initialize selection

        } catch (err) {
            console.error("Error fetching settings:", err);
            setError(err.message);
            if (err.message.includes('Authentication failed')) {
                localStorage.removeItem('token'); // Clear bad token
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]); // Depend on the memoized fetch function

    // Handle selection change
    const handleDesignChange = (event) => {
        setSelectedDesign(event.target.value);
        setSuccessMessage(''); // Clear success message on change
        setError(null); // Clear error on change
    };

    // Handle saving settings
    const handleSaveSettings = async (event) => {
        event.preventDefault(); // Prevent default form submission if wrapped in form
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        if (!token) {
            setError('Authentication required. Please log in.');
            setIsSaving(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/settings`, {
                method: 'PUT', // Use PUT or PATCH to update
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ design: selectedDesign }), // Send selected design
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save settings (${response.status})`);
            }

            const updatedSettings = await response.json();
            setCurrentDesign(updatedSettings.design); // Update current state from response
            setSelectedDesign(updatedSettings.design); // Sync selection
            setSuccessMessage('Inställningar sparade!');

            // Optional: Reload the page or trigger a state update elsewhere
            // if the design change affects the current layout immediately.
            // window.location.reload(); // Force reload (simple approach)
            // Or better: use Context API or Zustand to update global state

        } catch (err) {
            console.error("Error saving settings:", err);
            setError(err.message);
             if (err.message.includes('Authentication failed')) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Conditional Rendering
    if (isLoading) {
        return <p className="settings-loading">Laddar inställningar...</p>;
    }

    return (
        <div className="settings-page-container">
            <h2>Inställningar</h2>

            {error && <p className="settings-error">Fel: {error}</p>}
            {successMessage && <p className="settings-success">{successMessage}</p>}

            <form onSubmit={handleSaveSettings} className="settings-form">
                <fieldset className="settings-fieldset">
                    <legend>Webbplatsdesign</legend>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="design"
                                value="new"
                                checked={selectedDesign === 'new'}
                                onChange={handleDesignChange}
                                disabled={isSaving}
                            />
                            Nytt utseende
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="design"
                                value="old"
                                checked={selectedDesign === 'old'}
                                onChange={handleDesignChange}
                                disabled={isSaving}
                            />
                            Gammalt utseende
                        </label>
                    </div>
                </fieldset>

                {/* Add other settings sections here */}

                <button
                    type="submit"
                    className="save-settings-button"
                    disabled={isSaving || selectedDesign === currentDesign} // Disable if saving or no change
                >
                    {isSaving ? 'Sparar...' : 'Spara ändringar'}
                </button>
            </form>
        </div>
    );
}

export default SettingsPage;