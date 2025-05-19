import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './AdminRolePermissions.module.css';
import { useAuth } from '../../../contexts/AuthContext';

const AdminRolePermissions = () => {
    const [roles, setRoles] = useState([]);
    const [allSystemPermissions, setAllSystemPermissions] = useState([]);
    const [selectedRoleName, setSelectedRoleName] = useState('');
    const [currentRolePermissions, setCurrentRolePermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const token = localStorage.getItem('token');

    const { user, hasPermission, isLoadingAuth, fetchUserData: fetchAuthUserData } = useAuth(); // Renamed to avoid conflict
    const navigate = useNavigate();

    // Permission Check and Redirection
    useEffect(() => {
        if (!isLoadingAuth && !hasPermission('admin', 'managePermissions')) {
            navigate('/dashboard');
        }
    }, [user, hasPermission, isLoadingAuth, navigate]);

    // Fetch all roles and all defined system permissions
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');
        if (!token) {
            setError("Authentication required.");
            setIsLoading(false);
            return;
        }
        try {
            const [rolesRes, systemPermsRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/admin/roles`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${process.env.REACT_APP_API_URL}/api/admin/permissions-list`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRoles(rolesRes.data || []);
            setAllSystemPermissions(systemPermsRes.data || []);

        } catch (err) {
            console.error("Fel vid hämtning av administratörsdata:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Misslyckades med att hämta administratörsdata.");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // When a role is selected from the dropdown OR roles data changes (for initial load from localStorage)
    useEffect(() => {
        let roleToSetPermissionsFor = selectedRoleName;

        // If selectedRoleName is not yet set but we have a saved one and roles are loaded
        if (!selectedRoleName && roles.length > 0) {
            const savedRoleNameFromStorage = localStorage.getItem('selectedRoleName');
            if (savedRoleNameFromStorage && roles.some(r => r.name === savedRoleNameFromStorage)) {
                setSelectedRoleName(savedRoleNameFromStorage); // Set it, which will trigger this effect again
                roleToSetPermissionsFor = savedRoleNameFromStorage; // Use it for this run
            } else if (savedRoleNameFromStorage) {
                // Saved role no longer valid, clear it
                localStorage.removeItem('selectedRoleName');
            }
        }
        
        if (roleToSetPermissionsFor && roles.length > 0) {
            const role = roles.find(r => r.name === roleToSetPermissionsFor);
            setCurrentRolePermissions(role ? role.permissions || [] : []);
        } else if (!roleToSetPermissionsFor) { // If no role is selected (e.g. "-- Välj en roll --")
            setCurrentRolePermissions([]);
        }
    }, [selectedRoleName, roles]); // Reacts to changes in selected role or when roles data arrives


    const handleRoleSelectChange = (e) => {
        const roleName = e.target.value;
        setSelectedRoleName(roleName); // This will trigger the useEffect above to update permissions
        localStorage.setItem('selectedRoleName', roleName);
        setSuccessMessage('');
        setError(null);
    };

    // When a permission checkbox is toggled
    const handlePermissionToggle = (permissionString) => {
        setCurrentRolePermissions(prevPermissions =>
            prevPermissions.includes(permissionString)
                ? prevPermissions.filter(p => p !== permissionString)
                : [...prevPermissions, permissionString]
        );
        setSuccessMessage('');
    };

    // Save changes for the selected role
    const handleSaveChanges = async () => {
        if (!selectedRoleName) {
            setError("Välj en roll för att uppdatera.");
            return;
        }
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/admin/roles/${selectedRoleName}/permissions`,
                { permissions: currentRolePermissions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSuccessMessage(`Behörigheter för rollen '${selectedRoleName}' uppdaterades framgångsrikt!`);
            
            // Re-fetch all roles and permissions data to ensure UI consistency
            await fetchData(); 
            
            // Also re-fetch the current user's data in case their own permissions changed
            // and they are editing a role that affects them.
            if (fetchAuthUserData) { // Check if the function from useAuth is available
                await fetchAuthUserData();
            }

        } catch (err) {
            console.error("Fel vid sparande av behörigheter:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Misslyckades med att spara behörigheter.");
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoadingAuth || isLoading) { // Consider both loading states
        return <div className={styles.loading}>Laddar administratörsdata...</div>;
    }
    
    // Group permissions by resource (moved after loading check)
    const groupedPermissions = allSystemPermissions.reduce((acc, perm) => {
        const [resource, action] = perm.split(':');
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push({ action, fullString: perm });
        return acc;
    }, {});

    // User check should ideally happen after isLoadingAuth is false
    if (!isLoadingAuth && !user) { // If auth is done loading and still no user
        // This might indicate an issue, or the user is simply not logged in.
        // Depending on your app's flow, you might redirect to login or show a message.
        // For an admin page, a redirect is common if not authenticated.
        // navigate('/login'); // Example
        return <p>Åtkomst nekad eller sessionen har gått ut.</p>; // Or a more specific message
    }


    return (
        <div className={styles.adminPermissionsContainer}>
            <h2>Hantera Rollbehörigheter</h2>
            {error && <p className={styles.errorMessage}>{error}</p>}
            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
            <div className={styles.roleSelector}>
                <label htmlFor="roleSelect">Välj en Roll att redigera: </label>
                <select id="roleSelect" onChange={handleRoleSelectChange} value={selectedRoleName} className={styles.roleSelect}>
                    <option value="">-- Välj en roll --</option>
                    {roles.map(role => (
                        <option key={role._id || role.name} value={role.name}>
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
            {selectedRoleName && (
                <div className={styles.permissionsEditor}>
                    <h3>Behörigheter för '{selectedRoleName}'</h3>
                    {selectedRoleName === 'admin' && (
                        <p className={styles.adminNote}>Administratörsrollen kan inte ändras via detta gränssnitt.</p>
                    )}
                    <div className={styles.permissionsGrid}>
                        {Object.entries(groupedPermissions).map(([resource, actions]) => (
                            <div key={resource} className={styles.resourceGroup}>
                                <h4 className={styles.resourceTitle}>{resource.charAt(0).toUpperCase() + resource.slice(1)}</h4>
                                {actions.sort((a,b) => a.action.localeCompare(b.action)).map(permObj => (
                                    <div key={permObj.fullString} className={styles.permissionItem}>
                                        <label htmlFor={permObj.fullString}>
                                            <input
                                                type="checkbox"
                                                id={permObj.fullString}
                                                checked={currentRolePermissions.includes(permObj.fullString)}
                                                onChange={() => handlePermissionToggle(permObj.fullString)}
                                                disabled={isSaving || selectedRoleName === 'admin'}
                                                className={styles.permissionCheckbox}
                                            />
                                            {permObj.action}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleSaveChanges}
                        className={styles.saveButton}
                        disabled={isSaving || selectedRoleName === 'admin'}
                    >
                        {isSaving ? 'Sparar...' : `Spara behörigheter för ${selectedRoleName}`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminRolePermissions;