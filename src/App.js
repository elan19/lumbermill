import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Views/Home/Home';
import About from './Views/About/About';
import Products from './Views/Products/Products';
import ProductDetail from './Views/Products/ProductDetail';
import Contact from './Views/Contact/Contact';
import Policy from './Views/Policy/Policy';
import Information from './Views/Information/Information';
import Settings from './Views/Dashboard/Settings/Settings';

import Login from './Views/Login/Login';
import Header from './Views/Header/Header';
import Footer from './Views/Footer/Footer';
import Dashboard from './Views/Dashboard/Dashboard';
import Orders from './Views/Dashboard/Orders/Orders';
import Prilista from './Views/Dashboard/Prilista/Prilista';
import NewPrilista from './Views/Dashboard/Prilista/new-Prilista';
import NewOrder from './Views/Dashboard/Orders/new-Order';
import OrderDetail from './Views/Dashboard/Orders/Order-detail';
import EditOrder from './Views/Dashboard/Orders/EditOrder';
import Lagerplats from './Views/Dashboard/Lagerplats/LagerplatsView';
import KantList from './Views/Dashboard/Kantlista/Kantlista';
import KluppLista from './Views/Dashboard/Klupplista/Klupplista';
import NewKantList from './Views/Dashboard/Kantlista/new-Kantlista';
import DeliveredOrderList from './Views/Dashboard/Orders/DeliveredOrder';
import DeliveredOrderDetails from './Views/Dashboard/Orders/DeliveredOrderDetails';
import ProtectedRoute from './Components/Routes/ProtectedRoute'; // Import the ProtectedRoute component

import AdminRolePermissions from './Views/Dashboard/Admin/AdminRolePermissions';


import { AuthProvider } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';


function App() {
  const { fontSize, isLoadingSettings } = useSettings();

  useEffect(() => {
    if (!isLoadingSettings) { // Apply only after settings are loaded
      document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
      // Or target body: document.body.style.setProperty('--base-font-size', `${fontSize}px`);
    }
  }, [fontSize, isLoadingSettings]); // Re-apply if fontSize or loading status changes

  if (isLoadingSettings) {
    return <div></div>; // Or your app shell/spinner
  }

  return (
    <AuthProvider>
      <Router>
        {/* Add the main wrapper div */}
        <div className="app-container">
          <Header />

          {/* This existing div remains for content styling */}
          <div className="mainContent">
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:productId" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/information" element={<Information />} />

              {/* --- Protected "Platform" Routes --- */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="admin" // Or your desired path
                  element={
                    <AdminRolePermissions />
                  }
                />
                <Route index element={<Navigate to="orders" replace />} />
                <Route path="orders" element={<Orders />} />
                <Route path="prilista" element={<Prilista />} />
                <Route path="new-prilista" element={<NewPrilista />} />
                <Route path="new-order" element={<NewOrder />} />
                <Route path="order-detail/:orderNumber" element={<OrderDetail />} />
                <Route path="edit-order/:orderNumber" element={<EditOrder />} />
                <Route path="lagerplats" element={<Lagerplats />} />
                <Route path="kantlista" element={<KantList />} />
                <Route path="klupplista" element={<KluppLista />} />
                <Route path="new-kantlista" element={<NewKantList />} />
                <Route path="delivered" element={<DeliveredOrderList />} />
                <Route path="delivered/order-detail/:orderNumber" element={<DeliveredOrderDetails />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<div>Page Not Found (404)</div>} />
            </Routes>
          </div> {/* End mainContent */}

          <Footer />
        </div> {/* Close app-container */}
      </Router>
    </AuthProvider>
  );
}

export default App;
