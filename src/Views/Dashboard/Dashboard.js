import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    return (
        <div className={styles.dashboardContainer}>
            <h1>Dashboard</h1>
            <div className={styles.navigation}>
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

            {/* Render the selected section */}
            <div className={styles.content}>
              <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;
