import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './order.css';

import { useAuth } from '../../contexts/AuthContext';

const DeliveredOrderDetails = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [prilistaDetails, setPrilistaDetails] = useState([]);
  const [kantlistaDetails, setKantlistaDetails] = useState([]);
  const [klupplistaDetails, setKlupplistaDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true); // Ensure loading is true at the start of fetch
      setError(null);   // Clear previous errors
      try {
        if (!token) { // Moved token check to the beginning of try
            throw new Error('Authentication token not found. Please log in.');
        }

        // Fetch the order details
        const orderResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!orderResponse.ok) throw new Error(`Order: ${orderResponse.status} - ${orderResponse.statusText}`);
        const orderData = await orderResponse.json();
        setOrderDetails(orderData);

        // Fetch all related prilista details
        const prilistaResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/prilista/order/${orderNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!prilistaResponse.ok) throw new Error(`Prilista: ${prilistaResponse.status} - ${prilistaResponse.statusText}`);
        const prilistaData = await prilistaResponse.json();
        setPrilistaDetails(prilistaData);

        // Fetch all related kantlista details
        const kantlistaResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/kantlista/order/${orderNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!kantlistaResponse.ok) throw new Error(`Kantlista: ${kantlistaResponse.status} - ${kantlistaResponse.statusText}`);
        const kantlistaData = await kantlistaResponse.json();
        setKantlistaDetails(kantlistaData);

        // --- FETCH KLUPPLISTA DETAILS --- ADD THIS ---
        const klupplistaResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/klupplista/order/${orderNumber}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        // For delivered orders, klupplistor might have been set to klar:true or even deleted if that's your logic.
        // Handle 404 gracefully for klupplistor if they might not exist.
        if (!klupplistaResponse.ok) {
            if (klupplistaResponse.status === 404) {
                setKlupplistaDetails([]); // Set to empty array if not found
            } else {
                throw new Error(`Klupplista: ${klupplistaResponse.status} - ${klupplistaResponse.statusText}`);
            }
        } else {
            const klupplistaData = await klupplistaResponse.json();
            setKlupplistaDetails(klupplistaData);
        }
        // --- END OF KLUPPLISTA FETCH ---

      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError(err.message);
         if (err.message.includes('Authentication token not found')) {
             navigate('/login'); // Redirect if token is the issue
         }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, token, navigate]);

  const handleEdit = () => {
    navigate(`/dashboard/edit-order/${orderNumber}`);
  };

  const totalPackets = prilistaDetails.reduce((sum, item) => sum + item.quantity, 0) +
  kantlistaDetails.reduce((sum, item) => sum + item.antal, 0) + klupplistaDetails.reduce((sum, item) => sum + (item.antal || 0), 0);

  if (loading) {
    return <p>Loading order details...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!orderDetails) {
    return <p>No order details found.</p>;
  }

  return (
    <div className="orderDetail">
      <h2>UTLASTNINGSORDER - Levererad</h2>
      <div className="orderHeader">
        <div className="orderInfo">
          <p>Order nr: {orderDetails.orderNumber}</p>
          <p>Köpare: {orderDetails.customer}</p>
          <p>Avsänds med bil</p>
          <p>Avrop: {orderDetails.delivery}</p>
        </div>
        {hasPermission('orders', 'update') && (
          <div className="markAsDelivered">
            <button className="editBtn" onClick={handleEdit}>Redigera Order</button>
          </div>
        )}
      </div>
      <div className="vehicleDetails">
        <p>Speditör: BIL {totalPackets} PKT</p>
      </div>
      <div className="prilistaDetails">
        {prilistaDetails.length > 0 ? (
          <>
          <h3>Okantad</h3>
          <div className="prilistaList">
            {prilistaDetails.map((item, index) => (
              <div key={index} className="prilistaItem">
                <p>{item.quantity} pkt {item.dimension} MM {item.size}</p>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
          </>
        ) : (
          <p></p>
        )}
      </div>
      <div className="kantlistaDetails">
        {kantlistaDetails.length > 0 ? (
          <>
          <h3>Kantad</h3>
          <div className="kantlistaList">
            {kantlistaDetails.map((item, index) => (
              <div key={index} className="kantlistaItem">
                <p>{item.antal} pkt {item.tjocklek} x {item.bredd}</p>
                <p>{item.information}</p>
              </div>
            ))}
          </div>
          </>
          ) : (
            <p></p> // Optionally add this for when there are no items
        )}
      </div>
      <div className="klupplistaDetails"> {/* Use a class like styles.klupplistaDetails if using CSS Modules */}
        {/* Only render the section if there are klupplista items */}
        {klupplistaDetails.length > 0 && (
          <>
            <h3>Klupp</h3>
            <div className="klupplistaList"> {/* Use a class like styles.klupplistaList */}
              {klupplistaDetails.map((item, index) => (
                <div key={item._id || index} className="klupplistItem"> {/* Use _id and class */}
                  {/* Display relevant Klupplista fields for a delivered order */}
                  <p>
                    {item.antal}PKT {item.dimension}MM {item.sagverk} {item.pktNumber} {item.max_langd} {item.sort}
                  </p>
                  {/* Add other fields like special, magasin, leveransDatum if needed */}
                  {item.information && <p>Info: {item.information}</p>}
                  {/* For delivered orders, klupplista status should be 'klar: true' */}
                  {/* <p>Status: {item.status?.klar ? 'Klar' : 'Information saknas'}</p> */}
                </div>
              ))}
            </div>
          </>
        )}
        {/* Optional: Message if klupplista is empty for a delivered order */}
        {/* {klupplistaDetails.length === 0 && <p>Inga klupplistor tillhörande denna levererade order.</p>} */}
      </div>
    </div>
  );  
};

export default DeliveredOrderDetails;
