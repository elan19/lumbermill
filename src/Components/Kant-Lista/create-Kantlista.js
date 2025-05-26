import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CreateKantLista.module.css"; // Assuming your styles are in this file
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateKantlista = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [antal, setAntal] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [varv, setVarv] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [stampel, setStampel] = useState("");
  const [typ, setTyp] = useState("FURU");
  const [location, setLocation] = useState("");
  const [information, setInformation] = useState("");
  const [statusKapad, setStatusKapad] = useState(false);
  const [statusKlar, setStatusKlar] = useState(false);
  const [isLager, setIsLager] = useState(false); // New state for "Lager" toggle
  const [pktNr, setPktNr] = useState("");
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const shouldForceLager = !hasPermission('orders', 'create');

  useEffect(() => {
    if (shouldForceLager) {
        setIsLager(true);
    }
  }, [shouldForceLager]);

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

    const finalCustomer = isLager || shouldForceLager ? "Lager" : customer;
      const finalOrderNumber = isLager || shouldForceLager ? null : parseInt(orderNumber, 10);
      const finalAntal = isLager || shouldForceLager ? null : antal;

    const newKantlista = {
      orderNumber: finalOrderNumber, // Set orderNumber to null if it's for "Lager"
      customer: finalCustomer, // Set customer to "Lager" if it's for "Lager"
      antal: finalAntal,
      bredd: width,
      tjocklek: thickness,
      varv,
      max_langd: maxLength,
      stampel,
      typ,
      lagerplats: location,
      information,
      pktNr: pktNr || "", // Ensure pktNr is always a string
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
      setPktNr("");
      setTyp("FURU");
      setStatusKapad(false);
      setStatusKlar(false);
      setIsLager(false); // Reset "Lager" toggle

      navigate('/dashboard/kantlista');
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
    setPktNr("");
  };

  return (
    <div className={styles.newKantlistaContainer}>
      <h2>Skapa ny Kantad</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Toggle for "Lager" */}
        <label>
          <input
              type="checkbox"
              checked={isLager || shouldForceLager} // Always checked if shouldForceLager
              onChange={(e) => {
                  // Only allow the user to change the setting if they have permission
                  if (!shouldForceLager) {
                      setIsLager(e.target.checked);
                  }
              }}
              disabled={shouldForceLager} // Disable if shouldForceLager
          />
          Lager
      </label>

        {/* Conditionally render order selection if not for "Lager" */}
        {!(isLager || shouldForceLager) && (
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
                          setTyp("FURU");
                          setLocation("");
                          setInformation("");
                          setPktNr("");
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

        <label>Träslag:</label> {/* Added htmlFor for accessibility */}
        <select
          value={typ}
          className={styles.selectOrder}
          onChange={(e) => setTyp(e.target.value)}
          required
        >
          <option value="FURU">FURU</option>
          <option value="GRAN">GRAN</option>
        </select>

        <label>Dimension:</label>
        <input
          type="text"
          value={thickness}
          placeholder="50"
          onChange={(e) => setThickness(e.target.value)}
          required
        />

        <label>Bredd:</label>
        <input
          type="text"
          value={width}
          placeholder="125"
          onChange={(e) => setWidth(e.target.value)}
          required
        />

        <label>Varv:</label>
        <input
          type="text"
          value={varv}
          placeholder="14"
          onChange={(e) => setVarv(e.target.value)}
          required
        />

        <label>Max längd:</label>
        <input
          type="text"
          value={maxLength}
          placeholder="4.3"
          onChange={(e) => setMaxLength(e.target.value)}
        />

        <label>Paketnummer: <span className={styles.optional}>(Frivillig)</span></label>
        <input
          type="text"
          value={pktNr}
          placeholder="Paketnummer"
          onChange={(e) => setPktNr(e.target.value)}
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

        <button type="submit">Skapa KANTAD</button>
      </form>
    </div>
  );
};

export default CreateKantlista;