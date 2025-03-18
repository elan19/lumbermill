import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './KantLista.module.css';

import io from 'socket.io-client';

const ItemType = {
  ORDER: 'order',
};

const KantListaManager = () => {
  const [orders, setOrders] = useState([]);
  const [activeKantlistor, setActiveKantlistor] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState(null);
  const [currentKantlistaId, setCurrentKantlistaId] = useState(null);
  const navigate = useNavigate();
  const socket = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Connect to the WebSocket server
    socket.current = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token') // Send the token as part of the connection
      }
    }); // Adjust URL as needed
    socket.current.on('kantListUpdate', (data) => {
      //console.log('Received order update:', data);
      // Fetch the updated list of orders from the backend
      fetchOrders();
    });

    socket.current.on('activeKantList', (data) => {
      //console.log('Received order update:', data);
      // Fetch the updated list of orders from the backend
      fetchOrders();
    });

    fetchOrders();

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/kantlista', {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      
      // Filter incomplete orders
      const incompleteOrders = response.data.filter(order => !(order.status.kapad && order.status.klar));
      
      // Sort incomplete orders
      const sortedOrders = incompleteOrders.sort((a, b) => a.position - b.position);
      
      // Update orders state
      setOrders(sortedOrders);
  
      // Update activeKantlistor state with orders that are active
      const activeOrders = response.data.filter(order => order.active);
      setActiveKantlistor(activeOrders);
  
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleToggleActiveKantlista = async (kantlista) => {
    //console.log(kantlista);
    try {
      // Use the new toggle-active endpoint
  
      const response = await axios.put(`http://localhost:5000/api/kantlista/toggle-active/${kantlista._id}`, 
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
  
      if (response.status === 200) {
        fetchOrders(); // Refresh active kantlistor
      }
    } catch (error) {
      console.error('Error toggling active state:', error);
    }
  };

  const moveOrder = async (dragIndex, hoverIndex) => {
  
    // Step 1: Update the local UI to reflect the new order
    const updatedOrders = [...orders];
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
        'http://localhost:5000/api/kantlista/reorder',
        { updatedOrders: reorderedOrders }, // Send the entire reordered list to the backend
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Emit the order update via socket
      socket.current.emit('kantListUpdate', reorderedOrders);
  
      // Re-fetch orders to maintain consistency
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleFilterClick = async (kantlistId, dimension, size) => {
    //console.log(kantlistId);
    try {
      const params = new URLSearchParams({ dim: dimension });
      if (size) params.append("tum", size);
  
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
      setCurrentKantlistaId(kantlistId);
    } catch (error) {
      console.error("Error fetching filtered Lagerplatser:", error);
      alert("Failed to fetch filtered Lagerplatser");
    }
  };

  const handleUpdateLagerplats = async (kantlistId, newLocation) => {
    try {
      //console.log(kantlistId);
      //console.log(newLocation);
      const response = await axios.put(`http://localhost:5000/api/kantlista/update-lagerplats`, {
        kantlistId,
        lagerplats: newLocation,
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });

      if (response.status === 200) {
        //alert(`Lagerplats updated to: ${newLocation}`);

        fetchOrders();
        setFilterCriteria(null);
      }
    } catch (error) {
      console.error('Error updating Lagerplats:', error);
      alert('Failed to update Lagerplats');
    }
  };

  const handleComplete = async (id, field) => {
    try {
      if (!token) {
        alert("Authorization token is missing.");
        return;
      }
  
      
  
      // Determine the endpoint for updating the status
      const endpoint = field === "kapad" ? "cut" : "completed";

      // Find the current order to check its properties
      const currentOrder = orders.find(order => order._id === id);
  
      if (!currentOrder) {
        alert("Order not found.");
        return;
      }

      //console.log(endpoint);
      //console.log(currentOrder.customer);
  
      // If `ordernumber` is missing and `kund` is "lager", delete the kantlista when clicking "Klar"
      if (currentOrder.customer === "Lager" && endpoint === "completed") {
        //console.log(currentOrder);
        const deleteResponse = await axios.delete(
          `http://localhost:5000/api/kantlista/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const newLagerplats = {
          type: "Kantat",
          tree: "f",
          dim: currentOrder.tjocklek,
          location: "-",
          kantatData: {
            bredd: currentOrder.bredd,
            varv: currentOrder.varv,
            max_langd: currentOrder.max_langd,
            kvalite: "-"
          },
           // Du kan uppdatera detta om det finns en specifik plats
      };

      const addResponse = await axios.post(
          `http://localhost:5000/api/lagerplats`,
          newLagerplats,
          {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          }
      );

      if (addResponse.status === 201) {
          setOrders(prevOrders => prevOrders.filter(order => order._id !== id));
          fetchOrders();
          //alert("Kantlistan har lagts till i Lagerplats!");
      }
  
        if (deleteResponse.status === 200) {
          setOrders(prevOrders => prevOrders.filter(order => order._id !== id));
          fetchOrders();
        }
        return; // Exit function after deletion
      }
  
      // Make the API request to update the order
      const response = await axios.put(
        `http://localhost:5000/api/kantlista/${endpoint}/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        //alert(`Item marked as ${field}`);
  
        // Update the state for the orders
        const updatedOrders = orders.map(order =>
          order._id === id
            ? { ...order, status: { ...order.status, [field]: true } }
            : order
        );
  
        // Filter out orders only if both `kapad` and `klar` are true
        setOrders(updatedOrders.filter(order => !(order.status.kapad && order.status.klar)));
      }
  
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to update item status");
    }
  };
  
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.kantlistaContainer}>
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
                            onClick={() => handleUpdateLagerplats(currentKantlistaId, item.location)}
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
            onClick={() => navigate('/dashboard/new-kantlista')}
          >
            SKAPA NY KANTLISTA
          </button>
        </div>

        {/** Aktiva Kantlistor Table */}
        <div className={styles.orderList}>
          <h2 className={styles.title}>Aktiva Kantlista</h2>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Ordernummer</th>
                <th>Kund</th>
                <th>Data</th>
                <th>Lagerplats</th>
                <th>Information</th>
                <th>Kapad</th>
                <th>Klar</th>
                <th>Ta bort</th>
              </tr>
            </thead>
            <tbody>
            {activeKantlistor
              .sort((a, b) => a.position - b.position) // Sorting by position (ascending order)
              .map((kantlista) => (
                <tr key={kantlista._id}>
                  <td data-label="Ordernummer">
                    <Link to={`/dashboard/order-detail/${kantlista.orderNumber}`} className={styles.orderLink}>
                      {kantlista.orderNumber}
                    </Link>
                  </td>
                  <td data-label="Kund">{kantlista.customer}</td>
                  <td data-label="Data">{kantlista.tjocklek} x {kantlista.bredd} - {kantlista.varv}varv - {kantlista.max_langd}m - {kantlista.stampel || '-'}</td>
                  <td data-label="Lagerplats">{kantlista.lagerplats || '-'}</td>
                  <td data-label="Information">{kantlista.information || '-'}</td>
                  <td data-label="Kapad">
                    {!kantlista.status.kapad && (
                      <button
                        onClick={() => handleComplete(kantlista._id, 'kapad')}
                        className={styles.checkButton}
                      >
                        Kapad
                      </button>
                    )}
                    {kantlista.status.kapad && (
                      <button className={styles.greenButton} disabled>
                        Kapad
                      </button>
                    )}
                  </td>
                  <td data-label="Klar">
                    {!kantlista.status.klar && (
                      <button
                        onClick={() => handleComplete(kantlista._id, 'klar')}
                        className={styles.checkButton}
                      >
                        Klar
                      </button>
                    )}
                    {kantlista.status.klar && (
                      <button className={styles.greenButton} disabled>
                        Klar
                      </button>
                    )}
                  </td>
                  <td data-label="Aktivera">
                    <button
                      className={`${styles.activeButton} ${kantlista.active ? styles.deactiveButton : ''}`}
                      onClick={() => handleToggleActiveKantlista(kantlista)}
                    >
                      Avaktivera
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.orderList}>
          <h2 className={styles.title}>Hela kantlista</h2>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Ordernummer</th>
                <th>Kund</th>
                <th>Tjocklek</th>
                <th>Data</th>
                <th>Lagerplats</th>
                <th>Information</th>
                <th>Kapad</th>
                <th>Klar</th>
                <th>Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <DraggableRow
                  key={order._id}
                  index={index}
                  order={order}
                  moveOrder={moveOrder}
                  onComplete={handleComplete}
                  onFilter={handleFilterClick}
                  activeKantlistor={activeKantlistor}
                  handleToggleActiveKantlista={handleToggleActiveKantlista}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DndProvider>
  );
};

const DraggableRow = ({ order, index, moveOrder, onComplete, onFilter, activeKantlistor = [], handleToggleActiveKantlista }) => {
  const ref = React.useRef(null);

  const isActive = Array.isArray(activeKantlistor) && activeKantlistor.some((item) => item._id === order._id);

  const [, drop] = useDrop({
    accept: ItemType.ORDER,
    drop: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveOrder(draggedItem.index, index);
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

  const kapadButtonClass = order.status.kapad ? styles.greenButton : styles.checkButton;
  const klarButtonClass = order.status.klar ? styles.greenButton : styles.checkButton;

  return (
    <tr
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={styles.draggableRow}
    >
      <td data-label="Ordernummer">
        <Link to={`/dashboard/order-detail/${order.orderNumber}`} className={styles.orderLink}>
          {order.orderNumber}
        </Link>
      </td>
      <td data-label="Kund">{order.customer}</td>
      <td data-label="Dimension:">
        <span className={styles.clickable} onClick={() => onFilter(order._id, order.tjocklek, null)}>{order.tjocklek} MM</span>
      </td>
      <td data-label="Data">{order.tjocklek} x {order.bredd} - {order.varv}varv - {order.max_langd}m - {order.stampel || ''}</td>
      <td data-label="Lagerplats">{order.lagerplats || '-'}</td>
      <td data-label="Information">{order.information || '-'}</td>
      <td data-label="Kapad">
        {!order.status.kapad && (
          <button
            onClick={() => onComplete(order._id, 'kapad')}
            className={kapadButtonClass}
          >
            Kapad
          </button>
        )}
        {order.status.kapad && (
          <button className={kapadButtonClass} disabled>
            Kapad
          </button>
        )}
      </td>
      <td data-label="Klar">
        {!order.status.klar && (
          <button
            onClick={() => onComplete(order._id, 'klar')}
            className={klarButtonClass}
          >
            Klar
          </button>
        )}
        {order.status.klar && (
          <button className={klarButtonClass} disabled>
            Klar
          </button>
        )}
      </td>
      <td data-label="Aktivera">
        <button
          className={`${styles.activeButton} ${isActive ? styles.deactiveButton : ''}`}
          onClick={() => handleToggleActiveKantlista(order)}
        >
          {isActive ? 'Avaktivera' : 'Aktivera'}
        </button>
      </td>
    </tr>
  );
};

export default KantListaManager;
