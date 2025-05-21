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

  const groupAndSortItems = (items, typeField = 'type' || 'typ', sortField = null, sortOrder = 'asc') => {
    if (!items || items.length === 0) {
        return {};
    }

    const grouped = items.reduce((acc, item) => {
        const groupKey = item[typeField] || 'Okänt'; // Fallback for items without the type field
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {});

    // Optionally sort items within each group
    if (sortField) {
        for (const key in grouped) {
            grouped[key].sort((a, b) => {
                // Basic sort, extend as needed for numbers, dates, etc.
                if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
                if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
    }
    return grouped;
  };

  const groupedPrilistaItems = groupAndSortItems(prilistaDetails, 'type');
  const groupedKantlistaItems = groupAndSortItems(kantlistaDetails, 'typ');

  const prilistaTypeOrder = ['FURU', 'GRAN']; // Add other types in desired order
  const kantlistaTypeOrder = ['FURU', 'GRAN']; // Add other types in desired order

  const getSortedGroupKeys = (groupedItems, orderArray) => {
    const keys = Object.keys(groupedItems);
    return keys.sort((a, b) => {
        const indexA = orderArray.indexOf(a.toUpperCase()); // Make comparison case-insensitive if needed
        const indexB = orderArray.indexOf(b.toUpperCase());

        if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Both not in order, sort alphabetically
        if (indexA === -1) return 1;  // a is not in order, b is, so b comes first
        if (indexB === -1) return -1; // b is not in order, a is, so a comes first
        return indexA - indexB;     // Both in order, sort by their index
    });
};

const sortedPrilistaGroupKeys = getSortedGroupKeys(groupedPrilistaItems, prilistaTypeOrder);
const sortedKantlistaGroupKeys = getSortedGroupKeys(groupedKantlistaItems, kantlistaTypeOrder);

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
      <h2>UTLASTNINGSORDER #{orderDetails.orderNumber} - Levererad</h2>
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
          <div className="prilistaList">
            {sortedPrilistaGroupKeys.map(typeKey => (
              // Check if there are items for this specific typeKey
              groupedPrilistaItems[typeKey] && groupedPrilistaItems[typeKey].length > 0 && (
                <div key={`prilista-group-${typeKey}`} className="prilistaTypeGroup">
                  {/* Subheading for the specific type, e.g., "FURV" or "GRAN" */}
                  <h4 className="prilistah3">OKANTAT {typeKey.toUpperCase()}</h4> {/* THIS SHOULD RENDER "FURU" or "GRAN" ONCE PER TYPE */}
                  
                  <div className="prilistaList"> {/* Container for items of this specific type */}
                    {groupedPrilistaItems[typeKey].map((item, index) => (
                      <div key={item._id || index} className="prilistaItem">
                        <p>
                          {item.quantity}PKT {item.dimension}MM {item.size} {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
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
          <div className="kantlistaList">
            {sortedKantlistaGroupKeys.map(typeKey => (
              groupedKantlistaItems[typeKey] && groupedKantlistaItems[typeKey].length > 0 && (
                <div key={`kantlista-group-${typeKey}`} className="kantlistaTypeGroup">
                  <h4 className="kantatH3">KANTAT {typeKey.toUpperCase()}</h4>
                  <div className="kantlistaList">
                    {groupedKantlistaItems[typeKey].map((item, index) => (
                      <div key={item._id || index} className="kantlistaItem">
                        <p>
                          {item.antal}PKT {item.tjocklek}x{item.bredd}MM {item.max_langd}M {item.information}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
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
                    {item.antal}PKT {item.dimension}MM {item.sagverk} {item.pktNumber} {item.max_langd} {item.sort} {item.information}
                  </p>
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
