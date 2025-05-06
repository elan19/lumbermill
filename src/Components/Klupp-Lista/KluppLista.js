import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Link might not be needed if viewing details elsewhere
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './KluppLista.module.css'; // Create this CSS file
// import io from 'socket.io-client'; // Optional: Add if real-time updates are needed

// Define Draggable Item Type
const ItemType = {
  KLUPPLISTA_ROW: 'klupplistaRow',
};

// --- DraggableRow Component ---
const DraggableRow = ({ item, index, moveItem, moveItemUp, moveItemDown, styles }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemType.KLUPPLISTA_ROW,
    hover(draggedItem, monitor) {
        // Basic hover logic (can be enhanced for better visual feedback)
        if (!ref.current) return;
        const dragIndex = draggedItem.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return; // Don't replace items with themselves
        // TODO: Add logic to determine move direction/threshold if needed
    },
    drop(draggedItem) {
      // Only call moveItem when dropped ON a different item
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index); // Pass original drag index and current hover index
        // Note: react-dnd automatically handles updating the dragged item's index internally
        // if the drop is successful and the item object is mutable (which it often is in examples)
        // but explicitly setting draggedItem.index = index here can sometimes cause issues.
        // Rely on the moveItem function to update state and trigger re-render.
      }
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.KLUPPLISTA_ROW,
    item: () => ({ index }), // Pass index in the item payload
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref)); // Attach drag and drop refs to the row

  // Determine if up/down buttons should be disabled
  // Assumes `listLength` prop is passed or calculated correctly
  // const isFirst = index === 0;
  // const isLast = index === listLength - 1;

  return (
    <tr ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className={styles.draggableRow}>
      <td className={styles.positionCell} data-label="Pos">
        <button onClick={() => moveItemUp(index)} disabled={index === 0} className={styles.moveButton}>↑</button>
        <span>{item.position || index + 1}</span> {/* Display position or index */}
        <button onClick={() => moveItemDown(index)} className={styles.moveButton}>↓</button> {/* Add disable logic based on list length */}
      </td>
      <td data-label="OrderNr">{item.orderNumber || '-'}</td>
      <td data-label="Sågverk">{item.sagverk}</td>
      <td data-label="Dimension">{item.dimension}</td>
      <td data-label="Pkt Nr">{item.pktNumber || '-'}</td>
      <td data-label="Max Längd">{item.max_langd}</td>
      <td data-label="Sort">{item.sort || '-'}</td>
      <td data-label="Stad">{item.stad || '-'}</td>
      <td data-label="Magasin">{item.magasin || '-'}</td>
      <td data-label="Lagerplats">{item.lagerplats || '-'}</td>
      {/* Add other columns like magasin, lagerplats, lev.datum if needed */}
      <td data-label="Info">{item.information || '-'}</td>
      <td data-label="Status">
        {item.status?.klar ? 'Klar' : (item.status?.ej_Klar ? 'Ej Klar' : 'Pågående')}
        {/* Add buttons to change status if needed */}
      </td>
       {/* Add Edit/Delete buttons if needed */}
       {/*
       <td>
           <button onClick={() => handleEdit(item._id)}>Redigera</button>
           <button onClick={() => handleDelete(item._id)}>Ta bort</button>
       </td>
       */}
    </tr>
  );
};


// --- Main KlupplistaManager Component ---
const KlupplistaManager = () => {
  const [klupplistor, setKlupplistor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // const socket = useRef(null); // Uncomment if using websockets
  const token = localStorage.getItem('token');

  // Fetch data on mount
  const fetchKlupplistor = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/klupplista`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort by position initially
      const sortedData = response.data.sort((a, b) => (a.position || 0) - (b.position || 0));
      setKlupplistor(sortedData);
    } catch (err) {
      console.error('Error fetching klupplistor:', err);
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchKlupplistor();
    // WebSocket setup (Optional)
    // socket.current = io(...);
    // socket.current.on('kluppListReordered', fetchKlupplistor);
    // return () => socket.current.disconnect();
  }, [fetchKlupplistor]);


  // --- Reordering Logic ---
  const moveItem = useCallback(async (dragIndex, hoverIndex) => {
    setError(null); // Clear previous errors
    // Optimistic UI Update
    const itemsCopy = [...klupplistor];
    const [draggedItem] = itemsCopy.splice(dragIndex, 1);
    itemsCopy.splice(hoverIndex, 0, draggedItem);

    // Update state immediately for smooth UI
    setKlupplistor(itemsCopy);

    // Prepare data for backend (update positions based on new order)
    const updatedItems = itemsCopy.map((item, index) => ({
        _id: item._id,
        position: index + 1 // Assuming 1-based position
    }));

    // Backend update
    try {
         await axios.put(`${process.env.REACT_APP_API_URL}/api/klupplista/reorder`,
             { updatedItems },
             { headers: { Authorization: `Bearer ${token}` } }
         );
         // Optional: Refetch to confirm, though optimistic update is done
         // fetchKlupplistor();
     } catch (err) {
         console.error('Error reordering klupplistor:', err);
         setError(err.response?.data?.message || 'Failed to save new order.');
         // Revert optimistic update on error
         fetchKlupplistor(); // Fetch original order
     }

  }, [klupplistor, token, fetchKlupplistor]); // Include fetchKlupplistor if using it to revert

  const moveItemUp = (index) => {
    if (index > 0) {
        moveItem(index, index - 1); // Use the main moveItem logic
    }
  };

  const moveItemDown = (index) => {
      if (index < klupplistor.length - 1) {
          moveItem(index, index + 1); // Use the main moveItem logic
      }
  };
  // --- End Reordering Logic ---


  // --- Render Logic ---
  if (loading) return <p className={styles.loading}>Laddar Klupplistor...</p>;
  if (error) return <p className={styles.error}>Fel: {error}</p>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.klupplistaContainer}>
        <h1>Klupplista</h1>

        {error && <p className={styles.error}>Fel vid uppdatering: {error}</p>}

        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>OrderNr</th>
                <th>Sågverk</th>
                <th>Dimension</th>
                <th>Pkt Nr</th>
                <th>Längd</th>
                <th>Trä</th>
                <th>Märkning</th>
                <th>Magasin</th>
                <th>Lagerplats</th>
                {/* Add other headers if needed */}
                <th>Info</th>
                <th>Status</th>
                {/* <th>Actions</th> Add if needed */}
              </tr>
            </thead>
            <tbody>
              {klupplistor.map((item, index) => (
                <DraggableRow
                  key={item._id}
                  index={index}
                  item={item}
                  moveItem={moveItem}
                  moveItemUp={moveItemUp}
                  moveItemDown={moveItemDown}
                  styles={styles}
                  // Pass listLength for disabling buttons if needed: listLength={klupplistor.length}
                />
              ))}
            </tbody>
          </table>
           {klupplistor.length === 0 && <p className={styles.noItems}>Inga klupplistor att visa.</p>}
        </div>
      </div>
    </DndProvider>
  );
};

export default KlupplistaManager;