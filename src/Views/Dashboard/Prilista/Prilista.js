import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './Prilista.module.css';

import io from 'socket.io-client';

import { useAuth } from '../../../contexts/AuthContext';


const ItemType = {
  ORDER: 'order',
};

const Prilista = () => {
  const [orders, setOrders] = useState([]);
  const [ishallenOrders, setIshallenOrders] = useState([]);
  const [bsidanOrders, setBsidanOrders] = useState([]);
  const [asidanOrders, setAsidanOrders] = useState([]);
  const [emptyLocationOrders, setEmptyLocationOrders] = useState([]);
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

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // For loading state during PDF gen
  const pdfContentRef = useRef(null);
  const [editablePdfText, setEditablePdfText] = useState('');
  const [isTextEditModalOpen, setIsTextEditModalOpen] = useState(false);
  const [error, setError] = useState(false);

  const { hasPermission } = useAuth();

  useEffect(() => {
    // Connect to the WebSocket server
    fetchUserData();
    socket.current = io(`${process.env.REACT_APP_API_URL}`, {
    transports: ['websocket'],
    auth: {
      token: localStorage.getItem('token')
    }
    }); // Adjust URL as needed
    socket.current.on('orderUpdated', (data) => {
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

    updateDeviceType();

    window.addEventListener('resize', updateDeviceType);

    return () => {
      // Cleanup listener on unmount
      window.removeEventListener('resize', updateDeviceType);
    };
  }, [isTouchDevice]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');
  
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const data = response.data;
  
      if (response.status === 200) {
        setUser(data);
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

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/prilista/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const incompleteOrders = response.data.filter(order => !order.completed);
      const sortedOrders = incompleteOrders.sort((a, b) => a.position - b.position);
      setOrders(sortedOrders);

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
        const refreshResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/refresh-token`, { refreshToken });
        const newToken = refreshResponse.data.token;
        
        // Store the new token in localStorage
        localStorage.setItem('token', newToken);
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
      fetchOrders(); // Fetch orders after the user is fetched
    }
  
  }, [user]);

  const moveOrder = async (dragIndex, hoverIndex, list) => {
    // Update the local UI to reflect the new order
    const updatedOrders = [...list];
    const [movedOrder] = updatedOrders.splice(dragIndex, 1);
    updatedOrders.splice(hoverIndex, 0, movedOrder);
  
    // Update the local state
    setOrders(updatedOrders);
  
    // Calculate the new positions for all affected orders
    const reorderedOrders = updatedOrders.map((order, index) => ({
      ...order,
      position: index + 1,
    }));
  
    // Send the updated positions to the backend
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/prilista/reorder`,
        { updatedOrders: reorderedOrders },
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
      await axios.put(`${process.env.REACT_APP_API_URL}/api/prilista/reorder/up`, {
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
      await axios.put(`${process.env.REACT_APP_API_URL}/api/prilista/reorder/up`, {
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

   const handleDeletePrilistaItem = async (itemId) => {
    if (!window.confirm("Är du säker på att du vill radera denna Prilista artikel permanent?")) {
      return; // User canceled
    }

    try {
      if (!token) {
        alert("Autentisering krävs.");
        return;
      }

      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/prilista/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        // Optimistically update the UI by removing the item from all relevant local state arrays
        setOrders(prev => prev.filter(order => order._id !== itemId));
        setIshallenOrders(prev => prev.filter(order => order._id !== itemId));
        setBsidanOrders(prev => prev.filter(order => order._id !== itemId));
        setAsidanOrders(prev => prev.filter(order => order._id !== itemId));
        setEmptyLocationOrders(prev => prev.filter(order => order._id !== itemId));
        
        // alert(response.data.message || "Prilista artikel raderad!"); // Optional success feedback

        // You might not need to call fetchOrders() immediately if optimistic update is good enough
        // but it can ensure consistency if there are other side effects or views.
        // fetchOrders(); 

        // If you emit a socket event from backend for deletion, other clients will update via that.
        // If not, and this client needs to inform others, you could consider emitting here too,
        // though usually the backend handles authoritative state changes.
      } else {
        throw new Error(`Failed to delete Prilista item: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting Prilista item:', error);
      alert('Misslyckades med att radera Prilista artikel. ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateLagerplats = async (prilistaId, newLocation) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/prilista/update-lagerplats`, {
        prilistaId,
        location: newLocation,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 200) {
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
  

  const handleComplete = async (id) => { // Removed 'field' parameter as Prilista only has 'completed'
    try {
      if (!token) {
        alert("Authorization token is missing.");
        return;
      }

      // Find the current Prilista item to check its properties
      const currentPrilistaItem = orders.find(order => order._id === id);
      // If using combined allOrders, search there:
      // const currentPrilistaItem = allOrders.find(order => order._id === id);


      if (!currentPrilistaItem) {
        alert("Prilista item not found.");
        return;
      }

      // --- LOGIC FOR "LAGER" ITEMS ---
      if (currentPrilistaItem.customer === "Lager") {
        const newLagerplats = {
          type: "Okantat",
          tree: currentPrilistaItem.type || "Okänt",
          dim: currentPrilistaItem.dimension ? parseInt(currentPrilistaItem.dimension, 10) : 0,
          location: currentPrilistaItem.location || "-",
          okantatData: {
            typ: currentPrilistaItem.size || "-",
            kvalite: "A",
            varv: "-",
            nt: "-",
            pktNr: currentPrilistaItem.pktNr
          },
        };

        try {
            const addResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/lagerplats`,
                newLagerplats,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (addResponse.status === 201) {
                // Now delete the original Prilista item
                const deleteResponse = await axios.delete(
                    `${process.env.REACT_APP_API_URL}/api/prilista/${id}`, // Use the correct Prilista delete endpoint
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (deleteResponse.status === 200 || deleteResponse.status === 204) { // 204 for no content on delete
                    // Optimistically remove from local state and re-fetch
                    setOrders(prevOrders => prevOrders.filter(order => order._id !== id));
                    fetchOrders(); // Re-fetch to ensure consistency
                    // alert("Prilista ('Lager') flyttad till Lagerplats!"); // Optional user feedback
                } else {
                     throw new Error(`Failed to delete Prilista item after adding to lager: ${deleteResponse.status}`);
                }
            } else {
                throw new Error(`Failed to add Prilista item to lager: ${addResponse.status}`);
            }
        } catch (lagerError) {
            console.error("Error processing 'Lager' Prilista item:", lagerError);
            alert("Misslyckades att flytta 'Lager' Prilista till Lagerplats.");
            // Optionally re-fetch orders to reset UI if part of the operation failed
            fetchOrders();
        }
        return; // Exit function after handling "Lager" item
      }
      // --- END OF "LAGER" ITEM LOGIC ---


      // --- LOGIC FOR REGULAR (NON-LAGER) PRILISTA ITEMS ---
      // Mark the Prilista item as completed
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/prilista/complete/${id}`,
        {}, // Empty body as per your original function
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Optimistically update the local state
        // The filter also removes it from the 'orders' (incomplete) list
        setOrders(prevOrders =>
          prevOrders
            .map(order => (order._id === id ? { ...order, completed: true } : order))
            .filter(order => !order.completed) // Keep this filter if 'orders' state is for incomplete items
        );

        // Emit socket event if you still want to for regular completions
        if (socket.current) {
            socket.current.emit('itemCompleted', { id, completed: true }); // Send relevant data
        }

        fetchOrders(); // Re-fetch to ensure data consistency, especially for dependent order status
      } else {
         throw new Error(`Failed to mark Prilista as completed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error completing Prilista item:', error);
      alert('Failed to mark item as completed. ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFilterClick = async (prilistaId, dimension, size) => {
    try {
      const params = new URLSearchParams({ dim: dimension });
      if (size) params.append('tum', size);

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
        pktNr: item.sawData.pktNr || "-",
      }));
      setFilteredLocations(transformedData);
      setFilterCriteria({ dimension, size });
      setCurrentPrilistaId(prilistaId);
    } catch (error) {
      console.error('Error fetching filtered Lagerplatser:', error);
      alert('Failed to fetch filtered Lagerplatser');
    }
  };

  // --- PDF DOWNLOAD FUNCTION ---
  const handleDownloadPrilistaPDF = async () => {
    setIsGeneratingPdf(true);
    setError(null);

    const today = new Date();
    const dateStr = today.toLocaleDateString('sv-SE');
    const pdfFilename = `Prilista_Mätlista_${dateStr}.pdf`;

    if (!pdfContentRef.current) {
        console.error("PDF content container ref not found.");
        setIsGeneratingPdf(false);
        setError("Kunde inte hitta PDF-innehållsbehållaren.");
        return;
    }

    const dataToExport = isFiltered ? allOrders : orders.sort((a, b) => (a.position || 0) - (b.position || 0));

    if (dataToExport.length === 0) {
        alert("Det finns inga data att exportera till PDF.");
        setIsGeneratingPdf(false);
        return;
    }

    // --- CONSTRUCT HTML FOR PDF ---
    let contentHTML = `
      <style>
        .pdf-prilista-container {
            font-family: Arial, sans-serif;
            padding-top: 15mm; /* Reduced top padding a bit */
            padding-left: 5mm; /* Add some left padding for content */
            padding-right: 5mm;/* Add some right padding for content */
            background-color: white;
            color: #333;
            width: 210mm; /* Full A4 width */
            box-sizing: border-box; /* Crucial for width calculation with padding */
            border: none !important;
            outline: none !important;
        }
        .pdf-prilista-container h2 {
            font-size: 22px; /* Slightly smaller */
            text-align: center;
            color: #000;
            margin-top: 0;
            margin-bottom: 1mm; /* Space after title */
            padding: 0;
            border: none !important;
        }
        .pdf-prilista-container h3 {
            font-size: 14px; /* Slightly smaller */
            text-align: center;
            color: #555;
            margin-top: 0;
            margin-bottom: 2mm; /* Space after subtitle */
            padding: 0;
            border: none !important;
        }
        .pdf-prilista-item {
            margin-bottom: 1.5mm; /* Space between items */
            padding-bottom: 0;   /* No extra padding at bottom of item div */
            font-size: 13pt;      /* Reduced font size for items */
            line-height: 1.2;     /* Adjusted line height */
            border: none !important; /* Ensure no border on the item container */
            /* display: flex; /* Removed flex as it can complicate wrapping with nowrap removed */
            /* flew-wrap: wrap; */
        }
        /* Removed :last-child rule as border:none is on all items now */

        .pdf-prilista-item .details-line {
            /* margin-left: 5px; /* You can remove if not needed or reduce */
            color: #444;
            /* font-size: 14px; /* Font size now on .pdf-prilista-item */
            border: none !important;
            white-space: normal;   /* <<< KEY CHANGE: Allow text to wrap */
            overflow-wrap: break-word; /* Help break long words */
            word-wrap: break-word;     /* Older browser support */
            display: block; /* Ensure it behaves like a block for wrapping */
        }
        /* Removed .info-text as it wasn't used in the item generation loop */
      </style>
      <div class="pdf-prilista-container">
        <h2>Mätlista</h2>
        <h3>Genererad: ${dateStr}</h3>
    `;

    dataToExport.forEach(item => {
        // Ensure all parts are strings and handle undefined/null
        const orderNumber = item.orderNumber || '';
        const customer = item.customer || '';
        const quantity = item.quantity ? `${item.quantity}PKT` : '';
        const dimension = item.dimension ? `${item.dimension}MM` : '';
        const size = item.size || '';
        const type = item.type || '';
        const description = item.description || '';

        contentHTML += `
            <div class="pdf-prilista-item">
                <div class="details-line">
                    ${orderNumber}${orderNumber && customer ? ' ' : ''}${customer}${customer && (quantity || dimension || size || type || description) ? ' ' : ''}${quantity}${quantity && (dimension || size || type || description) ? ' ' : ''}${dimension}${dimension && (size || type || description) ? ' ' : ''}${size}${size && (type || description) ? ' ' : ''}${type}${type && description ? ' ' : ''}${description}
                </div>
            </div>
        `;
    });

    contentHTML += `</div>`; // Close pdf-prilista-container
    // --- END OF HTML CONSTRUCTION ---

    pdfContentRef.current.innerHTML = contentHTML;
    pdfContentRef.current.style.display = 'block';
    pdfContentRef.current.style.position = 'absolute';
    pdfContentRef.current.style.left = '-9999px';
    pdfContentRef.current.style.top = '-9999px';
    pdfContentRef.current.style.width = '210mm'; // A4 width
    pdfContentRef.current.style.backgroundColor = 'white';
    pdfContentRef.current.style.padding = '0'; // No padding on the off-screen ref itself
    pdfContentRef.current.style.margin = '0';


    try {
        const canvas = await html2canvas(pdfContentRef.current, {
            scale: 2.5, // High scale for better quality, but can increase processing time
            useCORS: true,
            logging: false, // Set to true for debugging html2canvas issues
            backgroundColor: '#ffffff', // Explicitly set background for canvas
            windowWidth: pdfContentRef.current.offsetWidth, // Use offsetWidth for more reliable width
            windowHeight: pdfContentRef.current.scrollHeight,
            // x: 0, // Ensure capture starts from the left edge of the element
            // y: 0, // Ensure capture starts from the top edge of the element
            removeContainer: false, // Keep true if you don't need to inspect it after
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfPageWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const pageMargin = 15; // Your desired margin on the PDF page

        // Calculate image dimensions to fit within PDF page margins
        const imgEffectiveWidth = pdfPageWidth - (2 * pageMargin);
        const imgEffectiveHeight = (canvas.height * imgEffectiveWidth) / canvas.width;

        let positionYOnPage = pageMargin;
        let remainingImageHeight = imgEffectiveHeight;
        let imageOffsetY = 0; // How much of the source image has been drawn

        while (remainingImageHeight > 0) {
            const drawableHeightOnPage = pdfPageHeight - (2 * pageMargin);
            const heightToDrawThisPage = Math.min(remainingImageHeight, drawableHeightOnPage);

            // Add the current slice of the image
            // We need to use the addImage overload that allows specifying source coordinates (sx, sy, sw, sh)
            // to clip the canvas image for pagination.
            // However, jsPDF's basic addImage for a full canvas data URL doesn't directly support slicing
            // the source image in this way for pagination. The typical approach with a single large
            // canvas is to adjust the 'y' position of the *same full image* on subsequent pages.

            if (imageOffsetY > 0) { // If it's not the first page
                pdf.addPage();
                positionYOnPage = pageMargin; // Reset Y position for the new page
            }

            // The y-offset for the image on subsequent pages needs to account for what's already drawn.
            // We are adding the *entire* image but positioning its *top edge* with a negative offset.
            pdf.addImage(imgData, 'PNG', pageMargin, positionYOnPage - imageOffsetY, imgEffectiveWidth, imgEffectiveHeight);

            const heightDrawnThisLoop = pdfPageHeight - (2 * pageMargin); // Max content height on one PDF page
            imageOffsetY += heightDrawnThisLoop;
            remainingImageHeight -= heightDrawnThisLoop;

            if (remainingImageHeight > 0 && imageOffsetY >= imgEffectiveHeight) {
                // Safety break if calculations are off to prevent infinite loop
                console.warn("PDF pagination safety break triggered.");
                break;
            }
        }

        pdf.save(pdfFilename);

    } catch (pdfError) {
        console.error("Error generating Prilista PDF:", pdfError);
        setError("Kunde inte generera PDF för Prilista.");
    } finally {
        if (pdfContentRef.current) {
            pdfContentRef.current.innerHTML = '';
            pdfContentRef.current.style.display = 'none';
            // Reset other styles as before
            pdfContentRef.current.style.position = '';
            pdfContentRef.current.style.left = '';
            pdfContentRef.current.style.top = '';
            pdfContentRef.current.style.width = '';
            pdfContentRef.current.style.padding = '';
            pdfContentRef.current.style.margin = '';
        }
        setIsGeneratingPdf(false);
    }
  };
  // --- END PDF DOWNLOAD FUNCTION ---

  const generateEditableTextForPrilista = () => {
    const dataToExport = isFiltered ? allOrders : orders.sort((a, b) => (a.position || 0) - (b.position || 0));

    if (dataToExport.length === 0) {
        return "Inga artiklar att visa.";
    }

    // --- CONSTRUCT TEXT ---
    let textContent = ``;

    dataToExport.forEach(item => {
      textContent += `${item.orderNumber || ''}${item.orderNumber ? ' ' : ''}${item.customer || ''} ${item.quantity ? `${item.quantity}PKT` : ''} ${item.dimension ? `${item.dimension}MM` : ''} ${item.size || ''} ${item.type || ''} ${item.description || ''}\n`;
    });
    // --- END OF TEXT CONSTRUCTION ---

    return textContent;
};

const handleGenerateEditableText = () => {
    const text = generateEditableTextForPrilista();
    setEditablePdfText(text);
    setIsTextEditModalOpen(true);
};

const handleSaveEditedTextAsPDF = async () => {
    setIsGeneratingPdf(true);
    setError(null);

    const today = new Date();
    const dateStr = today.toLocaleDateString('sv-SE');
    const pdfFilename = `Prilista_Mätlista_${dateStr}.pdf`;

    if (!pdfContentRef.current) {
        console.error("PDF content container ref not found.");
        setIsGeneratingPdf(false);
        setError("Kunde inte hitta PDF-innehållsbehållaren.");
        return;
    }

    if (!editablePdfText.trim()) {
        alert("Inget textinnehåll att generera PDF från.");
        setIsGeneratingPdf(false);
        return;
    }

    const titleText = "Mätlista";
    const generatedDateText = `Genererad: ${dateStr}`;

    const trimmedEditablePdfText = editablePdfText.trimEnd();

    // --- CONSTRUCT HTML FROM EDITED TEXT ---
    let contentHTML = `
      <style>
        /* Reset everything for PDF capture area */
        .pdf-edited-content-container,
        .pdf-edited-content-container * {
            margin: 0;
            padding: 0;
            border: none !important;
            box-sizing: border-box !important;
            line-height: 1.4;
            top: 60px;
        }
        .pdf-edited-content-container {
            font-family: Arial, sans-serif;
            background-color: white;
            color: #333;
        }
        .pdf-title {
            font-size: 26px;
            font-weight: bold;
            text-align: center;
            color: #000;
        }
        .pdf-subtitle {
            font-size: 16px;
            text-align: center;
            color: #555;
            padding-bottom: 15px; /* Space below subtitle, within its own block */
        }
        .pdf-main-text {
            background-color: white;
        }
        .pdf-edited-content-container pre {
            font-family: Arial, sans-serif;
            font-size: 18px;
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: white;
        }
      </style>
      <div class="pdf-edited-content-container">
        <div class="pdf-title">${titleText}</div>
        <div class="pdf-subtitle">${generatedDateText}</div>
        <div class="pdf-main-text">
          <pre>${trimmedEditablePdfText}</pre>
        </div>
      </div>
    `;

    pdfContentRef.current.innerHTML = contentHTML;
    pdfContentRef.current.style.display = 'block';
    pdfContentRef.current.style.position = 'absolute';
    pdfContentRef.current.style.left = '-9999px';
    pdfContentRef.current.style.top = '-9999px';
    pdfContentRef.current.style.width = '210mm';
    pdfContentRef.current.style.backgroundColor = 'white';
    pdfContentRef.current.style.padding = '0';
    pdfContentRef.current.style.margin = '0';


    try {
        const canvas = await html2canvas(pdfContentRef.current, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff', 
            windowWidth: pdfContentRef.current.scrollWidth,
            windowHeight: pdfContentRef.current.scrollHeight,
            removeContainer: true,
            x: 0, // Capture from the very left of the element
            y: -60, // Capture from the very top of the element
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const pageMargin = 15; // This is the margin for the PDF page itself

        const imgEffectiveWidth = pdfWidth - (2 * pageMargin);
        const imgEffectiveHeight = (canvas.height * imgEffectiveWidth) / canvas.width;

        let positionYOnPage = pageMargin; // <<< This is where the top margin on the PDF page is applied
        let heightLeftOnImage = imgEffectiveHeight;

        pdf.addImage(imgData, 'PNG', pageMargin, positionYOnPage, imgEffectiveWidth, imgEffectiveHeight);
        heightLeftOnImage -= (pdfHeight - (2 * pageMargin));

        while (heightLeftOnImage > 0) {
            // The Y offset for the image on subsequent pages needs to account for what's already drawn
            positionYOnPage = pageMargin - (imgEffectiveHeight - heightLeftOnImage) ;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', pageMargin, positionYOnPage, imgEffectiveWidth, imgEffectiveHeight);
            heightLeftOnImage -= (pdfHeight - (2 * pageMargin));
        }

        pdf.save(pdfFilename);
        setIsTextEditModalOpen(false);

    } catch (pdfError) { /* ... error handling ... */ }
    finally {
        if (pdfContentRef.current) {
            pdfContentRef.current.innerHTML = '';
            pdfContentRef.current.style.display = 'none';
            pdfContentRef.current.style.position = '';
            pdfContentRef.current.style.left = '';
            pdfContentRef.current.style.top = '';
            pdfContentRef.current.style.width = '';
        }
        setIsGeneratingPdf(false);
    }
};


  const toggleFilter = () => {
    setIsFiltered(!isFiltered);
    fetchOrders();
  };

  const DraggableRow = ({ order, index, list, moveOrderUp, moveOrderDown, moveOrder, onComplete, onFilter, showMeasureLocation, onDeleteItem }) => {
    const ref = React.useRef(null);
  
    const [, drop] = useDrop({
      accept: ItemType.ORDER,
      drop: (draggedItem) => {
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
        <td data-label="pktNr:">{order.pktNr || '-'}</td>
        {showMeasureLocation && <td data-label="Mätplats:">{order.measureLocation || '-'}</td>}
        <td data-label="Information:">{order.description || '-'}</td>
        <td data-label="Lagerplats:">{order.location || '-'}</td>
        <td data-label="Åtgärder:" className={styles.actionsCell}> {/* Changed label for clarity */}
          {!order.completed && (
            <button onClick={() => onComplete(order._id)} className={styles.completeButton} title="Markera som avklarad/bearbetad">
              ✓ {/* Checkmark */}
            </button>
          )}
          {/* Conditionally render Delete button for "Lager" items that are not completed */}
          {order.customer === "Lager" && !order.completed && hasPermission('prilista', 'delete') && (
            <button 
              onClick={() => onDeleteItem(order._id)} 
              className={styles.deleteItemButton} // Add a new style for this button
              title="Radera denna Lager-artikel"
            >
              ✕ {/* Cross mark (X) */}
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
        {hasPermission('prilista', 'create') && (
        <button
          className={styles.createButton}
          onClick={() => navigate('/dashboard/new-prilista')}
        >
          Skapa ny okantad
        </button>
        )}
        {/* --- ADD PDF DOWNLOAD BUTTON --- */}
        <button onClick={handleDownloadPrilistaPDF} className={styles.downloadPdfButton} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? 'Genererar PDF...' : 'Ladda Ner PDF'}
        </button>
        <button onClick={handleGenerateEditableText} className={styles.editTextButton} disabled={isGeneratingPdf}>
          Redigera Text & Skapa PDF
        </button>
        {/* ----------------------------- */}
        <button onClick={toggleFilter}>
          {isFiltered ? "Visa alla ordrar tillsammans" : "Gruppera efter mätplats"}
        </button>
      </div>
      {/* --- HIDDEN DIV FOR PDF TABLE --- */}
      <div ref={pdfContentRef} style={{ display: 'none' }}></div>
      {/* ------------------------------- */}
      {/* --- MODAL FOR EDITING TEXT --- */}
        {isTextEditModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsTextEditModalOpen(false)}>
              <div className={styles.modalContentTextEdit} onClick={(e) => e.stopPropagation()}>
                  <h2 className={styles.modalTitle}>Redigera Prilista Text</h2>
                  <textarea
                      className={styles.editableTextArea}
                      value={editablePdfText}
                      onChange={(e) => setEditablePdfText(e.target.value)}
                      rows="20" // Adjust rows as needed
                  />
                  <div className={styles.textEditModalActions}>
                      <button
                          onClick={handleSaveEditedTextAsPDF}
                          className={styles.saveTextPdfButton}
                          disabled={isGeneratingPdf}
                      >
                          {isGeneratingPdf ? 'Genererar PDF...' : 'Spara som PDF'}
                      </button>
                      <button
                          onClick={() => setIsTextEditModalOpen(false)}
                          className={styles.cancelTextEditButton}
                          disabled={isGeneratingPdf}
                      >
                          Avbryt
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* --- END TEXT EDIT MODAL --- */}
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
                <th>Pkt Nr</th>
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
                  onDeleteItem={handleDeletePrilistaItem}
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
                <th>Pkt Nr</th>
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
                <th>Pkt Nr</th>
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
                  onDeleteItem={handleDeletePrilistaItem}
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
                <th>Pkt Nr</th>
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
                  onDeleteItem={handleDeletePrilistaItem}
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
                <th>Pkt Nr</th>
                <th>Mätplats</th>
                <th>Information</th>
                <th>Lagerplats</th>
                <th>Avklarad</th>
              </tr>
            </thead>
            <tbody>
              {allOrders
                .sort((a, b) => a.position - b.position)
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
                    onDeleteItem={handleDeletePrilistaItem}
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
