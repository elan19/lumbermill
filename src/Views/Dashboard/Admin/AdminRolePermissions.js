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

    const { user, hasPermission, isLoadingAuth } = useAuth();
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

      // Load selected role from localStorage on component mount
    useEffect(() => {
        const savedRole = localStorage.getItem('selectedRoleName');
        if (savedRole) {
            setSelectedRoleName(savedRole);
            // Optionally, load the permissions for the saved role immediately
            const role = roles.find(r => r.name === savedRole);
            setCurrentRolePermissions(role ? role.permissions || [] : []);
        }
    }, [roles]); // Re-run when roles change, to update if a new role is added.

    // When a role is selected from the dropdown
    const handleRoleSelectChange = (e) => {
        const roleName = e.target.value;
        setSelectedRoleName(roleName);
        localStorage.setItem('selectedRoleName', roleName); // <-- Save to localStorage
        setSuccessMessage(''); // Clear messages on role change
        setError(null);

        if (roleName) {
            const role = roles.find(r => r.name === roleName);
        } else {
            setCurrentRolePermissions([]); // Clear permissions if no role selected
        }
    };

    // When a permission checkbox is toggled
    const handlePermissionToggle = (permissionString) => {
        setCurrentRolePermissions(prevPermissions =>
            prevPermissions.includes(permissionString)
                ? prevPermissions.filter(p => p !== permissionString) // Remove permission
                : [...prevPermissions, permissionString] // Add permission
        );
        setSuccessMessage(''); // Clear message on change
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
                { permissions: currentRolePermissions }, // Send the array of permission strings
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Re-fetch roles to update the main roles list with new permissions
            await fetchData();  // Refetch the roles list
            // Reselect the role to refresh displayed permissions if fetchData doesn't do it
            const updatedRole = roles.find(r => r.name === selectedRoleName);
            if(updatedRole) setCurrentRolePermissions(updatedRole.permissions || []);

            setSuccessMessage(`Behörigheter för rollen '${selectedRoleName}' uppdaterades framgångsrikt!`);

            // *** Call fetchUserData here to update the user data and permissions ***
            // After saving permissions, refresh the data.
             //  fetchData();

        } catch (err) {
            console.error("Fel vid sparande av behörigheter:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Misslyckades med att spara behörigheter.");
        } finally {
            setIsSaving(false);
            // The user should stay on the current page if the permissions are updated.
        }
    };

    if (isLoading) {
        return <div className={styles.loading}>Laddar administratörsdata...</div>;
    }

    // Group permissions by resource for better display
    const groupedPermissions = allSystemPermissions.reduce((acc, perm) => {
        const [resource, action] = perm.split(':');
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push({ action, fullString: perm });
        return acc;
    }, {});

    if (!user) {
        return null;
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