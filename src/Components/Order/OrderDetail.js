import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './order.css';

const OrderDetailComp = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [prilistaDetails, setPrilistaDetails] = useState([]);
  const [kantlistaDetails, setKantlistaDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

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
      prilistaH3: '',
      vehicleBorder: ''
    };
  
    // Create and add an h2 dynamically for the PDF
    const tempH2 = document.createElement('h2');
    tempH2.innerText = 'UTLASTNINGSORDER';
    tempH2.style.textAlign = 'center';
    tempH2.style.marginBottom = '80px';
    tempH2.style.fontSize = '24px';
    tempH2.id = 'tempH2PDF';
    element.prepend(tempH2);
  
    // Hide buttons or any elements you want to exclude
    const buttons = document.querySelectorAll('.exclude-from-pdf');
    buttons.forEach((button) => {
      // Store original display style before hiding
      originalStyles.buttons.push(button.style.display);
      button.style.display = 'none';
    });
  
    const prilistor = document.querySelectorAll('.prilistaItem');
    prilistor.forEach((prilistor) => {
      // Store original styles before modifying
      originalStyles.prilistaItems.push({
        border: prilistor.style.border,
        padding: prilistor.style.padding
      });
      prilistor.style.border = 'none';
      prilistor.style.padding = "0px";
    });

    const kantlistor = document.querySelectorAll('.kantlistaItem');
    kantlistor.forEach((kantlistor) => {
      // Store original styles before modifying
      originalStyles.kantlistaItems.push({
        border: kantlistor.style.border,
        padding: kantlistor.style.padding
      });
      kantlistor.style.border = 'none';
      kantlistor.style.padding = "0px";
    });
  
    element.style.backgroundColor = '#fff';
    element.style.border = "none";
    element.style.boxShadow = "none";
  
    const prilistaH3 = document.getElementById('prilistaH3');
    // Store original marginTop before changing
    originalStyles.prilistaH3 = prilistaH3.style.marginTop;
    prilistaH3.style.marginTop = "60px";
  
    const vehicleBorder = document.getElementById('vehicleBorder');
    // Store original border before changing
    originalStyles.vehicleBorder = vehicleBorder.style.borderBottom;
    vehicleBorder.style.borderBottom = "none";
  
    // Generate the PDF
    html2canvas(element, {
      scale: 2,
      backgroundColor: null,
      useCORS: false,
      allowTaint: true,
    }).then((canvas) => {
      element.style.backgroundColor = '';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
  
      let position = 0;

      pdf.setFontSize(22);
      pdf.text('UTLASTNINGSORDER', 105, 20, { align: 'center' });
  
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
  
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
  
      pdf.save(`Order-${orderNumber}-${orderDetails.customer}.pdf`);
  
      // Restore visibility of buttons
      buttons.forEach((button, index) => {
        button.style.display = originalStyles.buttons[index];
      });
  
      // Restore original styles for prilistaItems
      prilistor.forEach((prilistor, index) => {
        const styles = originalStyles.prilistaItems[index];
        prilistor.style.border = styles.border;
        prilistor.style.padding = styles.padding;
      });
      
      // Restore original styles for prilistaItems
      kantlistor.forEach((kantlistor, index) => {
        const styles = originalStyles.kantlistaItems[index];
        kantlistor.style.border = styles.border;
        kantlistor.style.padding = styles.padding;
      });
  
      // Restore original styles for prilistaH3 and vehicleBorder
      prilistaH3.style.marginTop = originalStyles.prilistaH3;
      vehicleBorder.style.borderBottom = originalStyles.vehicleBorder;
    }).catch((error) => {
      console.error('Error generating PDF:', error);
  
      // Restore visibility of buttons in case of an error
      buttons.forEach((button, index) => {
        button.style.display = originalStyles.buttons[index];
      });
  
      // Restore original styles for prilistaItems
      prilistor.forEach((prilistor, index) => {
        const styles = originalStyles.prilistaItems[index];
        prilistor.style.border = styles.border;
        prilistor.style.padding = styles.padding;
      });

      // Restore original styles for prilistaItems
      kantlistor.forEach((kantlistor, index) => {
        const styles = originalStyles.kantlistaItems[index];
        kantlistor.style.border = styles.border;
        kantlistor.style.padding = styles.padding;
      });
  
      // Restore original styles for prilistaH3 and vehicleBorder
      prilistaH3.style.marginTop = originalStyles.prilistaH3;
      vehicleBorder.style.borderBottom = originalStyles.vehicleBorder;
    })
    .finally(() => {
      // Remove the temporary h2
      tempH2.remove();
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
      alert('Order marked as Levererad!');
    } catch (err) {
      console.error('Failed to mark order as delivered:', err);
      setError(err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/edit-order/${orderNumber}`);
  };

  const totalPackets = prilistaDetails.reduce((sum, item) => sum + item.quantity, 0) +
  kantlistaDetails.reduce((sum, item) => sum + item.antal, 0);

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
          <button className="exclude-from-pdf" onClick={() => handleMarkAsDelivered()}>
            Markera som Levererad
          </button>
          <button className="editBtn exclude-from-pdf" onClick={handleEdit}>Redigera Order</button>
        </div>
      </div>
      <div id="vehicleBorder" className="vehicleDetails">
        <p>Speditör: BIL {totalPackets} PKT</p>
      </div>
      <div className="prilistaDetails">
        <h3 id="prilistaH3">Lista mätning</h3>
        {prilistaDetails.length > 0 ? (
          <div className="prilistaList">
            {prilistaDetails.map((item, index) => (
              <div key={index} className="prilistaItem">
                <p>{item.quantity} pkt {item.dimension} MM {item.size}</p>
                <p>{item.description}</p>
                {!item.completed && (
                  <button className="finishedBtn exclude-from-pdf" onClick={() => handleComplete(item._id, 'prilista')}>Markera som avklarad</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>Inga listor för mätning funna.</p>
        )}
      </div>
      <div className="kantlistaDetails">
        {kantlistaDetails.length > 0 ? (
          <>
          <h3 id="kantlistaH3">Lista kantning</h3>
          <div className="kantlistaList">
            {kantlistaDetails.map((item, index) => (
              <div key={index} className="kantlistaItem">
                <p>{item.antal} pkt {item.tjocklek} x {item.bredd}</p>
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
      <div className="rightOrderText">
        <p>Ansgarius Svensson AB</p>
        <p>{formattedDate}</p>
      </div>
    </div>
  );  
};

export default OrderDetailComp;
