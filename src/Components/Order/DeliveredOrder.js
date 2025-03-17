import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './order.css';

function DeliveredOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [prilistorData, setPrilistorData] = useState({});
  const [kantlistorData, setKantlistorData] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        console.log('Fetched orders:', response.data);
        
        // Filter orders with status = "Delivered"
        const deliveredOrders = response.data.filter(order => order.status === 'Delivered');
        setOrders(deliveredOrders);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleToggleExpand = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    // Check if the prilistor data for this order is already fetched
    if (!prilistorData[orderId]) {
      try {
        const response = await axios.get(`http://localhost:5000/api/prilista/order/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        setPrilistorData(prevData => ({
          ...prevData,
          [orderId]: response.data,
        }));
        console.log('Fetched prilistor data:', response.data);
      } catch (err) {
        console.error('Failed to fetch prilistor data:', err);
        setError('Failed to load prilistor data');
      }
    }

    if (!kantlistorData[orderId]) {
      try {
        const response = await axios.get(`http://localhost:5000/api/kantlista/order/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        setKantlistorData(prevData => ({
          ...prevData,
          [orderId]: response.data,
        }));
        console.log('Fetched kantlistor data:', response.data);
      } catch (err) {
        console.error('Failed to fetch kantlistor data:', err);
        setError('Failed to load kantlistor data');
      }
    }

    setExpandedOrderId(orderId);
  };

  if (loading) {
    return <div className="orderList">Loading orders...</div>;
  }

  if (error) {
    return <div className="orderList error">Error: {error}</div>;
  }

  return (
    <div className="orderList">
      <h2>Levererade Ordrar</h2>
      {orders.length === 0 ? (
        <p>NInga levererade ordrar hittades.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderNumber} className="orderItem">
            <div
              className="orderSummary"
              onClick={() => handleToggleExpand(order.orderNumber)}
            >
              <div className="orderLeft">
                <p>Order nr: {order.orderNumber}</p>
              </div>
              <div className="orderMiddle">
                <h3>Kund: {order.customer}</h3>
                <p>Leveranstid: {order.delivery}</p>
              </div>
              <div className="orderRight">
                <p>Status: {order.status}</p>
              </div>
            </div>
            {expandedOrderId === order.orderNumber && (
              <div className="orderDetails">
                <h4>Prilistor:</h4>
                <ul>
                  {prilistorData[order.orderNumber] && prilistorData[order.orderNumber].length > 0 ? (
                    prilistorData[order.orderNumber].map((prilist, index) => (
                      <li
                        key={index}
                        style={{
                          textDecoration: prilist.completed ? 'line-through' : 'none',
                          color: prilist.completed ? 'gray' : 'black',
                        }}
                      >
                        {`${prilist.quantity} PKT, ${prilist.dimension} MM, ${prilist.description}`}
                      </li>
                    ))
                  ) : (
                    <li>---</li>
                  )}
                </ul>

                <h4>Kantlistor:</h4>
                <ul>
                  {kantlistorData[order.orderNumber] && kantlistorData[order.orderNumber].length > 0 ? (
                    kantlistorData[order.orderNumber].map((kantlista, index) => (
                      <li
                        key={index}
                        style={{
                          textDecoration: kantlista.status.klar && kantlista.status.kapad ? 'line-through' : 'none',
                          color: kantlista.status.klar && kantlista.status.kapad ? 'gray' : 'black',
                        }}
                      >
                        {`${kantlista.antal} PKT - ${kantlista.tjocklek} X ${kantlista.bredd} - ${kantlista.varv}v - ${kantlista.max_langd}m - ${kantlista.stampel} ${kantlista.information}`}
                      </li>
                    ))
                  ) : (
                    <li>---</li>
                  )}
                </ul>
                <div className="orderActions">
                  <button className="orderDetailButtons" onClick={() => navigate(`/dashboard/delivered/order-detail/${order.orderNumber}`)}>Details</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default DeliveredOrderList;
