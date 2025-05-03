import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewPrilista.module.css";

const CreatePrilista = () => {
  const [orders, setOrders] = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [quantity, setQuantity] = useState("");
  const [size, setSize] = useState("");
  const [type, setType] = useState("");
  const [dimension, setDimension] = useState("");
  const [description, setDescription] = useState("");
  const [measureLocation, setMeasureLocation] = useState("");
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });
  
        // Filter out orders with status "Delivered"
        const filteredOrders = response.data.filter(order => order.status !== "Delivered");
  
        setOrders(filteredOrders); // Update state with filtered orders
      } catch (err) {
        setError("Failed to fetch orders. Please try again later.");
      }
    };
  
    fetchOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPrilista = {
      orderNumber,
      customer,
      quantity: parseInt(quantity, 10),
      size,
      type,
      dimension,
      location: "-",
      description,
      completed,
      measureLocation,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/prilista/create`, newPrilista, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      const createdPrilistaId = response.data.prilistaId;

      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}/add-prilista`, {
        prilistaId: createdPrilistaId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });

      //alert("PRILISTA created and added to the order successfully!");
      // Redirect user to the Prilista page
      navigate("/dashboard/prilista");

      // Reset form fields
      setOrderNumber("");
      setCustomer("");
      setQuantity("");
      setSize("");
      setType("");
      setDimension("");
      setDescription("");
      setMeasureLocation("");
      setCompleted(false);
      setError(null);
    } catch (err) {
      setError("Misslyckades att skapa en ny PRILISTA. Försök igen eller kontakta support.");
    }
  };

  const handleOrderSelect = (selectedOrder) => {
    setOrderNumber(selectedOrder.orderNumber);
    setCustomer(selectedOrder.customer);
    // Do not set other fields
    setQuantity("");
    setSize("");
    setType("");
    setDimension("");
    setDescription("");
    setMeasureLocation("");
    setCompleted(false);
    setError(null);
  };

  return (
    <div className={styles.newPrilistaContainer}>
      <h2>Skapa ny Prilista</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        {/* Select Order */}
        <label>Ordrar: <span className={styles.optional}>(Frivillig)</span></label>
        <select
          className={styles.selectOrder}
          onChange={(e) => {
            const selectedOrderNumber = e.target.value;
            if (selectedOrderNumber) {
              // Only try to find the order if the value is not empty
              handleOrderSelect(orders.find(order => order.orderNumber === parseInt(selectedOrderNumber)));
            } else {
              // Reset the fields when no order is selected
              setOrderNumber("");
              setCustomer("");
              setQuantity("");
              setSize("");
              setType("");
              setDimension("");
              setDescription("");
              setMeasureLocation("");
              setCompleted(false);
            }
          }}
          value={orderNumber}
        >
          <option value="">-- Välj aktiv order --</option>
          {orders.map((order) => (
            <option key={order._id} value={order.orderNumber}>
              {order.orderNumber} - {order.customer}
            </option>
          ))}
        </select>

        <label>Order nummer:</label>
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          required
        />

        {/* Customer */}
        <label>Kund:</label>
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          required
        />

        {/* Quantity */}
        <label>Antal:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        {/* Dimension */}
        <label>Dimension:</label>
        <input
          type="text"
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
          required
        />

        {/* Size */}
        <label>Storlek:</label>
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          required
        />

        {/* Type */}
        <label>Träslag:</label>
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        {/* MeasureLocation */}
        <label>Mätplats: <span className={styles.optional}>(Frivillig)</span></label>
        <select
          className={styles.selectOrder}
          value={measureLocation}
          onChange={(e) => setMeasureLocation(e.target.value)}
        >
          <option value="">Välj Mätplats</option>
          <option value="Ishallen">Ishallen</option>
          <option value="B-sidan">B-sidan</option>
          <option value="A-sidan">A-sidan</option>
        </select>

        {/* Description */}
        <label className={styles.textareaLabel}>Information: <span className={styles.optional}>(Frivillig)</span></label>
        <textarea
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Skapa PRILISTA</button>
      </form>
    </div>
  );
};

export default CreatePrilista;
