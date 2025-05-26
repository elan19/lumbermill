import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './KantLista.module.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import io from 'socket.io-client';

import { useAuth } from '../../contexts/AuthContext';

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

  const [isGeneratingKantlistaPdf, setIsGeneratingKantlistaPdf] = useState(false);
  const kantlistaPdfContentRef = useRef(null);
  const [editableKantlistaText, setEditableKantlistaText] = useState('');
  const [isKantlistaTextEditModalOpen, setIsKantlistaTextEditModalOpen] = useState(false);

  const [isKantlistaPktNrModalOpen, setIsKantlistaPktNrModalOpen] = useState(false);
  const [currentCompletingKantlistaId, setCurrentCompletingKantlistaId] = useState(null);
  const [inputKantlistaPktNr, setInputKantlistaPktNr] = useState('');

  const { hasPermission } = useAuth();

  useEffect(() => {
    // Connect to the WebSocket server
    socket.current = io(`${process.env.REACT_APP_API_URL}`, {
      auth: {
        token: localStorage.getItem('token') // Send the token as part of the connection
      }
    }); // Adjust URL as needed
    socket.current.on('kantListUpdate', (data) => {
      // Fetch the updated list of orders from the backend
      fetchOrders();
    });

    socket.current.on('activeKantList', (data) => {
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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/kantlista`, {
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
    try {
      // Use the new toggle-active endpoint
  
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/kantlista/toggle-active/${kantlista._id}`, 
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

  const handleGenerateEditableKantlistaText = () => {
    if (activeKantlistor.length === 0) {
        alert("Inga aktiva kantlistor att generera text från.");
        return;
    }
    const text = generateEditableTextForKantlista();
    setEditableKantlistaText(text);
    setIsKantlistaTextEditModalOpen(true);
};

  const generateEditableTextForKantlista = () => {
    if (activeKantlistor.length === 0) {
        return "Inga aktiva kantlistor att visa.";
    }
    // Sort before generating text for consistency
    const sortedActiveKantlistor = [...activeKantlistor].sort((a, b) => (a.position || 0) - (b.position || 0));

    let textContent = '';
    sortedActiveKantlistor.forEach(item => {
        const orderNumber = item.orderNumber || '';
        const customer = item.customer || '';
        const antal = item.antal ? `${item.antal}PKT` : '';
        const tjocklek = item.tjocklek || '';
        const bredd = item.bredd || '';
        const varv = item.varv ? `${item.varv}v` : '';
        const maxLangd = item.max_langd ? `${item.max_langd}M` : '';
        const pktNr = item.pktNr ? `Pkt:${item.pktNr}` : '';
        const information = item.information || '';

        let lineParts = [];
        if (orderNumber) lineParts.push(orderNumber);
        if (customer) lineParts.push(customer);
        if (antal) lineParts.push(antal);
        if (tjocklek && bredd) lineParts.push(`${tjocklek}x${bredd}MM`);
        else if (tjocklek) lineParts.push(`${tjocklek}MM`);
        else if (bredd) lineParts.push(`x${bredd}MM`);
        if (varv) lineParts.push(varv);
        if (maxLangd) lineParts.push(maxLangd);
        if (pktNr) lineParts.push(pktNr);
        if (information) lineParts.push(information);

        textContent += lineParts.join(' ') + '\n'; // Add newline after each item
    });
    return textContent.trim(); // Trim trailing newline
  };

  const handleSaveEditedKantlistaTextAsPDF = async () => {
    setIsGeneratingKantlistaPdf(true); // Reuse existing loading state or create a new one
    // setError(null); // Clear error state

    const today = new Date();
    const dateStr = today.toLocaleDateString('sv-SE');
    const pdfFilename = `Kantlistor_Redigerad_${dateStr}.pdf`;

    if (!kantlistaPdfContentRef.current) { // Use the specific ref for kantlista
        console.error("Kantlista PDF content container ref not found.");
        setIsGeneratingKantlistaPdf(false);
        // setError("Kunde inte hitta PDF-innehållsbehållaren för kantlista.");
        return;
    }

    if (!editableKantlistaText.trim()) {
        alert("Inget textinnehåll att generera PDF från.");
        setIsGeneratingKantlistaPdf(false);
        return;
    }

    const titleText = "Kantlista"; // Or a more suitable title
    const generatedDateText = `Genererad: ${dateStr}`;
    const trimmedEditableText = editableKantlistaText.trimEnd();

    // --- CONSTRUCT HTML FROM EDITED TEXT ---
    // You can reuse the same CSS structure as your Prilista's editable text PDF
    // or create slightly different class names if needed.
    let contentHTML = `
      <style>
        .pdf-edited-content-container { /* Generic class, can be reused */
            font-family: Arial, sans-serif;
            background-color: white;
            color: #333;
            padding: 15mm; /* Add some padding for the content itself */
            padding-left: 5mm; /* Adjusted */
            padding-right: 5mm; /* Adjusted */
            box-sizing: border-box;
        }
        .pdf-edited-content-container * { /* Basic reset for content within */
            margin: 0;
            padding: 0;
            border: none !important;
            box-sizing: border-box !important;
            line-height: 1.4;
        }
        .pdf-title {
            font-size: 22px; /* Adjusted */
            font-weight: bold;
            text-align: center;
            color: #000;
            margin-bottom: 3mm;
        }
        .pdf-subtitle {
            font-size: 14px; /* Adjusted */
            text-align: center;
            color: #555;
            margin-bottom: 8mm;
        }
        .pdf-main-text pre {
            font-family: Arial, sans-serif;
            font-size: 14pt; /* Or your preferred size */
            white-space: pre-wrap;    /* Allows wrapping */
            word-wrap: break-word;    /* Breaks long words */
            background-color: white;
            color: #333;
        }
      </style>
      <div class="pdf-edited-content-container">
        <div class="pdf-title">${titleText}</div>
        <div class="pdf-subtitle">${generatedDateText}</div>
        <div class="pdf-main-text">
          <pre>${trimmedEditableText}</pre>
        </div>
      </div>
    `;

    kantlistaPdfContentRef.current.innerHTML = contentHTML;
    kantlistaPdfContentRef.current.style.display = 'block';
    kantlistaPdfContentRef.current.style.position = 'absolute';
    kantlistaPdfContentRef.current.style.left = '-9999px';
    kantlistaPdfContentRef.current.style.top = '-9999px';
    kantlistaPdfContentRef.current.style.width = '210mm'; // A4 width
    kantlistaPdfContentRef.current.style.backgroundColor = 'white';
    // No padding/margin on the ref itself, padding is in the container class

    try {
        const canvas = await html2canvas(kantlistaPdfContentRef.current, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: kantlistaPdfContentRef.current.offsetWidth, // Use offsetWidth
            windowHeight: kantlistaPdfContentRef.current.scrollHeight,
            removeContainer: false, 
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pdfPageWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        // pageMargin here is for the PDF document itself, not the HTML content padding
        const pageMargin = 15; 

        const imgEffectiveWidth = pdfPageWidth - (2 * pageMargin);
        const imgEffectiveHeight = (canvas.height * imgEffectiveWidth) / canvas.width;

        let positionYOnPage = pageMargin;
        let remainingImageHeight = imgEffectiveHeight;
        let imageOffsetY = 0;

        while (remainingImageHeight > 0) {
            if (imageOffsetY > 0) {
                pdf.addPage();
                positionYOnPage = pageMargin;
            }
            pdf.addImage(imgData, 'PNG', pageMargin, positionYOnPage - imageOffsetY, imgEffectiveWidth, imgEffectiveHeight);

            const heightDrawnThisLoop = pdfPageHeight - (2 * pageMargin);
            imageOffsetY += heightDrawnThisLoop;
            remainingImageHeight -= heightDrawnThisLoop;

            if (remainingImageHeight > 0 && imageOffsetY >= imgEffectiveHeight) {
                console.warn("Kantlista Editable PDF pagination safety break.");
                break;
            }
        }

        pdf.save(pdfFilename);
        setIsKantlistaTextEditModalOpen(false); // Close this specific modal

    } catch (pdfError) {
        console.error("Error generating editable Kantlista PDF:", pdfError);
        // setError("Kunde inte generera redigerad PDF för Kantlista.");
        alert("Kunde inte generera redigerad PDF för Kantlista.");
    } finally {
        if (kantlistaPdfContentRef.current) {
            kantlistaPdfContentRef.current.innerHTML = '';
            kantlistaPdfContentRef.current.style.display = 'none';
            // Reset other styles as needed
            kantlistaPdfContentRef.current.style.position = '';
            kantlistaPdfContentRef.current.style.left = '';
            kantlistaPdfContentRef.current.style.top = '';
            kantlistaPdfContentRef.current.style.width = '';
        }
        setIsGeneratingKantlistaPdf(false);
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
        `${process.env.REACT_APP_API_URL}/api/kantlista/reorder`,
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
    try {
      const params = new URLSearchParams({ dim: dimension });
      if (size) params.append("tum", size);
  
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/lagerplats/filter?${params}`, {
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
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/kantlista/update-lagerplats`, {
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

        const currentOrder = orders.find(order => order._id === id) || 
                             activeKantlistor.find(order => order._id === id); // Check active list too

        if (!currentOrder) {
            alert("Kantlista item not found.");
            return;
        }

        // If the action is "Kapad", proceed directly as before
        if (field === "kapad") {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/kantlista/cut/${id}`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                const updatedOrders = orders.map(order =>
                    order._id === id ? { ...order, status: { ...order.status, kapad: true } } : order
                );
                setOrders(updatedOrders.filter(order => !(order.status.kapad && order.status.klar)));
                // Also update activeKantlistor if the item is there
                setActiveKantlistor(prevActive => 
                    prevActive.map(order => 
                        order._id === id ? { ...order, status: { ...order.status, kapad: true } } : order
                    ).filter(order => !(order.status.kapad && order.status.klar)) // Also filter active list if it becomes fully complete
                );
            } else {
                throw new Error(`Failed to mark as kapad: ${response.status}`);
            }
            return; // Exit after handling "kapad"
        }

        // --- IF FIELD IS "klar" ---

        // If it's a "Lager" item and being marked "klar", process it directly to Lagerplats
        if (currentOrder.customer === "Lager" && field === "klar") {
            // --- EXISTING LOGIC FOR "LAGER" ITEMS WHEN "KLAR" ---
            const newLagerplats = {
                type: "Kantat",
                tree: currentOrder.typ || "Okänt", // Assuming 'typ' is Träslag for Kantlista
                dim: currentOrder.tjocklek, // Combine tjocklek and bredd for dim
                location: "-", // Or a default, or from currentOrder.lagerplats
                kantatData: {
                    bredd: currentOrder.bredd,
                    varv: currentOrder.varv,
                    max_langd: currentOrder.max_langd,
                    kvalite: "-", // Default or from item
                    pktNr: currentOrder.pktNr || null, // Pass existing pktNr
                },
            };
            const addResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/lagerplats`, newLagerplats,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (addResponse.status === 201) {
                await axios.delete(
                    `${process.env.REACT_APP_API_URL}/api/kantlista/${id}`, // General delete endpoint for Kantlista
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                // Optimistic update for all lists
                const filterOut = (prev) => prev.filter(order => order._id !== id);
                setOrders(filterOut);
                setActiveKantlistor(filterOut);
                // fetchOrders(); // Or re-fetch
            } else {
                 throw new Error(`Failed to add Kantlista ('Lager') to lager: ${addResponse.status}`);
            }
            return; // Exit after handling "Lager" item completion
        }
        // --- END OF "LAGER" ITEM LOGIC for "klar" ---

        // --- FOR REGULAR (NON-LAGER) ITEMS BEING MARKED "klar", OPEN THE MODAL ---
        if (field === "klar") {
            setCurrentCompletingKantlistaId(id);
            setInputKantlistaPktNr(currentOrder.pktNr || ''); // Pre-fill if pktNr already exists
            setIsKantlistaPktNrModalOpen(true);
        }

    } catch (error) {
        console.error("Error in handleComplete for Kantlista:", error);
        alert("Misslyckades med att uppdatera artikelstatus. " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmitKantlistaPktNrAndComplete = async () => {
    if (!currentCompletingKantlistaId) return;

    const finalPktNr = inputKantlistaPktNr.trim() || null;

    // Optional: Basic validation for pktNr if it's entered and your schema is Number
    // if (inputKantlistaPktNr.trim() && isNaN(parseInt(finalPktNr, 10)) && finalPktNr !== null) {
    //     alert("Paketnummer måste vara ett giltigt nummer.");
    //     return;
    // }

    try {
        if (!token) {
            alert("Authorization token is missing.");
            setIsKantlistaPktNrModalOpen(false);
            return;
        }

        // API Call to mark as "klar" and update PktNr
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/api/kantlista/completed/${currentCompletingKantlistaId}`, // Endpoint for marking 'klar'
            { pktNr: finalPktNr }, // Send pktNr
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
            const updatedItemFromServer = response.data; // Get the full updated item

            // Optimistically update the local state for both 'orders' and 'activeKantlistor'
            const updateList = (prevList) =>
                prevList.map(order =>
                    order._id === currentCompletingKantlistaId
                        ? { 
                            ...order, 
                            status: { ...order.status, klar: true }, 
                            pktNr: updatedItemFromServer.pktNr // Use pktNr from server response
                          }
                        : order
                ).filter(order => !(order.status.kapad && order.status.klar)); // Filter if now fully complete

            setOrders(updateList);
            setActiveKantlistor(updateList);


            // Emit socket event if needed
            if (socket.current) {
                // Send enough info for other clients to update
                socket.current.emit('kantListItemCompleted', { 
                    id: currentCompletingKantlistaId, 
                    status: { klar: true, kapad: updatedItemFromServer.status.kapad }, // Send full status
                    pktNr: updatedItemFromServer.pktNr 
                });
            }
            // fetchOrders(); // Or rely on optimistic update + socket
        } else {
            throw new Error(`Failed to mark Kantlista as klar: ${response.status}`);
        }
    } catch (error) {
        console.error('Error completing Kantlista item with PktNr:', error);
        alert('Misslyckades med att markera artikeln som klar. ' + (error.response?.data?.message || error.message));
    } finally {
        setIsKantlistaPktNrModalOpen(false);
        setCurrentCompletingKantlistaId(null);
        setInputKantlistaPktNr('');
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
          {hasPermission('kantlista', 'create') && (
          <button
            className={styles.createButton}
            onClick={() => navigate('/dashboard/new-kantlista')}
          >
            Skapa ny kantad
          </button>
          )}

          <button 
            onClick={handleGenerateEditableKantlistaText} 
            className={styles.editTextButton} // Reuse or create new style
            disabled={isGeneratingKantlistaPdf || activeKantlistor.length === 0}
          >
            Redigera Text & Skapa PDF
          </button>
        </div>

        {/* Use kantlistaPdfContentRef for the hidden div */}
        <div ref={kantlistaPdfContentRef} style={{ display: 'none', width: '210mm' }}></div>
        
        {/* --- MODAL FOR EDITING KANTLISTA TEXT --- */}
        {isKantlistaTextEditModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsKantlistaTextEditModalOpen(false)}>
              <div className={styles.modalContentTextEdit} onClick={(e) => e.stopPropagation()}> {/* Reuse existing modal styles */}
                  <h2 className={styles.modalTitle}>Redigera Kantlistor Text</h2>
                  <textarea
                      className={styles.editableTextArea} // Reuse existing textarea style
                      value={editableKantlistaText}
                      onChange={(e) => setEditableKantlistaText(e.target.value)}
                      rows="20"
                  />
                  <div className={styles.textEditModalActions}> {/* Reuse existing actions style */}
                      <button
                          onClick={handleSaveEditedKantlistaTextAsPDF}
                          className={styles.saveTextPdfButton} // Reuse existing button style
                          disabled={isGeneratingKantlistaPdf}
                      >
                          {isGeneratingKantlistaPdf ? 'Genererar PDF...' : 'Spara som PDF'}
                      </button>
                      <button
                          onClick={() => setIsKantlistaTextEditModalOpen(false)}
                          className={styles.cancelTextEditButton} // Reuse existing button style
                          disabled={isGeneratingKantlistaPdf}
                      >
                          Avbryt
                      </button>
                  </div>
              </div>
          </div>
        )}

        {/** Aktiva Kantlistor Table */}
        <div className={styles.orderList}>
          <h2 className={styles.title}>Aktiva Kantlista</h2>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Ordernummer</th>
                <th>Kund</th>
                <th>Data</th>
                <th>Pkt Nr</th>
                <th>Lagerplats</th>
                <th>Information</th>
                <th>Klar</th>
                <th>Kapad</th>
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
                  <td data-label="Data">
                    {kantlista.antal && `${kantlista.antal}PKT `}
                    {kantlista.tjocklek} x {kantlista.bredd} - {kantlista.varv}varv - {kantlista.max_langd}m - {kantlista.stampel || '-'}
                  </td>
                  <td data-label="Pkt Nr">{kantlista.pktNr || '-'}</td> {/* <-- DISPLAY Pkt Nr */}
                  <td data-label="Lagerplats">{kantlista.lagerplats || '-'}</td>
                  <td data-label="Information">{kantlista.information || '-'}</td>
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

        {/* --- MODAL FOR ENTERING Paketnummer FOR KANTLISTA --- */}
        {isKantlistaPktNrModalOpen && (
          <div className={styles.modalOverlay}> {/* Reuse Prilista's modalOverlay style */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Reuse Prilista's modalContent style */}
              <h3 className={styles.modalTitle}>Ange Paketnummer (Valfritt)</h3>
              <div className={styles.inputGroupModal}> {/* Reuse or create styles */}
                <label htmlFor="inputKantlistaPktNr">Paketnummer:</label>
                <input
                  type="text" // Allow text input, backend will handle parsing if schema is Number
                  id="inputKantlistaPktNr"
                  value={inputKantlistaPktNr}
                  onChange={(e) => setInputKantlistaPktNr(e.target.value)}
                  className={styles.modalInput} // Reuse or create
                  placeholder="Lämna tomt för inget pktnr"
                />
              </div>
              <div className={styles.modalActions}> {/* Reuse or create */}
                <button
                  onClick={handleSubmitKantlistaPktNrAndComplete}
                  className={styles.modalButtonConfirm} // Reuse or create
                >
                  Spara & Markera Klar
                </button>
                <button
                  onClick={() => {
                    // If "Fortsätt utan" means truly no pktNr, ensure input is cleared before submitting
                    // For simplicity, current handleSubmitKantlistaPktNrAndComplete treats empty input as null.
                    handleSubmitKantlistaPktNrAndComplete(); 
                  }}
                  className={styles.modalButtonSecondary} // Reuse or create
                >
                  Fortsätt utan Paketnummer
                </button>
                <button
                  onClick={() => {
                    setIsKantlistaPktNrModalOpen(false);
                    setCurrentCompletingKantlistaId(null);
                    setInputKantlistaPktNr('');
                  }}
                  className={styles.modalButtonCancel} // Reuse or create
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}
        {/* --- END KANTLISTA Paketnummer MODAL --- */}

        <div className={styles.orderList}>
          <h2 className={styles.title}>Hela kantlista</h2>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Ordernummer</th>
                <th>Kund</th>
                <th>Tjocklek</th>
                <th>Data</th>
                <th>Pkt Nr</th>
                <th>Lagerplats</th>
                <th>Information</th>
                <th>Klar</th>
                <th>Kapad</th>
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
      <td data-label="Data">
        {order.antal && `${order.antal}PKT `}
        {order.tjocklek} x {order.bredd} - {order.varv}varv - {order.max_langd}m - {order.stampel || ''}
      </td>
      <td data-label="Pkt Nr">{order.pktNr || '-'}</td>
      <td data-label="Lagerplats">{order.lagerplats || '-'}</td>
      <td data-label="Information">{order.information || '-'}</td>
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
