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

        if (!token) { /* ... no change ... */ }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/settings`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) { /* ... no change ... */ }

            const data = await response.json();
            console.log("Fetched settings:", data); // Log fetched data

            // Set Website Design
            setCurrentDesign(data.design || 'new');
            setSelectedDesign(data.design || 'new');

            // Set Order Design <-- ADDED
            setCurrentOrderDesign(data.orderDesign || 'new');
            setSelectedOrderDesign(data.orderDesign || 'new');

        } catch (err) { /* ... no change ... */ }
        finally {
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
                    orderDesign: selectedOrderDesign
                }),
            });

            if (!response.ok) { /* ... no change ... */ }

            const updatedSettings = await response.json();

            // Update local state for both settings <-- MODIFIED
            setCurrentDesign(updatedSettings.design);
            setSelectedDesign(updatedSettings.design);
            setCurrentOrderDesign(updatedSettings.orderDesign);
            setSelectedOrderDesign(updatedSettings.orderDesign);

            setSuccessMessage('Inställningar sparade!');

            // Optional: Trigger global state update or reload if needed
            // window.location.reload();

        } catch (err) { /* ... no change ... */ }
        finally {
            setIsSaving(false);
        }
    };

    if (isLoading) { /* ... no change ... */ }

    // Check if anything actually changed before enabling save
    const hasChanges = selectedDesign !== currentDesign || selectedOrderDesign !== currentOrderDesign;

    return (
        <div className="settings-page-container">
            <h2>Inställningar</h2>

            {error && <p className="settings-error">Fel: {error}</p>}
            {successMessage && <p className="settings-success">{successMessage}</p>}

            <form onSubmit={handleSaveSettings} className="settings-form">
                {/* Website Design Fieldset */}
                <fieldset className="settings-fieldset">
                    <legend>Webbplatsdesign</legend>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input type="radio" name="design" value="new" checked={selectedDesign === 'new'} onChange={handleDesignChange} disabled={isSaving}/>
                            Nytt utseende
                        </label>
                        <label className="radio-label">
                            <input type="radio" name="design" value="old" checked={selectedDesign === 'old'} onChange={handleDesignChange} disabled={isSaving}/>
                            Gammalt utseende
                        </label>
                    </div>
                </fieldset>

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
                            Nytt utseende (Fieldset)
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
                            Gammalt utseende (Enkel)
                        </label>
                    </div>
                </fieldset>

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