import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Modal from 'react-modal';
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
    handleEditChange, handleEditKeyDown, handleEditBlur,
    handleKluppStatusChange
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

  // Handle "Klar" checkbox change
  const onKlarChange = (e) => {
    const newKlarStatus = e.target.checked;
    handleKluppStatusChange(index, 'klar', newKlarStatus);
  };

  // Handle "Ej Klar" reason select change
  const onEjKlarReasonChange = (e) => {
    const reasonCode = e.target.value ? parseInt(e.target.value, 10) : null;
    handleKluppStatusChange(index, 'ej_Klar', reasonCode); // Pass 'ej_Klar' as field
  };

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
      <td data-label="Status" className={styles.statusCell}>
        <div className={styles.statusControlWrapper}> {/* Wrapper for all status controls */}
            <div className={styles.statusGroup}> {/* Group for "Klar" checkbox */}
                <label className={styles.statusLabel} htmlFor={`statusKlar-${index}`}>
                    Klar
                    <input
                        type="checkbox"
                        id={`statusKlar-${index}`} // Unique ID for label association
                        name="status.klar" // Used by handler
                        checked={!!item.status?.klar}
                        onChange={onKlarChange}
                        disabled={item.status?.ej_Klar !== null && item.status?.ej_Klar !== undefined}
                    />
                </label>
            </div>

            {/* Conditionally render "Ej Klar" reason section */}
            {!item.status?.klar && (
                <div className={styles.statusGroup}> {/* Group for "Ej Klar" dropdown */}
                    <label htmlFor={`ejKlarReason-${index}`} className={styles.ejKlarReasonLabel}>Anledning:</label>
                    <select
                        id={`ejKlarReason-${index}`}
                        name="status.ej_Klar"
                        value={item.status?.ej_Klar || ""}
                        onChange={onEjKlarReasonChange}
                        className={styles.statusSelect}
                        disabled={!!item.status?.klar}
                    >
                        <option value="">- Välj -</option>
                        <option value="1">Ej Hittad</option>
                        <option value="2">Inte hunnit</option>
                        <option value="3">Övrigt</option>
                    </select>
                </div>
            )}
        </div>
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

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

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

   const handleKluppStatusChange = async (rowIndex, field, value) => {
    const itemToUpdate = klupplistor[rowIndex];
    if (!itemToUpdate) return;

    let newStatus = { ...itemToUpdate.status }; // Clone current status

    if (field === 'klar') {
        newStatus.klar = value; // value is boolean from checkbox
        if (newStatus.klar === true) {
            newStatus.ej_Klar = null; // If "Klar" is true, clear any "Ej Klar" reason
        }
    } else if (field === 'ej_Klar') { // Field is now directly 'ej_Klar' from select name
        newStatus.ej_Klar = value; // value is number (1,2,3) or null from select
        if (newStatus.ej_Klar !== null && newStatus.ej_Klar !== undefined) {
            newStatus.klar = false; // If an "Ej Klar" reason is set, "Klar" must be false
        }
    }

    const updatePayload = { status: newStatus };

    // Optimistic UI Update for status
    const updatedListOptimistic = [...klupplistor];
    updatedListOptimistic[rowIndex] = {
        ...updatedListOptimistic[rowIndex],
        status: newStatus
    };
    setKlupplistor(updatedListOptimistic);

    // Backend Update
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/api/klupplista/${itemToUpdate._id}`,
            updatePayload, // Send the whole status object
            { headers: { Authorization: `Bearer ${token}` } }
        );
        // Optionally update with response.data for full sync if backend returns updated item
        // const updatedListBackend = [...klupplistor];
        // updatedListBackend[rowIndex] = response.data;
        // setKlupplistor(updatedListBackend);
        console.log("Klupplista status updated:", response.data);
    } catch (err) {
        console.error('Failed to update klupplista status:', err);
        setError(err.response?.data?.message || 'Failed to update status.');
        fetchKlupplistor(); // Revert optimistic update on error
    }
  };
   // --- End Editing Handlers ---

  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);


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
        <div className={styles.header}>
          {/* Help Button */}
          <button onClick={openHelpModal} className={styles.helpButton}>
            Hjälp / Info
          </button>
          </div>
        {/* Display save errors here */}
        {error && <p className={styles.error}>Fel vid uppdatering: {error}</p>}
        {/* --- HELP MODAL --- */}
        {/* Use your preferred Modal component. This is a conceptual example. */}
        {isHelpModalOpen && (
            <div className={styles.modalOverlay} onClick={closeHelpModal}> {/* Close on overlay click */}
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
                    <h2 className={styles.modalTitle}>Information</h2>
                    <div className={styles.helpSection}>
                        <h3>Magasin:</h3>
                        <ul>
                            <li>Kajen = <strong>Kaj</strong></li>
                            <li>Pump = <strong>Pum</strong></li>
                            <li>Kinda = <strong>Kin</strong></li>
                        </ul>
                    </div>
                    <div className={styles.helpSection}>
                        <h3>Lagerplats (Format: Sida-Fack-Rad):</h3>
                        <ul>
                            <li>Sida: Vänster = <strong>V</strong>, Höger = <strong>H</strong></li>
                            <li>Fack: <strong>1-6</strong></li>
                            <li>Rad: <strong>1-6</strong></li>
                            <li>Exempel: <strong>V-3-2</strong> (Vänster, Fack 3, Rad 2)</li>
                        </ul>
                    </div>
                    <div className={styles.helpSection}>
                        <h3>Sort (Träslag):</h3>
                        <ul>
                            <li>Furu = <strong>F</strong></li>
                            <li>Gran = <strong>Gr</strong></li>
                            {/* Add others if applicable */}
                        </ul>
                    </div>
                    <div className={styles.helpSection}>
                        <h3>Klar:</h3>
                        <ul>
                            <li>För att klicka i "Klar" krävs: <strong>' - Välj - '</strong> under "Anledning"</li>
                            {/* Add others if applicable */}
                        </ul>
                    </div>
                    <div className={styles.helpSection}>
                        <h3>Extra:</h3>
                        <ul>
                            <li>Dubbelklicka på text inuti rad för att ändra<strong></strong></li>
                            <li>Klicka och håll med mus eller använd pilarna för att förflytta paket upp och ner</li>
                            <li>Klicka på ordernumret för att komma till ordern</li>
                            {/* Add others if applicable */}
                        </ul>
                    </div>
                    <button onClick={closeHelpModal} className={styles.modalCloseButton}>
                        Stäng
                    </button>
                </div>
            </div>
        )}
        {/* --- END HELP MODAL --- */}
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
                  handleKluppStatusChange={handleKluppStatusChange}
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