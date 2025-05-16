import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css'; // Make sure this CSS exists

function SettingsPage() {
    // Website design state
    const [currentDesign, setCurrentDesign] = useState('');
    const [selectedDesign, setSelectedDesign] = useState('');
    // Order design state <-- ADDED
    const [currentOrderDesign, setCurrentOrderDesign] = useState('');
    const [selectedOrderDesign, setSelectedOrderDesign] = useState('');

    const [currentFontSize, setCurrentFontSize] = useState(16);
    const [selectedFontSize, setSelectedFontSize] = useState(16);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        if (!token) {
            setError('Authentication required. Inloggning krävs.');
            setIsLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/settings`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Logga in igen!');
                }
                throw new Error(`Failed to fetch settings (${response.status})`);
            }

            const data = await response.json();

            // Set Website Design
            setCurrentDesign(data.design || 'new');
            setSelectedDesign(data.design || 'new');

            // Set Order Design
            setCurrentOrderDesign(data.orderDesign || 'new');
            setSelectedOrderDesign(data.orderDesign || 'new');

            // --- SET FONT SIZE ---
            setCurrentFontSize(data.fontSize || 16); // Use schema default if not present
            setSelectedFontSize(data.fontSize || 16); // Initialize selection
            // --- END SET FONT SIZE ---

        } catch (err) {
            console.error("Error fetching settings:", err);
            setError(err.message);
            if (err.message.includes('Authentication failed')) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Handle selection changes
    const handleDesignChange = (event) => {
        setSelectedDesign(event.target.value);
        setSuccessMessage(''); setError(null);
    };
    // <-- ADDED handler for order design -->
    const handleOrderDesignChange = (event) => {
        setSelectedOrderDesign(event.target.value);
        setSuccessMessage(''); setError(null);
    };

    const handleFontSizeChange = (event) => {
        const value = parseInt(event.target.value, 10); // Ensure it's a number
        // Optional: Add client-side validation for min/max here if desired // Only update if it's a valid number
        setSelectedFontSize(value);
        setSuccessMessage(''); setError(null); // Clear messages on change
    };

    // Handle saving settings
    const handleSaveSettings = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        if (!token) { /* ... no change ... */ }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // Send BOTH settings in the body <-- MODIFIED
                body: JSON.stringify({
                    design: selectedDesign,
                    orderDesign: selectedOrderDesign,
                    fontSize: selectedFontSize
                }),
            });

            if (!response.ok) { /* ... no change ... */ }

            const updatedSettings = await response.json();

            // Update local state for both settings
            setCurrentDesign(updatedSettings.design);
            setSelectedDesign(updatedSettings.design);
            setCurrentOrderDesign(updatedSettings.orderDesign);
            setSelectedOrderDesign(updatedSettings.orderDesign);
            setCurrentFontSize(updatedSettings.fontSize);
            setSelectedFontSize(updatedSettings.fontSize);

            setSuccessMessage('Inställningar sparade! Sidan laddas om...'); // Updated success message

            // --- RELOAD THE SITE AFTER 1.5 SECONDS ---
            setTimeout(() => {
                window.location.reload(); // Reloads the current page
            }, 1500);

        } catch (err) { /* ... no change ... */ }
        finally {
            setIsSaving(false);
        }
    };

    if (isLoading) { /* ... no change ... */ }

    // Check if anything actually changed before enabling save
    const hasChanges = selectedDesign !== currentDesign || selectedOrderDesign !== currentOrderDesign || selectedFontSize !== currentFontSize;

    return (
        <div className="settings-page-container">
            <h2>Inställningar</h2>

            {error && <p className="settings-error">Fel: {error}</p>}
            {successMessage && <p className="settings-success">{successMessage}</p>}

            <form onSubmit={handleSaveSettings} className="settings-form">


                {/* Order Design Fieldset <-- ADDED --> */}
                <fieldset className="settings-fieldset">
                    <legend>Orderformulär Design</legend>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="orderDesign" // Use different name attribute
                                value="new"
                                checked={selectedOrderDesign === 'new'}
                                onChange={handleOrderDesignChange} // Use specific handler
                                disabled={isSaving}
                            />
                            Nytt utseende
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="orderDesign"
                                value="old"
                                checked={selectedOrderDesign === 'old'}
                                onChange={handleOrderDesignChange}
                                disabled={isSaving}
                            />
                            Gammalt utseende
                        </label>
                    </div>
                </fieldset>

                {/* --- FONT SIZE FIELDSET --- ADD THIS --- */}
                <fieldset className="settings-fieldset">
                    <legend>Textstorlek (Text)</legend>
                    <div className="font-size-input-group"> {/* You might want a specific class */}
                        <label htmlFor="fontSize" className="font-size-label">Välj storlek (standard 16):</label>
                        <input
                            type="number"
                            id="fontSize"
                            name="fontSize"
                            value={selectedFontSize}
                            onChange={handleFontSizeChange}
                            min="8"  // Corresponds to backend/schema validation
                            max="40"  // Corresponds to backend/schema validation
                            disabled={isSaving}
                            className="font-size-input" // Add class for styling
                        />
                        <span className="font-size-preview" style={{ fontSize: `${selectedFontSize}px` }}>
                            Förhandsgranskning text
                        </span>
                    </div>
                </fieldset>
                {/* --- END FONT SIZE FIELDSET --- */}

                {/* Add other settings sections here */}

                <button
                    type="submit"
                    className="save-settings-button"
                    // Disable if saving OR if nothing has changed
                    disabled={isSaving || !hasChanges}
                >
                    {isSaving ? 'Sparar...' : 'Spara ändringar'}
                </button>
            </form>
        </div>
    );
}

export default SettingsPage;