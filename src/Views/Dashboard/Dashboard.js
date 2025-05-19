import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { useAuth } from '../../contexts/AuthContext'; // Assuming AuthContext.js is in the same folder or import relatively

const Dashboard = () => {
    // Use the custom useAuth hook
    const { user, isLoadingAuth } = useAuth();

    let displayName = '';

    if (isLoadingAuth) {
        displayName = 'Laddar...';
    } else if (user) {
        // *** ADJUST THE PROPERTY ACCESS HERE BASED ON YOUR USER OBJECT ***
        if (user.name) { // If your API returns { ..., name: "User Name", ... }
            displayName = user.name;
        } else if (user.username) { // Fallback if API returns { ..., username: "user_name", ... }
            displayName = user.username;
        } else if (user.email) { // Another fallback
            displayName = user.email;
        } else if (user.profile && user.profile.firstName) { // If name is nested
             displayName = `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
        } else {
            displayName = 'Användare'; // Generic fallback if no specific name field is found
        }
    } else {
        displayName = 'Gäst'; // If user is null (not logged in or error fetching)
    }

    return (
        <div className={styles.dashboardContainer}>
            <h1>Dashboard - {displayName}</h1>

            <div className={styles.navigation}>
              {/* ... your Link components ... */}
              <Link to="/dashboard/prilista" className={styles.navLink}>
                PRILISTA
              </Link>
              <Link to="/dashboard/orders" className={styles.navLink}>
                ORDRAR
              </Link>
              <Link to="/dashboard/kantlista" className={styles.navLink}>
                KANTLISTA
              </Link>
              <Link to="/dashboard/klupplista" className={styles.navLink}>
                KLUPPLISTA
              </Link>
              <Link to="/dashboard/lagerplats" className={styles.navLink}>
                LAGERPLATS
              </Link>
              <Link to="/dashboard/delivered" className={styles.navLink}>
                LEVERERAT
              </Link>
            </div>

            <div className={styles.content}>
              <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;