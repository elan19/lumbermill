import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Views/Home/Home';
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
import NewKantList from './Views/Dashboard/Kantlista/new-Kantlista';
import DeliveredOrderList from './Views/Dashboard/Orders/DeliveredOrder';
import DeliveredOrderDetails from './Views/Dashboard/Orders/DeliveredOrderDetails';
import ProtectedRoute from './Components/Routes/ProtectedRoute'; // Import the ProtectedRoute component

function App() {
  return (
    <Router>
      <Header />
      <div className="mainContent">
        <Routes>
          {/* Redirect from '/' to '/login' */}
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login />} />

          {/* Protect dashboard routes */}
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
            <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="prilista" element={<ProtectedRoute><Prilista /></ProtectedRoute>} />
            <Route path="new-prilista" element={<ProtectedRoute><NewPrilista /></ProtectedRoute>} />
            <Route path="new-order" element={<ProtectedRoute><NewOrder /></ProtectedRoute>} />
            <Route path="order-detail/:orderNumber" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="edit-order/:orderNumber" element={<ProtectedRoute><EditOrder /></ProtectedRoute>} />
            <Route path="lagerplats" element={<ProtectedRoute><Lagerplats /></ProtectedRoute>} />
            <Route path="kantlista" element={<ProtectedRoute><KantList /></ProtectedRoute>} />
            <Route path="new-kantlista" element={<ProtectedRoute><NewKantList /></ProtectedRoute>} />
            <Route path="delivered" element={<ProtectedRoute><DeliveredOrderList /></ProtectedRoute>} />
            <Route path="delivered/order-detail/:orderNumber" element={<ProtectedRoute><DeliveredOrderDetails /></ProtectedRoute>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
