import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './Prilista.module.css';

import io from 'socket.io-client';


const ItemType = {
  ORDER: 'order',
};

const Prilista = () => {
  const [orders, setOrders] = useState([]);
  const [ishallenOrders, setIshallenOrders] = useState([]);
  const [bsidanOrders, setBsidanOrders] = useState([]);
  const [asidanOrders, setAsidanOrders] = useState([]);
  const [emptyLocationOrders, setEmptyLocationOrders] = useState([]);
  const [completeOrders, setCompletedOrders] = useState([]);
  const allOrders = [...ishallenOrders, ...bsidanOrders, ...asidanOrders, ...emptyLocationOrders];
  const [isTouchDevice, setIsTouchDevice] = useState(window.innerWidth < 1024);
  const [user, setUser] = useState(null); // State to store user data

  const navigate = useNavigate();
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState(null);
  const [currentPrilistaId, setCurrentPrilistaId] = useState(null);
  const socket = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Connect to the WebSocket server
    fetchUserData();
    socket.current = io('http://localhost:5000', {
    transports: ['websocket'], // Optional, but ensures you're using WebSocket for communication
    auth: {
      token: localStorage.getItem('token') // Send token as part of the connection
    }
    }); // Adjust URL as needed
    socket.current.on('orderUpdated', (data) => {
      console.log('Received order update:', data);
      // Fetch the updated list of orders from the backend
      fetchOrders();
    });

    socket.current.on('itemCompleted', (data) => {
      // Update the orders state when the event is received
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === data.id ? { ...order, completed: data.completed } : order
        )
      );
      fetchOrders();
    });
    // Fetch initial orders
    fetchOrders();

    // Cleanup on component unmount
    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateDeviceType = () => {
      setIsTouchDevice(window.innerWidth < 1024);
    };

    // Initialize on mount
    updateDeviceType();

    // Add resize listener
    window.addEventListener('resize', updateDeviceType);

    console.log(`Is touch device: ${isTouchDevice}`);

    return () => {
      // Cleanup listener on unmount
      window.removeEventListener('resize', updateDeviceType);
    };
  }, [isTouchDevice]);

  // Log changes to `isTouchDevice`
  useEffect(() => {
    console.log(`Is touch device: ${isTouchDevice}`);
  }, [isTouchDevice]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');
  
      const response = await axios.get('http://localhost:5000/api/auth', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const data = response.data;
  
      if (response.status === 200) {  // Check if status is OK
        setUser(data); // Store the user data in state
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');

      const response = await axios.get('http://localhost:5000/api/prilista', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const completedOrders = response.data.filter(order => order.completed);
      const incompleteOrders = response.data.filter(order => !order.completed);
      const sortedOrders = incompleteOrders.sort((a, b) => a.position - b.position);
      setOrders(sortedOrders);
      setCompletedOrders(completedOrders);

      setIshallenOrders(
        sortedOrders.filter(order => order.measureLocation === 'Ishallen')
                    .sort((a, b) => a.position - b.position)
      );
      setBsidanOrders(
        sortedOrders.filter(order => order.measureLocation === 'B-sidan')
                    .sort((a, b) => a.position - b.position)
      );
      setAsidanOrders(
        sortedOrders.filter(order => order.measureLocation === 'A-sidan')
                    .sort((a, b) => a.position - b.position)
      );
      setEmptyLocationOrders(
        sortedOrders.filter(order => !order.measureLocation)
                    .sort((a, b) => a.position - b.position)
      );

      if (user) {
        const refreshToken = user.refreshToken;
        const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
        const newToken = refreshResponse.data.token;
        
        // Store the new token in localStorage
        localStorage.setItem('token', newToken);
        console.log('New token stored:', newToken);
      }

    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
  
    // Fetch user data if it's not available
    if (!user) {
      fetchUserData();
    } else {
      console.log(user); // This will log the user after it's available
      fetchOrders(); // Fetch orders after the user is fetched
    }
  
  }, [user]);

  const moveOrder = async (dragIndex, hoverIndex, list) => {
    console.log('Drag Index:', dragIndex, 'Hover Index:', hoverIndex);
  
    //const draggedOrder = list[dragIndex];
  
    // Step 1: Update the local UI to reflect the new order
    const updatedOrders = [...list];
    const [movedOrder] = updatedOrders.splice(dragIndex, 1); // Remove the dragged order
    updatedOrders.splice(hoverIndex, 0, movedOrder); // Insert the moved order in the target position
  
    // Update the local state
    setOrders(updatedOrders);
  
    // Step 2: Calculate the new positions for all affected orders
    const reorderedOrders = updatedOrders.map((order, index) => ({
      ...order,
      position: index + 1, // Assuming 1-based indexing for positions
    }));
  
    // Step 3: Send the updated positions to the backend
    try {
      await axios.put(
        'http://localhost:5000/api/prilista/reorder',
        { updatedOrders: reorderedOrders }, // Send the entire reordered list to the backend
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Emit the order update via socket
      socket.current.emit('orderUpdated', reorderedOrders);
  
      // Re-fetch orders to maintain consistency
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  
  
  

  const moveOrderUp = async (dragIndex, list) => {
    console.log('Drag Index:', dragIndex, 'Orders:', orders);
  
    // Filter out completed orders
    const updatedOrders = list.filter(order => !order.completed);
  
    // Move the order up
    const hoverIndex = dragIndex - 1;
    if (hoverIndex < 0) return; // Prevent moving to an invalid position
  
    // Get the dragged order and the target order
    const draggedOrder = updatedOrders[dragIndex];
    const targetOrder = updatedOrders[hoverIndex];
  
    // Swap positions in the UI
    [updatedOrders[dragIndex], updatedOrders[hoverIndex]] = [updatedOrders[hoverIndex], updatedOrders[dragIndex]];
  
    // Update the local state
    setOrders(updatedOrders);
  
    try {
      // Send the new positions to the backend
      await axios.put('http://localhost:5000/api/prilista/reorder/up', {
        updates: [
          { id: draggedOrder._id, position: hoverIndex + 1 },
          { id: targetOrder._id, position: dragIndex + 1 },
        ],
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Emit the order update via socket
      socket.current.emit('orderUpdated', {
        updates: [
          { id: draggedOrder._id, position: hoverIndex + 1 },
          { id: targetOrder._id, position: dragIndex + 1 },
        ],
      });
  
      // Re-fetch orders to maintain consistency
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  

  const moveOrderDown = async (dragIndex, list) => {
    console.log('Drag Index:', dragIndex, 'Orders:', orders);
    console.log(token);
  
    // Filter out completed orders
    const updatedOrders = list.filter(order => !order.completed);
  
    // Move the order down
    const hoverIndex = dragIndex + 1;
    if (hoverIndex >= updatedOrders.length) return; // Prevent moving to an invalid position
  
    // Get the dragged order and the target order
    const draggedOrder = updatedOrders[dragIndex];
    const targetOrder = updatedOrders[hoverIndex];
  
    // Swap positions in the UI
    [updatedOrders[dragIndex], updatedOrders[hoverIndex]] = [updatedOrders[hoverIndex], updatedOrders[dragIndex]];
  
    // Update the local state
    setOrders(updatedOrders);
  
    try {
      // Send the new positions to the backend
      await axios.put('http://localhost:5000/api/prilista/reorder/up', {
        updates: [
          { id: draggedOrder._id, position: hoverIndex + 1 },
          { id: targetOrder._id, position: dragIndex + 1 },
        ],
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Emit the order update via socket
      socket.current.emit('orderUpdated', {
        updates: [
          { id: draggedOrder._id, position: hoverIndex + 1 },
          { id: targetOrder._id, position: dragIndex + 1 },
        ],
      });
  
      // Re-fetch orders to maintain consistency
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  
  

  const handleUpdateLagerplats = async (prilistaId, newLocation) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/prilista/update-lagerplats`, {
        prilistaId,
        location: newLocation,
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      
      if (response.status === 200) {
        //alert(`Lagerplats updated to: ${newLocation}`);
        
        // Re-fetch orders to reflect the updated Lagerplats
        fetchOrders();
  
        // Optionally close the modal after the update
        setFilterCriteria(null);
      }
    } catch (error) {
      console.error('Error updating Lagerplats:', error);
      alert('Failed to update Lagerplats');
    }
  };
  

  const handleComplete = async (id) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/prilista/complete/${id}`, {
        
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      if (response.status === 200) {
        setOrders(orders.map(order => (order._id === id ? { ...order, completed: true } : order)).filter(order => !order.completed));

        socket.current.emit('itemCompleted', );

        fetchOrders();
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to mark item as completed');
    }
  };

  const handleFilterClick = async (prilistaId, dimension, size) => {
    console.log("Filterclick");
    console.log(token);
    try {
      const params = new URLSearchParams({ dim: dimension });
      if (size) params.append('tum', size);

      const response = await axios.get(`http://localhost:5000/api/lagerplats/filter?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      const filteredData = response.data;

      // Filter only "Sågat" items
      const sagatData = filteredData.filter(item => item.type === "Sågat");
  
      // Transform data
      const transformedData = sagatData.map(item => ({
        tree: item.tree || "-",
        tum: item.sawData.tum || "-",
        typ: item.sawData.typ || "-",
        location: item.location || "-",
        nt: item.sawData.nt || "-",
      }));
      setFilteredLocations(transformedData);
      setFilterCriteria({ dimension, size });
      setCurrentPrilistaId(prilistaId);
    } catch (error) {
      console.error('Error fetching filtered Lagerplatser:', error);
      alert('Failed to fetch filtered Lagerplatser');
    }
  };

  const toggleFilter = () => {
    setIsFiltered(!isFiltered);
    fetchOrders();
  };

  const DraggableRow = ({ order, index, list, moveOrderUp, moveOrderDown, moveOrder, onComplete, onFilter, showMeasureLocation }) => {
    const ref = React.useRef(null);
  
    const [, drop] = useDrop({
      accept: ItemType.ORDER,
      drop: (draggedItem) => {
        console.log('Dropped Item:', draggedItem); // Debug log
        if (draggedItem.index !== index) {
          moveOrder(draggedItem.index, index, list);
          draggedItem.index = index;
        }
      },
    });
  
    const [{ isDragging }, drag] = useDrag({
      type: ItemType.ORDER,
      item: { type: ItemType.ORDER, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
  
    drag(drop(ref));
  
    return (
      <tr ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className={styles.draggableRow}>
        
        
        <td className={styles.orderNrTD} data-label="Order">
        <button 
          onClick={() => moveOrderUp(index, list)} 
          disabled={index === 0} 
          className={styles.moveButton}
        >
          	&uarr;
        </button>
          <Link to={`/dashboard/order-detail/${order.orderNumber}`} className={styles.orderLink}>
            {order.orderNumber}
          </Link>
          <button 
          onClick={() => moveOrderDown(index, list)} 
          disabled={index === list.length - 1} 
          className={styles.moveButton}
        >
          &darr;
        </button>
        </td>
        <td data-label="Kund:">{order.customer}</td>
        <td data-label="Antal:">{order.quantity} PKT</td>
        <td data-label="Dimension:">
          <span className={styles.clickable} onClick={() => onFilter(order._id, order.dimension, null)}>{order.dimension} MM</span>
        </td>
        <td data-label="Storlek:">{order.size}</td>
        <td data-label="Träslag:">{order.type || '-'}</td>
        {showMeasureLocation && <td data-label="Mätplats:">{order.measureLocation || '-'}</td>}
        <td data-label="Information:">{order.description || '-'}</td>
        <td data-label="Lagerplats:">{order.location || '-'}</td>
        <td data-label="Avklarad:">
          {!order.completed && (
            <button onClick={() => onComplete(order._id)} className={styles.completeButton}>
              Markera som avklarad
            </button>
          )}
        </td>
        
      </tr>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className={styles.prilistaContainer}>
      {filterCriteria && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Filtrerade Lagerplatser</h3>
            <p>
              Visar data för Dimension: <b>{filterCriteria.dimension} MM</b>
              {filterCriteria.size && ` och Storlek: ${filterCriteria.size}`}
            </p>
            {filteredLocations.length > 0 && (
              <table className={styles.filteredTable}>
                <thead>
                  <tr>
                    <th>Träslag</th>
                    <th>Tum</th>
                    <th>Sid/x</th>
                    <th>Lagerplats</th>
                    <th>Nertork</th>
                    <th>Välj</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((item, index) => (
                    <tr key={index}>
                      <td>{item.tree}</td>
                      <td>{item.tum}</td>
                      <td>{item.typ}</td>
                      <td>{item.location}</td>
                      <td>{item.nt}</td>
                      <td>
                        <button
                          className={styles.changeButton}
                          onClick={() => handleUpdateLagerplats(currentPrilistaId, item.location)}
                        >
                          Sätt lagerplats
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setFilterCriteria(null)} className={styles.closeButton}>
              Stäng
            </button>
          </div>
        </div>
      )}
      <div className={styles.header}>
        <button
          className={styles.createButton}
          onClick={() => navigate('/dashboard/new-prilista')}
        >
          SKAPA NY PRILISTA
        </button>
        <button onClick={toggleFilter}>
          {isFiltered ? "Visa alla ordrar tillsammans" : "Gruppera efter mätplats"}
        </button>
      </div>
      {isFiltered ? (
        <div className={styles.orderList}>
          <h2 className={styles.title}>Prilista för Mätlag</h2>

          {/* Ishallen Orders */}
          <h3 className={styles.centeredH3}>Ishallen</h3>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th className={styles.orderNrTH}>Order</th>
                <th>Kund</th>
                <th>Antal</th>
                <th>Dimension</th>
                <th>Storlek</th>
                <th>Träslag</th>
                <th>Information</th>
                <th>Lagerplats</th>
                <th>Avklarad</th>
              </tr>
            </thead>
            <tbody>
              {ishallenOrders.map((order, index) => (
                <DraggableRow
                  key={order._id}
                  index={index}
                  order={order}
                  list={ishallenOrders}
                  moveOrder={moveOrder}
                  moveOrderUp={moveOrderUp}
                  moveOrderDown={moveOrderDown}
                  onComplete={handleComplete}
                  onFilter={handleFilterClick}
                  showMeasureLocation={false}
                />
              ))}
            </tbody>
          </table>

          {/* B-sidan Orders */}
          <h3 className={styles.centeredH3}>B-sidan</h3>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th className={styles.orderNrTH}>Order</th>
                <th>Kund</th>
                <th>Antal</th>
                <th>Dimension</th>
                <th>Storlek</th>
                <th>Träslag</th>
                <th>Information</th>
                <th>Lagerplats</th>
                <th>Avklarad</th>
              </tr>
            </thead>
            <tbody>
              {bsidanOrders.map((order, index) => (
                <DraggableRow
                  key={order._id}
                  index={index}
                  order={order}
                  list={bsidanOrders}
                  moveOrder={moveOrder}
                  moveOrderUp={moveOrderUp}
                  moveOrderDown={moveOrderDown}
                  onComplete={handleComplete}
                  onFilter={handleFilterClick}
                  showMeasureLocation={false}
                />
              ))}
            </tbody>
          </table>

          {/* A-sidan Orders */}
          <h3 className={styles.centeredH3}>A-sidan</h3>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th className={styles.orderNrTH}>Order</th>
                <th>Kund</th>
                <th>Antal</th>
                <th>Dimension</th>
                <th>Storlek</th>
                <th>Träslag</th>
                <th>Information</th>
                <th>Lagerplats</th>
                <th>Avklarad</th>
              </tr>
            </thead>
            <tbody>
              {asidanOrders.map((order, index) => (
                <DraggableRow
                  key={order._id}
                  index={index}
                  order={order}
                  list={asidanOrders}
                  moveOrder={moveOrder}
                  moveOrderUp={moveOrderUp}
                  moveOrderDown={moveOrderDown}
                  onComplete={handleComplete}
                  onFilter={handleFilterClick}
                  showMeasureLocation={false}
                />
              ))}
            </tbody>
          </table>

          {/* Empty Location Orders */}
          <h3 className={styles.centeredH3}>Ej angiven Lagerplats</h3>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Kund</th>
                <th>Antal</th>
                <th>Dimension</th>
                <th>Storlek</th>
                <th>Träslag</th>
                <th>Information</th>
                <th>Lagerplats</th>
                <th>Avklarad</th>
              </tr>
            </thead>
            <tbody>
              {emptyLocationOrders.map((order, index) => (
                <DraggableRow
                  key={order._id}
                  index={index}
                  order={order}
                  list={emptyLocationOrders}
                  moveOrder={moveOrder}
                  moveOrderUp={moveOrderUp}
                  moveOrderDown={moveOrderDown}
                  onComplete={handleComplete}
                  onFilter={handleFilterClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <h2 className={styles.title}>Alla mätlistor</h2>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Kund</th>
                <th>Antal</th>
                <th>Dimension</th>
                <th>Storlek</th>
                <th>Träslag</th>
                <th>Mätplats</th>
                <th>Information</th>
                <th>Lagerplats</th>
                <th>Avklarad</th>
              </tr>
            </thead>
            <tbody>
              {allOrders
                .sort((a, b) => a.position - b.position) // Sort orders by position
                .map((order, index) => (
                  <DraggableRow
                    key={order._id}
                    index={index}
                    order={order}
                    list={orders}
                    moveOrder={moveOrder}
                    moveOrderUp={moveOrderUp}
                    moveOrderDown={moveOrderDown}
                    onComplete={handleComplete}
                    onFilter={handleFilterClick}
                    showMeasureLocation={true}
                  />
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </DndProvider>
  );
};



export default Prilista;
