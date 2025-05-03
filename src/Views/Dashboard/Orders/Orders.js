import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrderList from '../../../Components/Order/OrderList';
import OrderDetail from '../../../Components/Order/OrderDetail';

import styles from './Orders.module.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');

        // Check if token exists
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }

        // Make the GET request with the token in Authorization header
        const response = await axios.get(`https://ansvab.osc-fr1.scalingo.io/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add the token in the header
          },
        });

        // Set the orders data from the response
        setOrders(response.data);
      } catch (err) {
        // Handle errors
        setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <OrderList orders={orders} setSelectedOrder={setSelectedOrder} />
      {selectedOrder && <OrderDetail order={selectedOrder} />}
    </div>
  );
};

export default Orders;
