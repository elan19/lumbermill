import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CreateKantLista.module.css"; // Assuming your styles are in this file

const CreateKantlista = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [antal, setAntal] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [varv, setVarv] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [stampel, setStampel] = useState("");
  const [location, setLocation] = useState("");
  const [information, setInformation] = useState("");
  const [statusKapad, setStatusKapad] = useState(false);
  const [statusKlar, setStatusKlar] = useState(false);
  const [isLager, setIsLager] = useState(false); // New state for "Lager" toggle
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem('token');

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
        setOrders(filteredOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const newKantlista = {
      orderNumber: isLager ? null : parseInt(orderNumber, 10), // Set orderNumber to null if it's for "Lager"
      customer: isLager ? "Lager" : customer, // Set customer to "Lager" if it's for "Lager"
      antal: isLager ? null : antal,
      bredd: width,
      tjocklek: thickness,
      varv,
      max_langd: maxLength,
      stampel,
      lagerplats: location,
      information,
      status: {
        kapad: statusKapad,
        klar: statusKlar,
      }
    };

    try {
      // Create the new KANTLISTA
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/kantlista/create`, newKantlista, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });

      //alert("KANTLISTA skapad!");
      // Reset form fields
      setOrderNumber("");
      setCustomer("");
      setAntal("");
      setWidth("");
      setThickness("");
      setVarv("");
      setMaxLength("");
      setStampel("");
      setLocation("");
      setInformation("");
      setStatusKapad(false);
      setStatusKlar(false);
      setIsLager(false); // Reset "Lager" toggle
    } catch (err) {
      setError("Misslyckades att skapa en ny KANTLISTA. Försök igen eller kontakta support.");
    }
  };

  const handleOrderSelect = (selectedOrder) => {
    setOrderNumber(selectedOrder.orderNumber);
    setCustomer(selectedOrder.customer);
    // Do not set other fields
    setAntal("");
    setWidth("");
    setThickness("");
    setVarv("");
    setMaxLength("");
    setStampel("");
    setLocation("");
    setInformation("");
  };

  return (
    <div className={styles.newKantlistaContainer}>
      <h2>Skapa ny Kantlista</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Toggle for "Lager" */}
        <label>
          <input
            type="checkbox"
            checked={isLager}
            onChange={(e) => setIsLager(e.target.checked)}
          />
          Lager
        </label>

        {/* Conditionally render order selection if not for "Lager" */}
        {!isLager && (
          <>
            <label>Välj Order: <span className={styles.optional}>(Frivillig)</span></label>
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
                  setAntal("");
                  setWidth("");
                  setThickness("");
                  setVarv("");
                  setMaxLength("");
                  setStampel("");
                  setLocation("");
                  setInformation("");
                }
              }}
              value={orderNumber}
            >
              <option value="">-- Välj Order --</option>
              {orders.map((order) => (
                <option key={order._id} value={order.orderNumber}>
                  {order.orderNumber} - {order.customer}
                </option>
              ))}
            </select>

            <label>Order nr:</label>
            <input
              type="number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required={!isLager} // Only required if not for "Lager"
            />

            <label>Kund:</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required={!isLager} // Only required if not for "Lager"
            />

            <label>Antal:</label>
            <input
              type="text"
              value={antal}
              onChange={(e) => setAntal(e.target.value)}
              required
            />
          </>
        )}

        {/* Common fields for both "Lager" and active orders */}

        <label>Dimension:</label>
        <input
          type="text"
          value={thickness}
          onChange={(e) => setThickness(e.target.value)}
          required
        />

        <label>Bredd:</label>
        <input
          type="text"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          required
        />

        <label>Varv:</label>
        <input
          type="text"
          value={varv}
          onChange={(e) => setVarv(e.target.value)}
          required
        />

        <label>Max längd:</label>
        <input
          type="text"
          value={maxLength}
          onChange={(e) => setMaxLength(e.target.value)}
        />

        <label>Stämpel: <span className={styles.optional}>(Frivillig)</span></label>
        <input
          type="text"
          value={stampel}
          onChange={(e) => setStampel(e.target.value)}
        />

        <label>Lagerplats: <span className={styles.optional}>(Frivillig)</span></label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label>Information: <span className={styles.optional}>(Frivillig)</span></label>
        <textarea
          rows="4"
          value={information}
          onChange={(e) => setInformation(e.target.value)}
        ></textarea>

        <label>Status: <span className={styles.optional}>(Frivillig)</span></label>
        <div className={styles.checkboxGroup}>
          <label>
            <input
              type="checkbox"
              checked={statusKapad}
              onChange={(e) => setStatusKapad(e.target.checked)}
            />
            Kapad
          </label>
          <label>
            <input
              type="checkbox"
              checked={statusKlar}
              onChange={(e) => setStatusKlar(e.target.checked)}
            />
            Klar
          </label>
        </div>

        <button type="submit">Skapa KANTLISTA</button>
      </form>
    </div>
  );
};

export default CreateKantlista;