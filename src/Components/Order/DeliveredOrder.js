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
  const [klupplistorData, setKlupplistorData] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        
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

  const handleToggleExpand = async (orderNumberToExpand) => { // Changed param name for clarity
    if (expandedOrderId === orderNumberToExpand) {
      setExpandedOrderId(null); // Collapse if already expanded
      return;
    }

    // Set the new expanded order ID immediately for responsiveness
    setExpandedOrderId(orderNumberToExpand);
    setError(null); // Clear previous detail-loading errors

    // Array to hold all fetch promises
    const fetchPromises = [];

    // Fetch Prilistor if not already fetched
    if (!prilistorData[orderNumberToExpand]) {
      fetchPromises.push(
        axios.get(`${process.env.REACT_APP_API_URL}/api/prilista/order/${orderNumberToExpand}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(response => ({ type: 'prilista', data: response.data }))
          .catch(err => ({ type: 'prilista', error: err })) // Catch individual errors
      );
    }

    // Fetch Kantlistor if not already fetched
    if (!kantlistorData[orderNumberToExpand]) {
      fetchPromises.push(
        axios.get(`${process.env.REACT_APP_API_URL}/api/kantlista/order/${orderNumberToExpand}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(response => ({ type: 'kantlista', data: response.data }))
          .catch(err => ({ type: 'kantlista', error: err }))
      );
    }

    // --- FETCH KLUPPLISTOR IF NOT ALREADY FETCHED --- ADD THIS ---
    if (!klupplistorData[orderNumberToExpand]) {
      fetchPromises.push(
        axios.get(`${process.env.REACT_APP_API_URL}/api/klupplista/order/${orderNumberToExpand}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(response => ({ type: 'klupplista', data: response.data }))
          .catch(err => ({ type: 'klupplista', error: err }))
      );
    }
    // --- END OF KLUPPLISTA FETCH ---

    // If there are no new lists to fetch, just ensure the order is expanded
    if (fetchPromises.length === 0) {
        return; // Already expanded or data cached
    }

    // Execute all fetches concurrently
    try {
      const results = await Promise.all(fetchPromises);

      // Process results and update state
      results.forEach(result => {
        if (result.error) {
          console.error(`Failed to fetch ${result.type} data:`, result.error);
          setError(prevError => `${prevError || ''} Failed to load ${result.type} data. `);
          // Update specific data to empty array on error to prevent undefined access
           if (result.type === 'prilista') setPrilistorData(prev => ({ ...prev, [orderNumberToExpand]: [] }));
           if (result.type === 'kantlista') setKantlistorData(prev => ({ ...prev, [orderNumberToExpand]: [] }));
           if (result.type === 'klupplista') setKlupplistorData(prev => ({ ...prev, [orderNumberToExpand]: [] }));
        } else {
          if (result.type === 'prilista') {
            setPrilistorData(prevData => ({ ...prevData, [orderNumberToExpand]: result.data }));
          } else if (result.type === 'kantlista') {
            setKantlistorData(prevData => ({ ...prevData, [orderNumberToExpand]: result.data }));
          } else if (result.type === 'klupplista') {
            setKlupplistorData(prevData => ({ ...prevData, [orderNumberToExpand]: result.data }));
          }
        }
      });
    } catch (overallError) {
        // This catch block might not be strictly necessary if individual catches are handled
        console.error("Error during Promise.all for list fetches:", overallError);
        setError("An error occurred while loading order details.");
    }
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
        <p className="noItems">Inga ordrar att visa.</p>
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
                <h4>Okantad:</h4>
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

                <h4>Kantad:</h4>
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
                {/* --- KLUPPLISTOR SECTION --- ADD THIS --- */}
                <h4>Klupp:</h4>
                <ul>
                  {klupplistorData[order.orderNumber] && klupplistorData[order.orderNumber].length > 0 ? (
                      klupplistorData[order.orderNumber].map((klupplista, index) => (
                        <li
                          key={index}
                          style={{
                            textDecoration: klupplista.status.klar && klupplista.status.kapad ? 'line-through' : 'none',
                            color: klupplista.status.klar && klupplista.status.kapad ? 'gray' : 'black',
                          }}
                        >
                          {`${klupplista.antal}PKT ${klupplista.dimension}MM ${klupplista.sagverk} ${klupplista.pktNumber} ${klupplista.max_langd} ${klupplista.sort}`}
                        </li>
                      ))
                    ) : (
                      <li>---</li>
                    )}
                </ul>
                {/* --- END OF KLUPPLISTOR SECTION --- */}

                <div className="orderActions">
                  <button className="orderDetailButtons" onClick={() => navigate(`/dashboard/delivered/order-detail/${order.orderNumber}`)}>Detaljer</button>
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
