import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './order.css';

const DeliveredOrderDetails = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [prilistaDetails, setPrilistaDetails] = useState([]);
  const [kantlistaDetails, setKantlistaDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Fetch the order details
        const orderResponse = await fetch(`http://localhost:5000/api/orders/${orderNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        if (!orderResponse.ok) {
          throw new Error(`Error: ${orderResponse.status} - ${orderResponse.statusText}`);
        }
        const orderData = await orderResponse.json();
        setOrderDetails(orderData);

        // Fetch all related prilista details using the orderNumber
        const prilistaResponse = await fetch(`http://localhost:5000/api/prilista/order/${orderNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        if (!prilistaResponse.ok) {
          throw new Error(`Error: ${prilistaResponse.status} - ${prilistaResponse.statusText}`);
        }
        const prilistaData = await prilistaResponse.json();
        setPrilistaDetails(prilistaData);

        // Fetch all related kantlista details using the orderNumber
        const kantlistaResponse = await fetch(`http://localhost:5000/api/kantlista/order/${orderNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
        if (!kantlistaResponse.ok) {
          throw new Error(`Error: ${kantlistaResponse.status} - ${kantlistaResponse.statusText}`);
        }
        const kantlistaData = await kantlistaResponse.json();
        setKantlistaDetails(kantlistaData);

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber]);

  const handleComplete = async (id, type) => {
    try {
      const endpoint = type === 'prilista' 
        ? `http://localhost:5000/api/prilista/complete/${id}`
        : `http://localhost:5000/api/kantlista/complete/${id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const updatedItem = await response.json();

      if (type === 'prilista') {
        setPrilistaDetails((prevDetails) =>
          prevDetails.map((item) =>
            item._id === updatedItem._id ? { ...item, completed: true } : item
          )
        );
      } else {
        setKantlistaDetails((prevDetails) =>
          prevDetails.map((item) =>
            item._id === updatedItem._id ? { ...item, completed: true } : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark item as completed:', err);
      setError(err.message);
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderNumber}/delivered`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const updatedOrder = await response.json();
      setOrderDetails(updatedOrder);
      alert('Order marked as Levererad!');
    } catch (err) {
      console.error('Failed to mark order as delivered:', err);
      setError(err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/edit-order/${orderNumber}`);
  };

  const totalPackets = prilistaDetails.reduce((sum, item) => sum + item.quantity, 0) +
  kantlistaDetails.reduce((sum, item) => sum + item.antal, 0);

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
        <div className="markAsDelivered">
          <button className="editBtn" onClick={handleEdit}>Redigera Order</button>
        </div>
      </div>
      <div className="vehicleDetails">
        <p>Speditör: BIL {totalPackets} PKT</p>
      </div>
      <div className="prilistaDetails">
        <h3>Prilistor</h3>
        {prilistaDetails.length > 0 ? (
          <div className="prilistaList">
            {prilistaDetails.map((item, index) => (
              <div key={index} className="prilistaItem">
                <p>{item.quantity} pkt {item.dimension} MM {item.size}</p>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Inga prilistor funna.</p>
        )}
      </div>
      <div className="kantlistaDetails">
        {kantlistaDetails.length > 0 ? (
          <>
          <h3>Kantlistor</h3>
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
    </div>
  );  
};

export default DeliveredOrderDetails;
