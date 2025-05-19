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

    // Store the original styles to restore them later
    const originalStyles = {
        buttons: [],
        prilistaItems: [],
        kantlistaItems: [],
        klupplistaItems: [],
        // Specific styles we will change for PDF
        prilistaH3_marginTop: '',
        // ** Store original styles for vehicleBorder **
        vehicleBorder_borderBottom: '', // ADDED: To store original border
        vehicleBorder_marginBottom: '',
        notesSection_marginTop: '',
        // Container styles
        elementBorder: element.style.border,
        elementBoxShadow: element.style.boxShadow,
        elementBgColor: element.style.backgroundColor,
        elementPadding: element.style.padding
    };

    // --- Prepare HTML for Canvas ---

    // 1. Add main title (centered)
    const tempH2 = document.createElement('h2');
    tempH2.innerText = 'UTLASTNINGSORDER';
    tempH2.style.textAlign = 'center';
    tempH2.style.marginBottom = '0px'; // Adjusted for tighter layout
    tempH2.style.marginTop = '10px';  // Added some top margin
    tempH2.style.fontSize = '24px';
    tempH2.id = 'tempH2PDF';
    element.prepend(tempH2);

    // 2. Hide buttons/elements
    const buttons = document.querySelectorAll('.exclude-from-pdf');
    buttons.forEach((button) => {
        originalStyles.buttons.push(button.style.display);
        button.style.display = 'none';
    });

    // 3. Simplify list item styling
    const prilistor = document.querySelectorAll('.prilistaItem');
    prilistor.forEach((prilistor) => {
        originalStyles.prilistaItems.push({
            border: prilistor.style.border,
            padding: prilistor.style.padding,
            marginBottom: prilistor.style.marginBottom,
            marginTop: prilistor.style.marginTop // Store original marginTop too
        });
        prilistor.style.border = 'none';
        prilistor.style.padding = "0px";
        prilistor.style.marginBottom = "5px";
        prilistor.style.marginTop = "0px";
    });

    const kantlistor = document.querySelectorAll('.kantlistaItem');
    kantlistor.forEach((kantlistor) => {
        originalStyles.kantlistaItems.push({
            border: kantlistor.style.border,
            padding: kantlistor.style.padding,
            marginBottom: kantlistor.style.marginBottom
        });
        kantlistor.style.border = 'none';
        kantlistor.style.padding = "0px";
        kantlistor.style.marginBottom = "5px";
    });

    const klupplistor = document.querySelectorAll('.klupplistItem'); // Select klupplist items
    klupplistor.forEach((kluppItem) => {
        originalStyles.klupplistaItems.push({ // Store original styles
            border: kluppItem.style.border,
            padding: kluppItem.style.padding,
            marginBottom: kluppItem.style.marginBottom, // Store margins if needed
            marginTop: kluppItem.style.marginTop
        });
        kluppItem.style.border = 'none'; // Remove border for PDF
        kluppItem.style.padding = "0px"; // Remove padding for PDF
        kluppItem.style.marginBottom = "5px"; // Add consistent spacing
        kluppItem.style.marginTop = "0px";
    });

    // 4. Adjust overall container and specific element styles

    // Container styles
    element.style.backgroundColor = '#fff';
    element.style.border = "none";
    element.style.boxShadow = "none";
    element.style.padding = "5px";

    // ** Vehicle details div - EXPLICITLY REMOVE border-bottom for PDF **
    const vehicleBorder = document.getElementById('vehicleBorder');
    if (vehicleBorder) {
        originalStyles.vehicleBorder_borderBottom = vehicleBorder.style.borderBottom; // Store original CSS border
        originalStyles.vehicleBorder_marginBottom = vehicleBorder.style.marginBottom;

        vehicleBorder.style.borderBottom = "none"; // <-- REMOVE BORDER FOR PDF
        vehicleBorder.style.marginBottom = "20px"; // Ensure adequate space below (adjust as needed)
    }

    // Prilista heading - Adjust top margin if needed
    const prilistaH3 = document.getElementById('prilistaH3');
    if (prilistaH3) {
        originalStyles.prilistaH3_marginTop = prilistaH3.style.marginTop;
        prilistaH3.style.marginTop = "40px"; // Start right after the vehicle section's margin
    }

    // Notes section margin
    const notesSection = element.querySelector('.orderNotesSection');
    if (notesSection) {
        originalStyles.notesSection_marginTop = notesSection.style.marginTop;
        notesSection.style.marginTop = '30px';
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
        const textY = margin + 5;
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

        prilistor.forEach((prilistor, index) => {
            const styles = originalStyles.prilistaItems[index];
            if (styles) {
                prilistor.style.border = styles.border;
                prilistor.style.padding = styles.padding;
                prilistor.style.marginBottom = styles.marginBottom || '';
                prilistor.style.marginTop = styles.marginTop || ''; // Restore marginTop
            }
        });

        kantlistor.forEach((kantlistor, index) => {
            const styles = originalStyles.kantlistaItems[index];
            if (styles) {
                kantlistor.style.border = styles.border;
                kantlistor.style.padding = styles.padding;
                kantlistor.style.marginBottom = styles.marginBottom || '';
            }
        });

         // --- RESTORE KLUPPLISTA STYLES ---
        klupplistor.forEach((kluppItem, index) => {
          const styles = originalStyles.klupplistaItems[index];
          if (styles) {
              kluppItem.style.border = styles.border;
              kluppItem.style.padding = styles.padding;
              kluppItem.style.marginBottom = styles.marginBottom || '';
              kluppItem.style.marginTop = styles.marginTop || '';
          }
      });

        // Restore specific elements
         if (prilistaH3) {
             prilistaH3.style.marginTop = originalStyles.prilistaH3_marginTop || '';
         }
         // ** Restore vehicleBorder **
         if (vehicleBorder) {
             vehicleBorder.style.borderBottom = originalStyles.vehicleBorder_borderBottom || ''; // Restore original border
             vehicleBorder.style.marginBottom = originalStyles.vehicleBorder_marginBottom || '';
         }
        if (notesSection) {
            notesSection.style.marginTop = originalStyles.notesSection_marginTop || '';
        }

        // Restore container styles
        element.style.border = originalStyles.elementBorder || '';
        element.style.boxShadow = originalStyles.elementBoxShadow || '';
        element.style.backgroundColor = originalStyles.elementBgColor || '';
        element.style.padding = originalStyles.elementPadding || '';
    });
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

  return (
    <div id="orderDetailPDF" className="orderDetail">
      <h3 id="orderDetailH2PDF" className="h2ToPdf">UTLASTNINGSORDER
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
          <p>Skapad: {formattedDate}</p>
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
        <h3 id="prilistaH3">Okantad</h3>
          <div className="prilistaList">
            {prilistaDetails.map((item, index) => (
              <div key={index} className="prilistaItem">
                <p>{item.quantity}PKT {item.dimension}MM {item.size} {item.type}</p>
                <p>{item.description}</p>
                {!item.completed && (
                  <button className="finishedBtn exclude-from-pdf" onClick={() => handleComplete(item._id, 'prilista')}>Markera som avklarad</button>
                )}
              </div>
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
          <h3 id="kantlistaH3">Kantad</h3>
          <div className="kantlistaList">
            {kantlistaDetails.map((item, index) => (
              <div key={index} className="kantlistaItem">
                <p>{item.antal}PKT {item.tjocklek}x{item.bredd}MM {item.max_langd}M</p>
                <p>{item.information}</p>
                {!item.status.klar && (
                  <button className="finishedBtn exclude-from-pdf" onClick={() => handleComplete(item._id, 'kantlista')}>Markera som mätt</button>
                )}
                {!item.status.kapad && (
                  <button className="finishedBtn exclude-from-pdf" onClick={() => handleCut(item._id, 'kantlista')}>Markera som kapad</button>
                )}
              </div>
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
                    {item.antal}PKT {item.dimension}MM {item.sagverk} {item.pktNumber} {item.max_langd} {item.sort}
                  </p>
                  {/* Add other fields like special, magasin, leveransDatum if needed */}
                  {item.information && <p>{item.information}</p>}
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
      {orderDetails && orderDetails.notes.length > 0 && (
        <div className="orderNotesSection">
            <h4>Anteckningar</h4> {/* Heading for the notes */}
            <p>{orderDetails.notes}</p> {/* Display the notes */}
        </div>
      )}
      <div className="rightOrderText">
        <p>Södra Vi den {formattedDate}</p>
        <p>Ansgarius Svensson AB</p>
      </div>
    </div>
  );  
};

export default OrderDetailComp;
