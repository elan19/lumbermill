import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './order.css';

import { useAuth } from '../../contexts/AuthContext';

const OrderDetailComp = () => {
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
    if (!token) {
      setError('No token found. Please log in.');
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderNumber]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('orderDetailPDF');
    if (!element) {
        console.error('Element with ID orderDetailPDF not found');
        return;
    }

    const originalStyles = {
        buttons: [],
        prilistaItems: [],
        kantlistaItems: [],
        klupplistaItems: [],
        prilistaH3_marginTop: '',
        prilistaH3_marginBottom: '', // Store original marginBottom for H3
        kantlistaH3_marginTop: '',   // For Kantlista H3
        kantlistaH3_marginBottom: '',// For Kantlista H3
        klupplistaH3_marginTop: '', // For Klupplista H3
        klupplistaH3_marginBottom: '',// For Klupplista H3
        prilistaTypeSubheading_styles: [], // To store multiple subheading styles
        kantlistaTypeSubheading_styles: [], // To store multiple subheading styles
        vehicleBorder_borderBottom: '',
        vehicleBorder_marginBottom: '',
        notesSection_marginTop: '',
        notesSection_padding: '', // Store original padding for notes
        elementBorder: element.style.border,
        elementBoxShadow: element.style.boxShadow,
        elementBgColor: element.style.backgroundColor,
        elementPadding: element.style.padding,
        // To store styles for paragraph tags within items
        itemParagraphs_prilista: [],
        itemParagraphs_kantlista: [],
        itemParagraphs_klupplista: []
    };

    // --- Prepare HTML for Canvas ---
    const tempH2 = document.createElement('h2');
    tempH2.innerText = 'UTLASTNINGSORDER';
    tempH2.style.textAlign = 'center';
    tempH2.style.marginBottom = '0px'; // Further reduced for tighter layout
    tempH2.style.fontSize = '22px';   // Slightly smaller title
    tempH2.id = 'tempH2PDF';
    element.prepend(tempH2);

    const buttons = document.querySelectorAll('.exclude-from-pdf');
    buttons.forEach((button) => {
        originalStyles.buttons.push(button.style.display);
        button.style.display = 'none';
    });

    // --- Adjust List Item Styling (Prilista, Kantlista, Klupplista) ---
    const processListItems = (listSelector, originalStylesArray, itemParagraphsArray) => {
        const items = document.querySelectorAll(listSelector);
        items.forEach((item) => {
            originalStylesArray.push({
                border: item.style.border,
                padding: item.style.padding,
                marginBottom: item.style.marginBottom,
                marginTop: item.style.marginTop,
                // Optionally store font size if you change it
                // fontSize: item.style.fontSize 
            });
            item.style.border = 'none';
            item.style.padding = "0px";  // Minimal padding for the item container
            item.style.marginBottom = "2px"; // Reduce space between items
            item.style.marginTop = "0px";
            // item.style.fontSize = "10pt"; // OPTIONAL: Reduce font size of item text

            // Adjust paragraphs within the item
            const paragraphs = item.querySelectorAll('p');
            paragraphs.forEach(p => {
                itemParagraphsArray.push({
                    element: p, // Store reference to the element
                    marginBottom: p.style.marginBottom,
                    marginTop: p.style.marginTop,
                    lineHeight: p.style.lineHeight,
                    fontSize: p.style.fontSize // Store original font size
                });
                p.style.marginBottom = "0px"; // Remove bottom margin from paragraph
                p.style.marginTop = "0px";   // Remove top margin from paragraph
                p.style.lineHeight = "0.6";  // Reduce line height for tighter text
                // p.style.fontSize = "9pt"; // OPTIONAL: Make paragraph font even smaller
            });
        });
    };

    processListItems('.prilistaItem', originalStyles.prilistaItems, originalStyles.itemParagraphs_prilista);
    processListItems('.kantlistaItem', originalStyles.kantlistaItems, originalStyles.itemParagraphs_kantlista);
    processListItems('.klupplistItem', originalStyles.klupplistaItems, originalStyles.itemParagraphs_klupplista);


    // --- Adjust Heading Styling ---
    const processHeadingStyles = (selector, originalMarginTopKey, originalMarginBottomKey) => {
        const heading = document.getElementById(selector);
        if (heading) {
            originalStyles[originalMarginTopKey] = heading.style.marginTop;
            originalStyles[originalMarginBottomKey] = heading.style.marginBottom;
            heading.style.marginTop = "0px"; // Space above main category heading
            heading.style.marginBottom = "0px"; // Space below main category heading, before first sub-group
            // heading.style.fontSize = "14pt"; // Optional: Adjust heading font size
        }
    };
    processHeadingStyles('prilistaH3', 'prilistaH3_marginTop', 'prilistaH3_marginBottom');
    processHeadingStyles('kantlistaH3', 'kantlistaH3_marginTop', 'kantlistaH3_marginBottom');
    processHeadingStyles('klupplistaH3', 'klupplistaH3_marginTop', 'klupplistaH3_marginBottom');

    // Adjust Type Subheadings (e.g., OKANTAD FURU)
    const processTypeSubheadings = (listSelector, originalStylesArray) => {
        const subheadings = document.querySelectorAll(listSelector);
        subheadings.forEach(sh => {
            originalStylesArray.push({
                element: sh,
                marginTop: sh.style.marginTop,
                marginBottom: sh.style.marginBottom,
                fontSize: sh.style.fontSize
            });
            sh.style.marginTop = "0px"; // Tighter space above type subheading
            sh.style.marginBottom = "0px"; // Tighter space below type subheading, before items
            // sh.style.fontSize = "11pt"; // Optional: Adjust subheading font size
        });
    };
    processTypeSubheadings('.prilistaTypeSubheading', originalStyles.prilistaTypeSubheading_styles);
    processTypeSubheadings('.kantlistaTypeSubheading', originalStyles.kantlistaTypeSubheading_styles);


    element.style.backgroundColor = '#fff';
    element.style.border = "none";
    element.style.boxShadow = "none";
    element.style.padding = "0px 0px"; // Add a little horizontal padding if needed

    const vehicleBorder = document.getElementById('vehicleBorder');
    if (vehicleBorder) {
        originalStyles.vehicleBorder_borderBottom = vehicleBorder.style.borderBottom;
        originalStyles.vehicleBorder_marginBottom = vehicleBorder.style.marginBottom;
        vehicleBorder.style.borderBottom = "none";
        vehicleBorder.style.marginBottom = "0px"; // Reduce space after vehicle details
    }

    const notesSection = element.querySelector('.orderNotesSection');
    if (notesSection) {
        originalStyles.notesSection_marginTop = notesSection.style.marginTop;
        originalStyles.notesSection_padding = notesSection.style.padding; // Store original padding
        notesSection.style.marginTop = '0px';
        notesSection.style.padding = '0px';      // Remove padding for notes section itself
        // Adjust paragraphs within notes if needed, similar to list items
        const notesParagraphs = notesSection.querySelectorAll('p');
        notesParagraphs.forEach(p => {
            // You might want to store and restore these too if you modify them
            p.style.marginTop = '0px';
            p.style.marginBottom = '0px'; // Small space after notes paragraph
            p.style.lineHeight = '1.2';
        });
    }

    // --- Generate PDF ---
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        const imgWidth = pdfWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = margin;

        // Add image captured by html2canvas
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);

        // Add Order Number using pdf.text() at top right
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const orderNumberText = `Nr. ${orderNumber}`;
        const textX = pdfWidth - margin;
        const textY = margin;
        pdf.text(orderNumberText, textX, textY, { align: 'right' });

        // Add subsequent pages if needed
        while (heightLeft > 0) {
            position = margin - heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            // pdf.text(orderNumberText, textX, textY, { align: 'right' }); // Optional: add number to other pages
            heightLeft -= (pdfHeight - margin * 2);
        }

        pdf.save(`Order-${orderNumber}-${orderDetails?.customer || 'details'}.pdf`);

    }).catch((error) => {
        console.error('Error generating PDF:', error);
    }).finally(() => {
        // --- Restore ALL original styles ---
        if (tempH2) {
            tempH2.remove();
        }

        buttons.forEach((button, index) => {
            button.style.display = originalStyles.buttons[index] || '';
        });

        const restoreListItems = (listSelector, originalStylesArray, itemParagraphsArray) => {
            const items = document.querySelectorAll(listSelector);
            items.forEach((item, index) => {
                const styles = originalStylesArray[index];
                if (styles) {
                    item.style.border = styles.border;
                    item.style.padding = styles.padding;
                    item.style.marginBottom = styles.marginBottom || '';
                    item.style.marginTop = styles.marginTop || '';
                    // item.style.fontSize = styles.fontSize || ''; // Restore font size
                }
            });
            itemParagraphsArray.forEach(pStyle => {
                pStyle.element.style.marginBottom = pStyle.marginBottom || '';
                pStyle.element.style.marginTop = pStyle.marginTop || '';
                pStyle.element.style.lineHeight = pStyle.lineHeight || '';
                pStyle.element.style.fontSize = pStyle.fontSize || ''; // Restore font size
            });
        };

        restoreListItems('.prilistaItem', originalStyles.prilistaItems, originalStyles.itemParagraphs_prilista);
        restoreListItems('.kantlistaItem', originalStyles.kantlistaItems, originalStyles.itemParagraphs_kantlista);
        restoreListItems('.klupplistItem', originalStyles.klupplistaItems, originalStyles.itemParagraphs_klupplista);

        const restoreHeadingStyles = (selector, originalMarginTopKey, originalMarginBottomKey) => {
            const heading = document.getElementById(selector);
            if (heading) {
                heading.style.marginTop = originalStyles[originalMarginTopKey] || '';
                heading.style.marginBottom = originalStyles[originalMarginBottomKey] || '';
                // heading.style.fontSize = originalStyles[...]; // Restore font size
            }
        };
        restoreHeadingStyles('prilistaH3', 'prilistaH3_marginTop', 'prilistaH3_marginBottom');
        restoreHeadingStyles('kantlistaH3', 'kantlistaH3_marginTop', 'kantlistaH3_marginBottom');
        restoreHeadingStyles('klupplistaH3', 'klupplistaH3_marginTop', 'klupplistaH3_marginBottom');

        const restoreTypeSubheadings = (originalStylesArray) => {
            originalStylesArray.forEach(shStyle => {
                shStyle.element.style.marginTop = shStyle.marginTop || '';
                shStyle.element.style.marginBottom = shStyle.marginBottom || '';
                shStyle.element.style.fontSize = shStyle.fontSize || '';
            });
        };
        restoreTypeSubheadings(originalStyles.prilistaTypeSubheading_styles);
        restoreTypeSubheadings(originalStyles.kantlistaTypeSubheading_styles);


        if (vehicleBorder) {
            vehicleBorder.style.borderBottom = originalStyles.vehicleBorder_borderBottom || '';
            vehicleBorder.style.marginBottom = originalStyles.vehicleBorder_marginBottom || '';
        }
        if (notesSection) {
            notesSection.style.marginTop = originalStyles.notesSection_marginTop || '';
            notesSection.style.padding = originalStyles.notesSection_padding || ''; // Restore padding
            // Restore paragraphs within notes if you modified them
            const notesParagraphs = notesSection.querySelectorAll('p');
            notesParagraphs.forEach(p => {
                // Assuming you stored original styles for these if you changed them
                p.style.marginTop = ''; // Or restore to specific original value
                p.style.marginBottom = '';
                p.style.lineHeight = '';
            });
        }

        element.style.border = originalStyles.elementBorder || '';
        element.style.boxShadow = originalStyles.elementBoxShadow || '';
        element.style.backgroundColor = originalStyles.elementBgColor || '';
        element.style.padding = originalStyles.elementPadding || '';
    });
};

// Helper function to group and sort items by type (or any other field)
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

  const fetchOrderDetails = async () => {
    try {
      // Fetch the order details
      const orderResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}`, {
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
      const prilistaResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/prilista/order/${orderNumber}`, {
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
      const kantlistaResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/kantlista/order/${orderNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      if (!kantlistaResponse.ok) {
        throw new Error(`Error: ${kantlistaResponse.status} - ${kantlistaResponse.statusText}`);
      }
      const kantlistaData = await kantlistaResponse.json();
      setKantlistaDetails(kantlistaData);

      const klupplistaResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/klupplista/order/${orderNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      if (!klupplistaResponse.ok) {
        throw new Error(`Error: ${klupplistaResponse.status} - ${klupplistaResponse.statusText}`);
      }
      const klupplistaData = await klupplistaResponse.json();
      setKlupplistaDetails(klupplistaData);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleActivateSingleOkantadItem = async (itemId) => {
    if (!token) {
        setError("Autentisering krävs för att aktivera.");
        return;
    }
    setError(null); // Clear previous errors

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/prilista/${itemId}/activate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json', // Not strictly necessary for this PUT if no body, but good practice
                Authorization: `Bearer ${token}`,
            },
            // No body needed if the backend just uses the itemId from the URL
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Fel ${response.status}: ${errorData.message || response.statusText}`);
        }

        const updatedItem = await response.json();

        // Update the local state to reflect the change immediately
        setPrilistaDetails(prevDetails =>
            prevDetails.map(item =>
                item._id === itemId ? { ...item, active: true, activatedAt: updatedItem.activatedAt } : item
            )
        );
        // Optionally, display a success message
        // setSuccessMessage(`Artikel ${updatedItem.description || itemId} aktiverad!`);

    } catch (err) {
        console.error('Failed to activate PriLista item:', err);
        setError(err.message || "Misslyckades med att aktivera artikeln.");
    }
};
  

  const handleComplete = async (id, type) => {
    try {
      const endpoint = type === 'prilista' 
        ? `${process.env.REACT_APP_API_URL}/api/prilista/complete/${id}`
        : `${process.env.REACT_APP_API_URL}/api/kantlista/completed/${id}`;
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
      fetchOrderDetails();
    } catch (err) {
      console.error('Failed to mark item as completed:', err);
      setError(err.message);
    }
  };

  const handleCut = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/kantlista/cut/${id}`, {
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
      setKantlistaDetails((prevDetails) =>
        prevDetails.map((item) =>
          item._id === updatedItem._id ? { ...item, completed: true } : item
        )
      );
      fetchOrderDetails();
    } catch (err) {
      console.error('Failed to mark item as completed:', err);
      setError(err.message);
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}/delivered`, {
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
      navigate('/dashboard/delivered');
    } catch (err) {
      console.error('Failed to mark order as delivered:', err);
      setError(err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/edit-order/${orderNumber}`);
  };

  const totalPackets = prilistaDetails.reduce((sum, item) => sum + item.quantity, 0) +
  kantlistaDetails.reduce((sum, item) => sum + item.antal, 0) + klupplistaDetails.reduce((sum, item) => sum + item.antal, 0);

  if (loading) {
    return <p>Loading order details...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!orderDetails) {
    return <p>No order details found.</p>;
  }

  const createdAt = new Date(orderDetails.createdAt);
  const formattedDate = createdAt.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  return (
    <div id="orderDetailPDF" className="orderDetail">
      <h3 id="orderDetailH2PDF" className="h2ToPdf">UTLASTNINGSORDER #{orderDetails.orderNumber}
        <button className="downloadBtn exclude-from-pdf" onClick={() => handleDownloadPDF()}>
        Ladda ner som PDF
        </button>
      </h3>
      <div className="orderHeader">
        <div className="orderInfo">
          <p>Order nr: {orderDetails.orderNumber}</p>
          <p>Köpare: {orderDetails.customer}</p>
          <p>Avsänds med bil</p>
          <p>Avrop: {orderDetails.delivery}</p>
        </div>
        <div className="markAsDelivered">
          {hasPermission('orders', 'markDelivered') && (
            <button className="exclude-from-pdf" onClick={() => handleMarkAsDelivered()}>
              Markera som Levererad
            </button>
          )}
          {hasPermission('orders', 'update') && (
            <button className="editBtn exclude-from-pdf" onClick={handleEdit}>Redigera Order</button>
          )}
        </div>
      </div>
      <div id="vehicleBorder" className="vehicleDetails">
        <p>Speditör: BIL {totalPackets} PKT {orderDetails.speditor}</p>
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
                    {groupedPrilistaItems[typeKey].map((item, index) => ( // THIS LISTS ALL ITEMS FOR THE CURRENT typeKey
                      <div key={item._id || index} className="prilistaItem">
                        <p>
                          {item.quantity}PKT {item.dimension}MM {item.size} {item.description} {item.completed && <span className="completedBadge exclude-from-pdf">✓</span>} {item.active && !item.completed && (
                          <span className="itemActiveBadge exclude-from-pdf">Aktiv</span>
                        )}
                        {!item.active && !item.completed && ( // Show button only if item is not active
                            <button 
                                onClick={() => handleActivateSingleOkantadItem(item._id)}
                                className="activateSingleOkantadBtn exclude-from-pdf"
                            >
                                Aktivera
                            </button>
                        )}
                        </p>
                        {!item.completed && (
                          <button 
                            className="finishedBtn exclude-from-pdf" 
                            onClick={() => handleComplete(item._id, 'prilista')}
                          >
                            Markera som avklarad
                          </button>
                        )}
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
                          {item.antal}PKT {item.tjocklek}x{item.bredd}MM {item.max_langd}M {item.information} {item.status.klar && item.status.kapad && <span className="completedBadge exclude-from-pdf">✓</span>} {item.active && !item.status.klar && !item.status.kapad && (
                          <span className="itemActiveBadge exclude-from-pdf">Aktiv</span>
                        )}
                        </p>
                        {!item.status.klar && (
                          <button className="finishedBtn exclude-from-pdf" onClick={() => handleComplete(item._id, 'kantlista')}>Markera som mätt</button>
                        )}
                        {!item.status.kapad && (
                          <button className="finishedBtn exclude-from-pdf" onClick={() => handleCut(item._id, 'kantlista')}>Markera som kapad</button>
                        )}
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
      <div className="klupplistaDetails">
        {/* Only render the section if there are klupplista items */}
        {klupplistaDetails.length > 0 && (
          <>
            <h3 id="klupplistaH3">Klupp</h3>
            <div className="klupplistaList">
              {klupplistaDetails.map((item, index) => (
                <div key={item._id || index} className="klupplistItem">
                  {/* Display relevant Klupplista fields */}
                  <p>
                    {item.antal}PKT {item.dimension}MM {item.sagverk} {item.pktNumber} {item.max_langd} {item.sort} {item.information}
                  </p>
                  {/* Optionally display status if needed */}
                  {/* <p>Status: {item.status?.klar ? 'Klar' : (item.status?.ej_Klar ? 'Ej Klar' : 'Okänd')}</p> */}
                   {/* Add complete/action buttons if required for Klupplista later */}
                </div>
              ))}
            </div>
          </>
        )}
        {/* Optional: Message if klupplista is empty but was expected */}
        {/* {klupplistaDetails.length === 0 && <p>Inga klupplistor funna för denna order.</p>} */}
      </div>
      {orderDetails && orderDetails.notes && orderDetails.notes.length > 0 && (
        <div className="orderNotesSection">
            <h4>Anteckningar</h4> {/* Heading for the notes */}
            <p>{orderDetails.notes}</p> {/* Display the notes */}
        </div>
      )}
      <div className="rightOrderText">
        <p>Södra Vi den {formattedDate} <br/> Ansgarius Svensson AB</p>
        <p></p>
      </div>
    </div>
  );  
};

export default OrderDetailComp;
