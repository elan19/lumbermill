import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './KluppLista.module.css'; // Ensure this CSS file exists

// Define Draggable Item Type
const ItemType = {
  KLUPPLISTA_ROW: 'klupplistaRow',
};

// --- DraggableRow Component ---
const DraggableRow = ({
    item, index, listLength,
    moveItem, moveItemUp, moveItemDown, styles,
    // --- Editing props ---
    editingCell, editedValue, handleCellInteraction,
    handleEditChange, handleEditKeyDown, handleEditBlur
 }) => {
  const ref = useRef(null);

  // --- DND Setup ---
  const [, drop] = useDrop({
    accept: ItemType.KLUPPLISTA_ROW,
    hover(draggedItem, monitor) {
      if (!ref.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      // Basic hover logic - no move on pure hover in this setup
    },
    drop(draggedItem) {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
      }
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.KLUPPLISTA_ROW,
    item: () => ({ index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));
  // --- End DND Setup ---

  const isFirst = index === 0;
  const isLast = index === listLength - 1;

  // --- Helper function to render cell content (span or input) ---
  const renderCellContent = (columnKey, displayValue) => {
    const isEditing = editingCell?.rowIndex === index && editingCell?.columnKey === columnKey;
    // Determine input type based on columnKey if needed
    const inputType = (columnKey === 'antal') ? 'number' : 'text';

    return isEditing ? (
        <input
            type={inputType}
            className={styles.editInput}
            value={editedValue}
            onChange={handleEditChange}
            onKeyDown={(e) => handleEditKeyDown(e, index, columnKey)}
            onBlur={() => handleEditBlur(index, columnKey)}
            autoFocus
        />
    ) : (
        <span onClick={() => handleCellInteraction(index, columnKey, displayValue)}>
            {(displayValue === null || displayValue === undefined || displayValue === '') ? '-' : displayValue}
        </span>
    );
  };
  // --- End Helper function ---

  return (
    <tr ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className={styles.draggableRow}>
      {/* Position Cell (Not Editable directly) */}
      <td className={styles.positionCell} data-label="Pos">
        <button onClick={() => moveItemUp(index)} disabled={isFirst} className={styles.moveButton}>↑</button>
        <span>{item.position || index + 1}</span>
        <button onClick={() => moveItemDown(index)} disabled={isLast} className={styles.moveButton}>↓</button>
      </td>

      {/* Editable Cells */}
      <td data-label="Sågverk">{renderCellContent('sagverk', item.sagverk)}</td>
       <td data-label="OrderNr">
         {item.orderNumber ? (
           <Link
              to={`/dashboard/order-detail/${item.orderNumber}`}
              className={styles.orderLink}
              onClick={(e) => e.stopPropagation()} // Prevent row's onClick if link is clicked
            >
               {item.orderNumber} {/* Simplest: Keep link non-editable */}
            </Link>
         ) : (
            renderCellContent('orderNumber', item.orderNumber) // Allow editing if null
         )}
      </td>
      <td data-label="Dimension">{renderCellContent('dimension', item.dimension)}</td>
      <td data-label="Pkt Nr">{renderCellContent('pktNumber', item.pktNumber)}</td>
      <td data-label="Längd">{renderCellContent('max_langd', item.max_langd)}</td>
      <td data-label="Sort">{renderCellContent('sort', item.sort)}</td>
      <td data-label="Märkning">{renderCellContent('stad', item.stad)}</td>
      <td data-label="Magasin">{renderCellContent('magasin', item.magasin)}</td>
      <td data-label="Lagerplats">{renderCellContent('lagerplats', item.lagerplats)}</td>
      <td data-label="Info">{renderCellContent('information', item.information)}</td>

      {/* Status Cell (Not editable inline with this setup) */}
      <td data-label="Status">
        {item.status?.klar ? 'Klar' : (item.status?.ej_Klar ? 'Ej Klar' : 'Pågående')}
      </td>
    </tr>
  );
};


// --- Main KlupplistaManager Component ---
const KlupplistaManager = () => {
  const [klupplistor, setKlupplistor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // --- Editing State ---
  const [editingCell, setEditingCell] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [lastInteractionTime, setLastInteractionTime] = useState(0);

  // Fetch data on mount
  const fetchKlupplistor = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        navigate('/login');
        return;
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/klupplista`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedData = response.data.sort((a, b) => (a.position || 0) - (b.position || 0));
      setKlupplistor(sortedData);
    } catch (err) {
        console.error('Error fetching klupplistor:', err);
        setError(err.response?.data?.message || 'Failed to fetch data.');
    }
     finally { setLoading(false); }
  }, [token, navigate]); // Include navigate in dependencies

  useEffect(() => { fetchKlupplistor(); }, [fetchKlupplistor]); // Depend on the memoized fetch function

  // --- Reordering Logic ---
  const moveItem = useCallback(async (dragIndex, hoverIndex) => {
    setError(null);
    const itemsCopy = [...klupplistor];
    const [draggedItem] = itemsCopy.splice(dragIndex, 1);
    itemsCopy.splice(hoverIndex, 0, draggedItem);

    const itemsWithUpdatedPositions = itemsCopy.map((item, index) => ({
      ...item,
      position: index + 1
    }));

    setKlupplistor(itemsWithUpdatedPositions); // Optimistic UI update

    const updatedItemsPayload = itemsWithUpdatedPositions.map((item) => ({
        _id: item._id,
        position: item.position
    }));

    try {
         await axios.put(`${process.env.REACT_APP_API_URL}/api/klupplista/reorder`,
             { updatedItems: updatedItemsPayload },
             { headers: { Authorization: `Bearer ${token}` } }
         );
     } catch (err) {
         console.error('Error reordering klupplistor:', err);
         setError(err.response?.data?.message || 'Failed to save new order.');
         fetchKlupplistor(); // Revert on error
     }
  }, [klupplistor, token, fetchKlupplistor]); // Correct dependencies

  const moveItemUp = (index) => {
    if (index > 0) { moveItem(index, index - 1); }
  };

  const moveItemDown = (index) => {
      if (index < klupplistor.length - 1) { moveItem(index, index + 1); }
  };
  // --- End Reordering Logic ---


  // --- Editing Handlers ---
  const handleCellInteraction = (rowIndex, columnKey, currentValue) => {
    const now = Date.now();
    const DOUBLE_CLICK_THRESHOLD = 300;

    if (now - lastInteractionTime < DOUBLE_CLICK_THRESHOLD) {
      if (columnKey === 'position' || columnKey === 'status') return; // Prevent editing certain cols

      setEditingCell({ rowIndex, columnKey });
      setEditedValue(currentValue || '');
      setError(null);
    }
    setLastInteractionTime(now);
  };

  const handleEditChange = (e) => {
    setEditedValue(e.target.value);
  };

  const handleSaveEdit = async (rowIndex, columnKey) => {
    if (!editingCell || editingCell.rowIndex !== rowIndex || editingCell.columnKey !== columnKey) return;

    const itemToUpdate = klupplistor[rowIndex];
    if (!itemToUpdate) return;

    // Use optional chaining for safer access
    const currentValue = itemToUpdate?.[columnKey];
    if (String(currentValue || '') === String(editedValue)) {
        console.log("No change detected.");
        setEditingCell(null);
        setEditedValue('');
        return;
    }

    const updatePayload = { [columnKey]: editedValue };

    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/api/klupplista/${itemToUpdate._id}`,
            updatePayload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update local state with data returned from backend for consistency
        const updatedList = [...klupplistor];
        updatedList[rowIndex] = response.data; // Use backend response
        setKlupplistor(updatedList);

        setEditingCell(null);
        setEditedValue('');

    } catch (err) {
        console.error('Failed to save update:', err);
        setError(err.response?.data?.message || 'Failed to save changes.');
    }
  };

  const handleEditKeyDown = (e, rowIndex, columnKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(rowIndex, columnKey);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditedValue('');
    }
  };

   const handleEditBlur = (rowIndex, columnKey) => {
       // Save immediately on blur for simplicity here
       handleSaveEdit(rowIndex, columnKey);
   };
   // --- End Editing Handlers ---


  // --- Render Logic ---
  if (loading) return <p className={styles.loading}>Laddar Klupplistor...</p>;
  // Show error more prominently if loading failed
  if (error && klupplistor.length === 0 && !loading) return <p className={styles.error}>Fel: {error}</p>;
  // Handle case where list is empty after loading without error
  if (klupplistor.length === 0 && !loading && !error) return (
        <div className={styles.klupplistaContainer}>
             <h1>Klupplista</h1>
             <p className={styles.noItems}>Inga klupplistor att visa.</p>
        </div>
    );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.klupplistaContainer}>
        <h1>Klupplista</h1>
        {/* Display save errors here */}
        {error && <p className={styles.error}>Fel vid uppdatering: {error}</p>}
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Sågverk</th>
                <th>OrderNr</th>
                <th>Dimension</th>
                <th>Pkt Nr</th>
                <th>Längd</th>
                <th>Sort</th>
                <th>Märkning</th>
                <th>Magasin</th>
                <th>Lagerplats</th>
                <th>Info</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {klupplistor.map((item, index) => (
                <DraggableRow
                  key={item._id} // Use database ID as key
                  index={index}
                  item={item}
                  listLength={klupplistor.length}
                  moveItem={moveItem}
                  moveItemUp={moveItemUp}
                  moveItemDown={moveItemDown}
                  styles={styles}
                  // Pass editing props
                  editingCell={editingCell}
                  editedValue={editedValue}
                  handleCellInteraction={handleCellInteraction}
                  handleEditChange={handleEditChange}
                  handleEditKeyDown={handleEditKeyDown}
                  handleEditBlur={handleEditBlur}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DndProvider>
  );
};

export default KlupplistaManager;